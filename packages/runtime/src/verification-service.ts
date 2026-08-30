import type { ExecutionOutcomeContract, ExecutionPlan } from "@actionos/contracts";
import {
  stableHash,
  verifyOutcome,
  type MissionState,
  type VerificationResult
} from "@actionos/domain";
import {
  notificationRecord,
  type NotificationRecord,
  type NotificationStore,
  type NotificationDeliveryService
} from "./notifications";
import {
  interventionRecord,
  type InterventionRecord,
  type InterventionStore
} from "./interventions";
import { wakeIntent, type WakeIntent } from "./wake-outbox";

export interface EvidenceMission {
  readonly missionId: string;
  readonly ownerId: string;
  readonly state: MissionState;
  readonly version: number;
  readonly plan: ExecutionPlan;
  readonly correlationId?: string;
  readonly nextWakeAt?: string | undefined;
}

export interface EvidenceRecord {
  readonly candidate: ExecutionOutcomeContract;
  readonly verification: VerificationResult;
  readonly recordedAt: string;
  readonly correlationId: string;
}

export interface EvidenceMissionStore {
  get(missionId: string): Promise<EvidenceMission | undefined>;
  record(input: {
    missionId: string;
    expectedVersion: number;
    nextState: MissionState;
    nextWakeAt?: string;
    verification: EvidenceRecord;
    wake?: WakeIntent;
  }): Promise<{ duplicate: boolean }>;
}

export interface EvidenceScheduler {
  scheduleMission(input: {
    missionId: string;
    expectedVersion: number;
    wakeAt: string;
    correlationId?: string;
  }): Promise<unknown>;
}

export class VerificationService {
  constructor(
    private readonly cases: EvidenceMissionStore,
    private readonly notifications: NotificationStore,
    private readonly interventions?: InterventionStore,
    private readonly delivery?: NotificationDeliveryService,
    private readonly scheduler?: EvidenceScheduler
  ) {}

  async verifyOutcome(
    candidate: ExecutionOutcomeContract,
    now: string,
    requestedCorrelationId?: string
  ): Promise<{
    status: "VERIFIED" | "INSUFFICIENT";
    verification: VerificationResult;
    notification?: NotificationRecord;
    intervention?: InterventionRecord;
  }> {
    const item = await this.cases.get(candidate.missionId);
    if (!item) throw new Error("MISSION_NOT_FOUND");
    if (!["RUNNING", "WAITING_EXTERNAL"].includes(item.state)) {
      throw new Error("EVIDENCE_NOT_ACCEPTED_IN_STATE");
    }
    const requirement = item.plan.evidenceRequirements[0];
    if (!requirement) throw new Error("EVIDENCE_REQUIREMENT_MISSING");
    const verification = verifyOutcome({ missionId: item.missionId, requirement, candidate, now });
    const correlationId =
      requestedCorrelationId ??
      item.correlationId ??
      `corr_${stableHash({ namespace: "dueback/correlation/v1", missionId: item.missionId }).slice(7, 31)}`;
    const accepted = verification.accepted;
    const conflict = !accepted && !verification.reasonCodes.includes("INSUFFICIENT_STATUS");
    const nextWakeAt = !accepted && !conflict
      ? new Date(Date.parse(now) + (item.plan.followUpIntervalSeconds ?? 2 * 24 * 60 * 60) * 1000).toISOString()
      : undefined;
    const wake = nextWakeAt ? wakeIntent({
        missionId: item.missionId,
        expectedVersion: item.version + 1,
        wakeAt: nextWakeAt,
        correlationId,
        createdAt: now
      }) : undefined;
    const recorded = await this.cases.record({
      missionId: item.missionId,
      expectedVersion: item.version,
      nextState: accepted ? "DONE" : conflict ? "NEEDS_ATTENTION" : "WAITING_EXTERNAL",
      ...(nextWakeAt ? { nextWakeAt } : {}),
      ...(wake ? { wake } : {}),
      verification: { candidate, verification, recordedAt: now, correlationId }
    });
    if (wake && !recorded.duplicate) await this.scheduler?.scheduleMission(wake);
    if (!accepted) {
      if (!conflict) {
        return { status: "INSUFFICIENT", verification };
      }
      const notification = notificationRecord({
        missionId: item.missionId,
        ownerId: item.ownerId,
        kind: "NEEDS_ATTENTION",
        createdAt: now,
        correlationId
      });
      const persistedNotification = await this.notifications.createIfAbsent(notification);
      const intervention = interventionRecord({
        missionId: item.missionId,
        ownerId: item.ownerId,
        correlationId,
        kind: "EVIDENCE_CONFLICT",
        reasonCodes: verification.reasonCodes,
        requestedField: verification.reasonCodes.includes("WRONG_AMOUNT")
          ? "amount"
          : verification.reasonCodes.includes("WRONG_CURRENCY")
            ? "currency"
            : verification.reasonCodes.includes("WRONG_REFERENCE")
              ? "transaction reference"
              : "evidence",
        createdAt: now
      });
      const persistedIntervention = this.interventions
        ? await this.interventions.createInterventionIfAbsent(intervention)
        : { record: intervention };
      const deliveredNotification = this.delivery
        ? await this.delivery.deliver(persistedNotification.record, item.plan.notificationRecipient)
        : persistedNotification.record;
      return {
        status: "INSUFFICIENT",
        verification,
        notification: deliveredNotification,
        intervention: persistedIntervention.record
      };
    }
    const record = notificationRecord({
      missionId: item.missionId,
      ownerId: item.ownerId,
      kind: "MISSION_COMPLETED",
      createdAt: now,
      correlationId
    });
    const persisted = await this.notifications.createIfAbsent(record);
    const delivered = this.delivery
      ? await this.delivery.deliver(persisted.record, item.plan.notificationRecipient)
      : persisted.record;
    return { status: "VERIFIED", verification, notification: delivered };
  }
}
