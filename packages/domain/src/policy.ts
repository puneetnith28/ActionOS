import type { ApprovalBoundary } from "./types";

export interface ApprovedActionPolicy {
  readonly ownerId: string;
  readonly planVersion: number;
  readonly planHash: string;
  readonly allowedActions: readonly string[];
  readonly allowedRecipient: string;
  readonly allowedChannel?: string;
  readonly sharedFields: readonly string[];
  readonly approval: ApprovalBoundary;
}

export interface ProposedAction {
  readonly ownerId: string;
  readonly planVersion: number;
  readonly planHash: string;
  readonly actionType: string;
  readonly recipient: string;
  readonly channelType?: string;
  readonly subject?: string;
  readonly body?: string;
  readonly sharedFields: Readonly<Record<string, string>>;
}

export type AuthorizationReason =
  | "AUTHORIZED"
  | "OWNER_MISMATCH"
  | "PLAN_MISMATCH"
  | "APPROVAL_EXPIRED"
  | "ACTION_NOT_ALLOWED"
  | "RECIPIENT_NOT_ALLOWED"
  | "CHANNEL_NOT_ALLOWED"
  | "FIELD_NOT_ALLOWED";

export interface AuthorizationDecision {
  readonly authorized: boolean;
  readonly reasonCodes: readonly AuthorizationReason[];
}

export function authorizeAction(
  policy: ApprovedActionPolicy,
  proposal: ProposedAction,
  now: string
): AuthorizationDecision {
  const reasons: AuthorizationReason[] = [];
  if (proposal.ownerId !== policy.ownerId || policy.approval.ownerId !== policy.ownerId) {
    reasons.push("OWNER_MISMATCH");
  }
  if (
    proposal.planVersion !== policy.planVersion ||
    proposal.planHash !== policy.planHash ||
    policy.approval.planVersion !== policy.planVersion ||
    policy.approval.planHash !== policy.planHash
  ) {
    reasons.push("PLAN_MISMATCH");
  }
  if (
    Date.parse(policy.approval.expiresAt) <= Date.parse(now) ||
    policy.approval.revokedAt !== undefined
  ) {
    reasons.push("APPROVAL_EXPIRED");
  }
  if (!policy.allowedActions.includes(proposal.actionType)) reasons.push("ACTION_NOT_ALLOWED");
  if (proposal.recipient !== policy.allowedRecipient) reasons.push("RECIPIENT_NOT_ALLOWED");
  if (policy.allowedChannel && proposal.channelType !== policy.allowedChannel) {
    reasons.push("CHANNEL_NOT_ALLOWED");
  }
  if (Object.keys(proposal.sharedFields).some((field) => !policy.sharedFields.includes(field))) {
    reasons.push("FIELD_NOT_ALLOWED");
  }
  return reasons.length === 0
    ? { authorized: true, reasonCodes: ["AUTHORIZED"] }
    : { authorized: false, reasonCodes: reasons };
}
