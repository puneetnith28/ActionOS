export interface RuntimeTimelineEvent {
  readonly eventId: string;
  readonly caseId: string;
  readonly sequence: number;
  readonly type: "PLAN_APPROVED" | "ACTION_RESULT" | "EVIDENCE_RESULT" | "CASE_CONTROL";
  readonly actor: "PERSON" | "SYSTEM" | "COUNTERPARTY";
  readonly occurredAt: string;
  readonly reasonCodes: readonly string[];
  readonly correlationId: string;
  readonly state: string;
  readonly receiptId?: string;
  readonly idempotencyKey?: string;
  readonly evidenceId?: string;
}
