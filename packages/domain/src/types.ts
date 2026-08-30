export const evidenceLevels = [
  "PROMISE_RECORDED",
  "REQUEST_ACKNOWLEDGED",
  "MERCHANT_COMMITTED",
  "MERCHANT_CONFIRMED",
  "FUNDS_SETTLED"
] as const;

export type EvidenceLevel = (typeof evidenceLevels)[number];

export type MissionState =
  | "DRAFT"
  | "AWAITING_APPROVAL"
  | "READY"
  | "RUNNING"
  | "WAITING_EXTERNAL"
  | "WAITING_RETRY"
  | "NEEDS_ATTENTION"
  | "DONE"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface ApprovalBoundary {
  readonly ownerId: string;
  readonly planVersion: number;
  readonly planHash: string;
  readonly expiresAt: string;
  readonly revokedAt?: string;
}

export interface MissionSnapshot {
  readonly missionId: string;
  readonly ownerId: string;
  readonly state: MissionState;
  readonly version: number;
  readonly planVersion: number;
  readonly planHash: string;
  readonly approval?: ApprovalBoundary;
  readonly completedLevel?: EvidenceLevel;
}

export interface DomainEvent {
  readonly type: string;
  readonly missionId: string;
  readonly from: MissionState;
  readonly to: MissionState;
  readonly reasonCode: string;
  readonly actor: "PERSON" | "SYSTEM";
}

export interface TransitionCommand {
  readonly expectedVersion: number;
  readonly target: MissionState;
  readonly reasonCode: string;
  readonly actor: "PERSON" | "SYSTEM";
  readonly approval?: ApprovalBoundary;
  readonly verification?: VerificationResult;
}

export interface EvidenceRequirement {
  readonly minimumLevel: EvidenceLevel;
  readonly amountMinor?: number | undefined;
  readonly currency?: string | undefined;
  readonly transactionRef: string;
  readonly subject?: string | undefined;
  readonly billPeriod?: string | undefined;
  readonly requiredEvidenceFields?:
    | readonly ("amountMinor" | "currency" | "subject" | "billPeriod" | "trackingNumber")[]
    | undefined;
  readonly maxAgeSeconds: number;
  readonly trustedIssuer: string;
}

export interface EvidenceCandidate {
  readonly evidenceId: string;
  readonly missionId: string;
  readonly level: EvidenceLevel;
  readonly amountMinor?: number | undefined;
  readonly currency?: string | undefined;
  readonly transactionRef?: string | undefined;
  readonly subject?: string | undefined;
  readonly billPeriod?: string | undefined;
  readonly trackingNumber?: string | undefined;
  readonly issuedAt: string;
  readonly issuer: string;
  readonly signatureValid: boolean;
}

export type VerificationReason =
  | "ACCEPTED"
  | "WRONG_MISSION"
  | "INSUFFICIENT_LEVEL"
  | "WRONG_AMOUNT"
  | "WRONG_CURRENCY"
  | "WRONG_REFERENCE"
  | "WRONG_SUBJECT"
  | "WRONG_BILL_PERIOD"
  | "MISSING_TRACKING"
  | "STALE_EVIDENCE"
  | "UNTRUSTED_ISSUER"
  | "INVALID_SIGNATURE";

export interface VerificationResult {
  readonly accepted: boolean;
  readonly level?: EvidenceLevel;
  readonly reasonCodes: readonly VerificationReason[];
}
