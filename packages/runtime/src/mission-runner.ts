import type { ExecutionPlan } from "@actionos/contracts";
import type { ExecutionBoundary, MissionState, VerificationStatus, ProposedCapabilityExecution } from "@actionos/domain";
import { CapabilityOutcomeUnknownError, type ExecutionBroker, type BrokerResult } from "./capability-broker";
import type { InterventionService } from "./interventions";
import type { MissionNotificationService } from "./notifications";
import { wakeIntent, type WakeIntent } from "./wake-outbox";

export interface FollowThroughMission {
  readonly missionId: string;
  readonly ownerId: string;
  readonly state: MissionState;
  readonly version: number;
  readonly plan: ExecutionPlan;
  readonly boundary: ExecutionBoundary;
  readonly actionOrdinal: number;
  readonly dueAt: string;
  readonly correlationId?: string;
  readonly nextWakeAt?: string | undefined;
  readonly lastReceiptId?: string;
  readonly lastError?: string | undefined;
  readonly controlReason?: string;
  readonly controlledAt?: string;
  readonly attemptCount?: number;
  readonly completedStatus?: VerificationStatus;
  readonly lastAttemptAt?: string;
  readonly lastActionIdempotencyKey?: string;
  readonly lastActionDuplicate?: boolean;
  readonly updatedAt?: string;
}

export interface FollowThroughStore {
  get(missionId: string): Promise<FollowThroughMission | undefined>;
  compareAndSet(
    missionId: string,
    expectedVersion: number,
    next: FollowThroughMission,
    wake?: WakeIntent
  ): Promise<void>;
}

export interface RetryScheduler {
  scheduleMission(input: {
    missionId: string;
    expectedVersion: number;
    wakeAt: string;
    correlationId?: string;
  }): Promise<unknown>;
}

export type RunResult =
  | { readonly status: "NOT_DUE"; readonly wakeAt: string }
  | { readonly status: "STALE_TASK" }
  | { readonly status: "ACTION_IN_FLIGHT" }
  | { readonly status: "WAITING_EXTERNAL"; readonly broker: BrokerResult }
  | { readonly status: "WAITING_RETRY"; readonly wakeAt: string }
  | { readonly status: "FAILED"; readonly reason: "ACTION_DENIED" }
  | { readonly status: "NEEDS_ATTENTION"; readonly reason: "RECOVERY_EXHAUSTED" | "ACTION_BUDGET_EXHAUSTED" };

function actionProposal(item: FollowThroughMission): ProposedCapabilityExecution {
  const requirement = item.plan.evidenceRequirements[0];
  if (!requirement) throw new Error("EVIDENCE_REQUIREMENT_MISSING");
  const sharedFields: Record<string, string> = { transactionRef: requirement.transactionRef };
  if (requirement.amountMinor !== undefined)
    sharedFields.amountMinor = String(requirement.amountMinor);
  if (requirement.currency !== undefined) sharedFields.currency = requirement.currency;
  if (requirement.subject !== undefined) sharedFields.subject = requirement.subject;
  if (requirement.billPeriod !== undefined) sharedFields.billPeriod = requirement.billPeriod;
  const laterFollowUp = item.actionOrdinal > 1
    ? `\n\nThis is follow-up ${String(item.actionOrdinal)}. A prior response did not include the explicit proof required to close this case. Please include the approved reference and outcome facts.`
    : "";
  return {
    ownerId: item.ownerId,
    planVersion: item.plan.version,
    planHash: item.plan.planHash,
    actionType: "SEND_FOLLOW_UP",
    recipient: item.plan.allowedRecipient,
    ...(item.plan.channelType ? { channelType: item.plan.channelType } : {}),
    ...(item.plan.messageSubject ? { subject: item.plan.messageSubject } : {}),
    ...(item.plan.messageBody ? { body: `${item.plan.messageBody}${laterFollowUp}` } : {}),
    sharedFields
  };
}

export class MissionRunner {
  constructor(
    private readonly store: FollowThroughStore,
    private readonly broker: ExecutionBroker,
    private readonly scheduler: RetryScheduler,
    private readonly retryDelaySeconds = 30,
    private readonly maxAttempts = 5,
    private readonly interventions?: InterventionService,
    private readonly terminalNotifications?: MissionNotificationService
  ) {}

