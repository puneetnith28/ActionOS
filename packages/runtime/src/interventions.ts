import { stableHash } from "@actionos/domain";
import {
  notificationRecord,
  type NotificationDeliveryService,
  type NotificationStore
} from "./notifications";

export type InterventionKind =
  | "EVIDENCE_CONFLICT"
  | "RECOVERY_EXHAUSTED"
  | "ACTION_BUDGET_EXHAUSTED";

export interface InterventionRecord {
  readonly interventionId: string;
  readonly dedupeKey: string;
  readonly missionId: string;
  readonly ownerId: string;
  readonly correlationId: string;
  readonly kind: InterventionKind;
  readonly reasonCodes: readonly string[];
  readonly requestedField?: string;
  readonly question: string;
  readonly consequence: string;
  readonly allowedDecisions: readonly ("RESUME" | "REVISE" | "STOP")[];
  readonly status: "OPEN" | "RESOLVED";
  readonly createdAt: string;
}

export interface InterventionStore {
  createInterventionIfAbsent(
    record: InterventionRecord
  ): Promise<{ record: InterventionRecord; duplicate: boolean }>;
  listInterventions(missionId: string): Promise<readonly InterventionRecord[]>;
}

export function interventionRecord(input: {
  missionId: string;
  ownerId: string;
  correlationId: string;
  kind: InterventionKind;
  reasonCodes: readonly string[];
  requestedField?: string;
  createdAt: string;
}): InterventionRecord {
  const dedupeKey = stableHash({
    namespace: "actionos/intervention/v1",
    missionId: input.missionId,
    kind: input.kind,
    reasonCodes: [...input.reasonCodes].sort()
  });
  return {
    interventionId: `intervention_${dedupeKey.slice(7, 31)}`,
    dedupeKey,
    missionId: input.missionId,
    ownerId: input.ownerId,
    correlationId: input.correlationId,
    kind: input.kind,
    reasonCodes: input.reasonCodes,
    ...(input.requestedField ? { requestedField: input.requestedField } : {}),
    question: input.kind === "EVIDENCE_CONFLICT"
      ? `Does the approved ${input.requestedField ?? "evidence"} need correction?`
      : input.kind === "ACTION_BUDGET_EXHAUSTED"
        ? "Should ActionOS stop or prepare a newly approved follow-up plan?"
      : "Should ActionOS retry within the existing approved limits?",
    consequence: input.kind === "EVIDENCE_CONFLICT"
      ? "Correcting an approved fact stops the current authority and requires a new plan approval."
      : input.kind === "ACTION_BUDGET_EXHAUSTED"
        ? "The approved follow-up budget is exhausted. No more messages can be sent without a new approval."
      : "Retry continues only the already-approved action; changing any authority requires revision.",
    allowedDecisions: input.kind === "EVIDENCE_CONFLICT"
      ? ["REVISE", "STOP"]
      : input.kind === "ACTION_BUDGET_EXHAUSTED"
        ? ["REVISE", "STOP"]
      : ["RESUME", "STOP"],
    status: "OPEN",
    createdAt: input.createdAt
  };
}

export class InterventionService {
  constructor(
    private readonly interventions: InterventionStore,
    private readonly notifications: NotificationStore,
    private readonly delivery?: NotificationDeliveryService
  ) {}

  async raise(input: {
    missionId: string;
    ownerId: string;
    correlationId: string;
    kind: InterventionKind;
    reasonCodes: readonly string[];
    requestedField?: string;
    notificationRecipient?: string;
    createdAt: string;
  }): Promise<InterventionRecord> {
    const intervention = interventionRecord(input);
    const [persisted, persistedNotification] = await Promise.all([
      this.interventions.createInterventionIfAbsent(intervention),
      this.notifications.createIfAbsent(
        notificationRecord({
          missionId: input.missionId,
          ownerId: input.ownerId,
          correlationId: input.correlationId,
          kind: "NEEDS_ATTENTION",
          createdAt: input.createdAt
        })
      )
    ]);
    if (!persistedNotification.duplicate) {
      await this.delivery?.deliver(persistedNotification.record, input.notificationRecipient);
    }
    return persisted.record;
  }
}
