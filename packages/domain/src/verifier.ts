import { verificationStatuses } from "./types";
import type {
  ExecutionOutcome,
  VerificationRequirement,
  VerificationReason,
  VerificationResult
} from "./types";

function statusRank(status: ExecutionOutcome["status"]): number {
  return verificationStatuses.indexOf(status);
}

export function verifyOutcome(input: {
  readonly missionId: string;
  readonly requirement: VerificationRequirement;
  readonly candidate: ExecutionOutcome;
  readonly now: string;
}): VerificationResult {
  const { missionId, requirement, candidate } = input;
  const reasons: VerificationReason[] = [];

  if (candidate.missionId !== missionId) reasons.push("WRONG_MISSION");
  if (statusRank(candidate.status) < statusRank(requirement.minimumStatus))
    reasons.push("INSUFFICIENT_STATUS");
  if (requirement.amountMinor !== undefined && candidate.amountMinor !== requirement.amountMinor)
    reasons.push("WRONG_AMOUNT");
  if (requirement.currency !== undefined && candidate.currency !== requirement.currency)
    reasons.push("WRONG_CURRENCY");
  if (candidate.transactionRef !== requirement.transactionRef) reasons.push("WRONG_REFERENCE");
  if (requirement.subject !== undefined && candidate.subject !== requirement.subject)
    reasons.push("WRONG_SUBJECT");
  if (requirement.billPeriod !== undefined && candidate.billPeriod !== requirement.billPeriod)
    reasons.push("WRONG_BILL_PERIOD");
  if (requirement.requiredOutcomeFields?.includes("trackingNumber") && !candidate.trackingNumber)
    reasons.push("MISSING_TRACKING");
  if (candidate.issuer !== requirement.trustedIssuer) reasons.push("UNTRUSTED_ISSUER");
  if (!candidate.signatureValid) reasons.push("INVALID_SIGNATURE");

  const ageSeconds = (Date.parse(input.now) - Date.parse(candidate.issuedAt)) / 1000;
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0 || ageSeconds > requirement.maxAgeSeconds) {
    reasons.push("STALE_OUTCOME");
  }

  if (reasons.length > 0) return { accepted: false, reasonCodes: reasons };
  return { accepted: true, status: candidate.status, reasonCodes: ["ACCEPTED"] };
}