  async run(input: {
    missionId: string;
    expectedVersion: number;
    now: string;
    correlationId?: string;
  }): Promise<RunResult> {
    const item = await this.store.get(input.missionId);
    if (!item) throw new Error("MISSION_NOT_FOUND");
    if (
      item.version !== input.expectedVersion ||
      !["READY", "WAITING_RETRY", "WAITING_EXTERNAL"].includes(item.state)
    ) {
      if (
        ["READY", "WAITING_RETRY", "WAITING_EXTERNAL"].includes(item.state) &&
        item.nextWakeAt
      ) {
        await this.scheduler.scheduleMission({
          missionId: item.missionId,
          expectedVersion: item.version,
          wakeAt: item.nextWakeAt,
          ...(item.correlationId ? { correlationId: item.correlationId } : {})
        });
      }
      return { status: "STALE_TASK" };
    }
    const wakeAt = item.nextWakeAt ?? item.dueAt;
    if (Date.parse(wakeAt) > Date.parse(input.now)) return { status: "NOT_DUE", wakeAt };

    const maxLogicalSends = item.plan.maxLogicalSends ?? 3;
    if (item.actionOrdinal > maxLogicalSends) {
      const caseWithoutWake = { ...item };
      delete caseWithoutWake.nextWakeAt;
      const exhausted: FollowThroughMission = {
        ...caseWithoutWake,
        state: "NEEDS_ATTENTION",
        version: item.version + 1,
        lastError: "ACTION_BUDGET_EXHAUSTED",
        updatedAt: input.now
      };
      await this.store.compareAndSet(item.missionId, item.version, exhausted);
      const correlationId = input.correlationId ?? item.correlationId ?? `corr_${item.missionId.slice(-24)}`;
      await this.interventions?.raise({
        missionId: item.missionId,
        ownerId: item.ownerId,
        correlationId,
        kind: "ACTION_BUDGET_EXHAUSTED",
        reasonCodes: ["ACTION_BUDGET_EXHAUSTED"],
        ...(item.plan.notificationRecipient
          ? { notificationRecipient: item.plan.notificationRecipient }
          : {}),
        createdAt: input.now
      });
      return { status: "NEEDS_ATTENTION", reason: "ACTION_BUDGET_EXHAUSTED" };
    }

    try {
      const broker = await this.broker.execute({
        missionId: item.missionId,
        actionOrdinal: item.actionOrdinal,
        policy: {
          ownerId: item.ownerId,
          planVersion: item.plan.version,
          planHash: item.plan.planHash,
          allowedActions: item.plan.allowedActions,
          allowedRecipient: item.plan.allowedRecipient,
          ...(item.plan.channelType ? { allowedChannel: item.plan.channelType } : {}),
          sharedFields: item.plan.sharedFields,
          boundary: item.boundary
        },
        proposal: actionProposal(item),
        now: input.now,
        ...(input.correlationId || item.correlationId
          ? { correlationId: input.correlationId ?? item.correlationId }
          : {})
      });
      if (broker.status === "DENIED")
        throw new Error(`ACTION_DENIED:${broker.decision.reasonCodes.join(",")}`);
      // Another delivery already owns this exact logical action. It must be the
      // only worker allowed to publish the resulting case transition. Moving
      // the case to WAITING_RETRY here races that owner and can orphan its
      // receipt and callback behind a VERSION_CONFLICT.
      if (broker.status === "PENDING_DUPLICATE") return { status: "ACTION_IN_FLIGHT" };
      const followUpIntervalSeconds = item.plan.followUpIntervalSeconds ?? 2 * 24 * 60 * 60;
      const nextWakeAt = new Date(
        Date.parse(input.now) + followUpIntervalSeconds * 1000
      ).toISOString();
      const waitingExternal: FollowThroughMission = {
        missionId: item.missionId,
        ownerId: item.ownerId,
        state: "WAITING_EXTERNAL",
        version: item.version + 1,
        plan: item.plan,
        boundary: item.boundary,
        actionOrdinal: item.actionOrdinal + 1,
        dueAt: item.dueAt,
        nextWakeAt,
        ...(item.correlationId || input.correlationId
          ? { correlationId: item.correlationId ?? input.correlationId }
          : {}),
        lastReceiptId: broker.receipt.receiptId,
        lastAttemptAt: input.now,
        lastActionIdempotencyKey: broker.idempotencyKey,
        lastActionDuplicate: broker.duplicate,
        updatedAt: input.now
      };
      const wake = wakeIntent({
        missionId: item.missionId,
        expectedVersion: waitingExternal.version,
        wakeAt: nextWakeAt,
        createdAt: input.now,
        ...(input.correlationId || item.correlationId
          ? { correlationId: input.correlationId ?? item.correlationId }
          : {})
      });
      await this.store.compareAndSet(item.missionId, item.version, waitingExternal, wake);
      try {
        await this.scheduler.scheduleMission(wake);
      } catch (error) {
        throw new Error("WAKE_DISPATCH_FAILED", { cause: error });
      }
      return { status: "WAITING_EXTERNAL", broker };
    } catch (error) {
      if (error instanceof Error && error.message === "WAKE_DISPATCH_FAILED") throw error;
      if (error instanceof Error && error.message.startsWith("ACTION_DENIED:")) {
        const failed: FollowThroughMission = {
          ...item,
          state: "FAILED",
          version: item.version + 1,
          lastError: error.message,
          lastAttemptAt: input.now,
          updatedAt: input.now
        };
        await this.store.compareAndSet(item.missionId, item.version, failed);
        const correlationId = input.correlationId ?? item.correlationId ?? `corr_${item.missionId.slice(-24)}`;
        await this.terminalNotifications?.notify({
          missionId: item.missionId,
          ownerId: item.ownerId,
          kind: "CASE_FAILED",
          createdAt: input.now,
          correlationId,
          ...(item.plan.notificationRecipient ? { recipient: item.plan.notificationRecipient } : {})
        });
        return { status: "FAILED", reason: "ACTION_DENIED" };
      }
      const attemptCount = (item.attemptCount ?? 0) + 1;
      if (attemptCount >= this.maxAttempts) {
        const exhausted: FollowThroughMission = {
          ...item,
          state: "NEEDS_ATTENTION",
          version: item.version + 1,
          attemptCount,
          lastError: "RECOVERY_EXHAUSTED",
          lastAttemptAt: input.now,
          updatedAt: input.now
        };
        await this.store.compareAndSet(item.missionId, item.version, exhausted);
        const correlationId =
          input.correlationId ?? item.correlationId ?? `corr_${item.missionId.slice(-24)}`;
        await this.interventions?.raise({
          missionId: item.missionId,
          ownerId: item.ownerId,
          correlationId,
          kind: "RECOVERY_EXHAUSTED",
          reasonCodes: [error instanceof Error ? error.message : "ACTION_FAILED"],
          ...(item.plan.notificationRecipient
            ? { notificationRecipient: item.plan.notificationRecipient }
            : {}),
          createdAt: input.now
        });
        return { status: "NEEDS_ATTENTION", reason: "RECOVERY_EXHAUSTED" };
      }
      const retryAt = new Date(Date.parse(input.now) + this.retryDelaySeconds * 1000).toISOString();
      const next = {
        ...item,
        state: "WAITING_RETRY" as const,
        version: item.version + 1,
        nextWakeAt: retryAt,
        lastError: error instanceof Error ? error.message : "ACTION_FAILED",
        ...(error instanceof CapabilityOutcomeUnknownError && error.idempotencyKey
          ? { lastActionIdempotencyKey: error.idempotencyKey }
          : {}),
        attemptCount,
        lastAttemptAt: input.now,
        updatedAt: input.now
      };
      const wake = wakeIntent({
        missionId: item.missionId,
        expectedVersion: next.version,
        wakeAt: retryAt,
        createdAt: input.now,
        ...(input.correlationId || item.correlationId
          ? { correlationId: input.correlationId ?? item.correlationId }
          : {})
      });
      await this.store.compareAndSet(item.missionId, item.version, next, wake);
      await this.scheduler.scheduleMission(wake);
      return { status: "WAITING_RETRY", wakeAt: retryAt };
    }
  }
}
