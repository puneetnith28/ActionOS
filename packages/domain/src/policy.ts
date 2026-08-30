import type { ExecutionBoundary } from "./types";

export interface ExecutionPolicy {
  readonly ownerId: string;
  readonly planVersion: number;
  readonly planHash: string;
  readonly allowedActions: readonly string[];
  readonly allowedRecipient: string;
  readonly allowedChannel?: string;
  readonly sharedFields: readonly string[];
  readonly boundary: ExecutionBoundary;
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
  | "BOUNDARY_EXPIRED"
  | "ACTION_NOT_ALLOWED"
  | "RECIPIENT_NOT_ALLOWED"
  | "CHANNEL_NOT_ALLOWED"
  | "FIELD_NOT_ALLOWED";

export interface AuthorizationDecision {
  readonly authorized: boolean;
  readonly reasonCodes: readonly AuthorizationReason[];
}

export function authorizeAction(
  policy: ExecutionPolicy,
  proposal: ProposedAction,
  now: string
): AuthorizationDecision {
  const reasons: AuthorizationReason[] = [];
  if (proposal.ownerId !== policy.ownerId || policy.boundary.ownerId !== policy.ownerId) {
    reasons.push("OWNER_MISMATCH");
  }
  if (
    proposal.planVersion !== policy.planVersion ||
    proposal.planHash !== policy.planHash ||
    policy.boundary.planVersion !== policy.planVersion ||
    policy.boundary.planHash !== policy.planHash
  ) {
    reasons.push("PLAN_MISMATCH");
  }
  if (
    Date.parse(policy.boundary.expiresAt) <= Date.parse(now) ||
    policy.boundary.revokedAt !== undefined
  ) {
    reasons.push("BOUNDARY_EXPIRED");
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
