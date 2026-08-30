import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import type { EvidenceRecord } from "@actionos/runtime/verification-service";
import type { InterventionRecord } from "@actionos/runtime/interventions";
import type { NotificationRecord } from "@actionos/runtime/notifications";
import type { RuntimeTimelineEvent } from "@actionos/runtime/timeline";
import { activeCaseChannel, channelCopy } from "./channel-copy";
import { missionConversation } from "./mission-conversation";
import { outcomeComparison } from "./outcome-comparison";

export interface ConsumerCaseDetail {
  missionId: string;
  version: number;
  state: FollowThroughMission["state"];
  statusLabel: string;
  nextAction: string;
  goal: string;
  counterpartyName: string;
  updatedAt: string;
  nextCheckAt?: string;
  attemptCount: number;
  channel: { type: "MANAGED_EMAIL" | "CONTROLLED_SANDBOX"; label: string; disclosure: string; contact: string; reply: string; recipientHint: string };
  returnPath: string;
  outcome: { accepted: boolean; acknowledgementOnly: boolean; title: string; explanation: string; limitation: string };
  conversation: ReturnType<typeof missionConversation>;
  comparison: ReturnType<typeof outcomeComparison>;
  notifications: NotificationRecord[];
  interventions: Pick<InterventionRecord, "interventionId" | "question" | "consequence" | "allowedDecisions" | "status" | "createdAt">[];
  timeline: Pick<RuntimeTimelineEvent, "eventId" | "type" | "actor" | "occurredAt" | "reasonCodes" | "state">[];
  technicalTraceEligible: boolean;
}

const states: Record<FollowThroughMission["state"], [string, string]> = {
  DRAFT: ["Draft", "Review the extracted outcome"], AWAITING_APPROVAL: ["Approval required", "Approve the exact follow-up"],
  READY: ["Scheduled", "ActionOS will send the approved follow-up"], RUNNING: ["Sending", "The approved channel is processing the follow-up"],
  WAITING_EXTERNAL: ["Waiting for proof", "ActionOS will check the next company response"],
  VERIFYING: ["Verifying evidence", "ActionOS is reviewing the company response"],
  WAITING_RETRY: ["Retrying safely", "A bounded retry is scheduled"],
  NEEDS_ATTENTION: ["Decision needed", "Review one decision before ActionOS continues"], DONE: ["Company evidence accepted", "Check the result in the underlying account"],
  FAILED: ["Stopped after failure", "Review the recorded failure"], CANCELLED: ["Stopped", "No future external action is authorized"],
  EXPIRED: ["Expired", "Create and approve a new plan to continue"]
};

function recipientHint(value: string): string {
  return value.includes("@") ? value.replace(/(^.).*(@.*$)/, "$1•••$2") : "Controlled endpoint";
}

export function projectConsumerMission(input: {
  item: FollowThroughMission;
  evidence: readonly EvidenceRecord[];
  interventions?: readonly InterventionRecord[];
  events?: readonly RuntimeTimelineEvent[];
  notifications?: readonly NotificationRecord[];
  channelEvents?: readonly { channelType: string; transportStatus: string; acceptedAt: string; observedAt?: string }[];
}): ConsumerCaseDetail {
  const { item, evidence } = input;
  const lastChannel = input.channelEvents?.at(-1);
  const type = activeCaseChannel(lastChannel?.channelType ?? item.plan.channelType);
  const copy = channelCopy(type);
  const acknowledgementOnly = evidence.some((record) => record.candidate.status === "ACTION_ATTEMPTED" && !record.verification.accepted);
  const accepted = item.state === "DONE";
  const money = item.plan.evidenceRequirements.some((requirement) => requirement.amountMinor !== undefined);
  return {
    missionId: item.missionId,
    version: item.version,
    state: item.state,
    statusLabel: states[item.state][0],
    nextAction: acknowledgementOnly && item.state === "WAITING_EXTERNAL"
      ? item.nextWakeAt
        ? "Another approved follow-up is scheduled because the reply only acknowledged the request"
        : "Not done — the company only acknowledged the request"
      : states[item.state][1],
    goal: item.plan.goal,
    counterpartyName: item.plan.counterpartyName?.trim() || "Company",
    updatedAt: item.updatedAt ?? item.lastAttemptAt ?? item.dueAt,
    ...(item.nextWakeAt ?? item.dueAt ? { nextCheckAt: item.nextWakeAt ?? item.dueAt } : {}),
    attemptCount: item.attemptCount ?? 0,
    channel: { type, label: type === "MANAGED_EMAIL" ? "Email" : "Controlled demo", disclosure: copy.disclosure, contact: copy.contact, reply: copy.reply, recipientHint: recipientHint(item.plan.allowedRecipient) },
    returnPath: item.plan.notificationRecipient ? "Mission page and verified-owner email" : "Durable mission page",
    outcome: {
      accepted,
      acknowledgementOnly,
      title: accepted ? (money ? "Company confirmed the refund instruction" : "Company confirmed the promised outcome") : acknowledgementOnly ? "The reply did not prove the promised outcome" : "Waiting for sufficient proof",
      explanation: accepted ? "Explicit company evidence matched the approved proof contract." : acknowledgementOnly ? "ActionOS kept the mission open and scheduled the next approved step." : "ActionOS keeps this open until explicit evidence meets the approved contract.",
      limitation: money ? "Bank settlement is not verified. Check your payment account before treating the money as received." : "Independent fulfillment is not verified. Check that the promised outcome actually arrived."
    },
    conversation: missionConversation(item, evidence, input.channelEvents ?? []),
    comparison: outcomeComparison(item, evidence),
    notifications: [...(input.notifications ?? [])],
    interventions: (input.interventions ?? []).map(({ interventionId, question, consequence, allowedDecisions, status, createdAt }) => ({ interventionId, question, consequence, allowedDecisions, status, createdAt })),
    timeline: (input.events ?? []).map(({ eventId, type: eventType, actor, occurredAt, reasonCodes, state }) => ({ eventId, type: eventType, actor, occurredAt, reasonCodes, state })),
    technicalTraceEligible: item.plan.executionMode === "ACCELERATED_DEMO"
  };
}
