import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import type { EvidenceRecord } from "@actionos/runtime/verification-service";

export interface ConversationEntry {
  id: string;
  direction: "OUTBOUND" | "INBOUND";
  title: string;
  occurredAt?: string;
  safeBody: string;
  status: string;
  reason: string;
}

function explicitFacts(record: EvidenceRecord): string {
  const candidate = record.candidate;
  const amount = candidate.amountMinor === undefined
    ? undefined
    : candidate.currency
      ? `${candidate.currency} ${(candidate.amountMinor / 100).toFixed(2)}`
      : (candidate.amountMinor / 100).toFixed(2);
  const facts = [
    candidate.transactionRef ? `Reference ${candidate.transactionRef}` : undefined,
    amount ? `Amount ${amount}` : undefined,
    candidate.subject ? `Subject ${candidate.subject}` : undefined,
    candidate.billPeriod ? `Bill period ${candidate.billPeriod}` : undefined,
    candidate.trackingNumber ? `Tracking ${candidate.trackingNumber}` : undefined
  ].filter((value): value is string => Boolean(value));
  return facts.length ? facts.join(" · ") : "No outcome facts were explicitly stated.";
}

export function missionConversation(
  item: FollowThroughMission,
  evidence: readonly EvidenceRecord[],
  channelEvents: readonly { acceptedAt: string; transportStatus: string }[]
): ConversationEntry[] {
  const outbound = channelEvents.map((event, index) => ({
    id: `outbound-${String(index)}-${event.acceptedAt}`,
    direction: "OUTBOUND" as const,
    title: index === 0 ? "ActionOS sent the approved follow-up" : "ActionOS sent an approved follow-up",
    occurredAt: event.acceptedAt,
    safeBody: `Requested outcome: ${item.plan.goal}`,
    status: event.transportStatus,
    reason: "Provider transport status only; this does not prove the outcome."
  }));
  const inbound = evidence.map((record) => ({
    id: `inbound-${record.candidate.outcomeId}`,
    direction: "INBOUND" as const,
    title: record.candidate.level === "ACTION_ATTEMPTED"
      ? "The company acknowledged the request"
      : "ActionOS checked a company reply",
    occurredAt: record.recordedAt,
    safeBody: explicitFacts(record),
    status: record.verification.accepted ? "PROOF_ACCEPTED" : "NOT_RESOLVED",
    reason: record.verification.accepted
      ? "The explicit facts met the approved evidence contract."
      : record.verification.reasonCodes.includes("INSUFFICIENT_STATUS")
        ? "Acknowledgement is not proof that the promised outcome happened."
        : `Still needs review: ${record.verification.reasonCodes.join(", ").toLowerCase().replaceAll("_", " ")}.`
  }));
  return [...outbound, ...inbound].sort((left, right) =>
    left.occurredAt.localeCompare(right.occurredAt)
  );
}
