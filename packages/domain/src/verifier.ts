import { evidenceLevels } from "./types";
import type {
  EvidenceCandidate,
  EvidenceRequirement,
  VerificationReason,
  VerificationResult
} from "./types";

function levelRank(level: EvidenceCandidate["level"]): number {
  return evidenceLevels.indexOf(level);
}

export function verifyEvidence(input: {
  readonly caseId: string;
  readonly requirement: EvidenceRequirement;
  readonly candidate: EvidenceCandidate;
  readonly now: string;
}): VerificationResult {
  const { caseId, requirement, candidate } = input;
  const reasons: VerificationReason[] = [];

  if (candidate.caseId !== caseId) reasons.push("WRONG_CASE");
  if (levelRank(candidate.level) < levelRank(requirement.minimumLevel))
    reasons.push("INSUFFICIENT_LEVEL");
  if (requirement.amountMinor !== undefined && candidate.amountMinor !== requirement.amountMinor)
    reasons.push("WRONG_AMOUNT");
  if (requirement.currency !== undefined && candidate.currency !== requirement.currency)
    reasons.push("WRONG_CURRENCY");
  if (candidate.transactionRef !== requirement.transactionRef) reasons.push("WRONG_REFERENCE");
  if (requirement.subject !== undefined && candidate.subject !== requirement.subject)
    reasons.push("WRONG_SUBJECT");
  if (requirement.billPeriod !== undefined && candidate.billPeriod !== requirement.billPeriod)
    reasons.push("WRONG_BILL_PERIOD");
  if (requirement.requiredEvidenceFields?.includes("trackingNumber") && !candidate.trackingNumber)
    reasons.push("MISSING_TRACKING");
  if (candidate.issuer !== requirement.trustedIssuer) reasons.push("UNTRUSTED_ISSUER");
  if (!candidate.signatureValid) reasons.push("INVALID_SIGNATURE");

  const ageSeconds = (Date.parse(input.now) - Date.parse(candidate.issuedAt)) / 1000;
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0 || ageSeconds > requirement.maxAgeSeconds) {
    reasons.push("STALE_EVIDENCE");
  }

  if (reasons.length > 0) return { accepted: false, reasonCodes: reasons };
  return { accepted: true, level: candidate.level, reasonCodes: ["ACCEPTED"] };
}
