export const verificationStatuses = [
  "PLANNED",
  "ACTION_ATTEMPTED",
  "SYSTEM_ACKNOWLEDGED",
  "OUTCOME_CONFIRMED",
  "STATE_VERIFIED"
] as const;

export type VerificationStatus = (typeof verificationStatuses)[number];

export type MissionState =
  | "DRAFT"
  | "AWAITING_APPROVAL"
  | "READY"
  | "RUNNING"
  | "WAITING_EXTERNAL"
  | "WAITING_RETRY"
  | "VERIFYING"
  | "NEEDS_ATTENTION"
  | "DONE"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface ExecutionBoundary {
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
  readonly boundary?: ExecutionBoundary;
  readonly completedStatus?: VerificationStatus;
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
  readonly boundary?: ExecutionBoundary;
  readonly verification?: VerificationResult;
}

export interface VerificationRequirement {
  readonly minimumStatus: VerificationStatus;
  readonly amountMinor?: number | undefined;
  readonly currency?: string | undefined;
  readonly transactionRef: string;
  readonly subject?: string | undefined;
  readonly billPeriod?: string | undefined;
  readonly requiredOutcomeFields?:
    | readonly ("amountMinor" | "currency" | "subject" | "billPeriod" | "trackingNumber")[]
    | undefined;
  readonly maxAgeSeconds: number;
  readonly trustedIssuer: string;
}

export interface ExecutionOutcome {
  readonly outcomeId: string;
  readonly missionId: string;
  readonly status: VerificationStatus;
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
  | "INSUFFICIENT_STATUS"
  | "WRONG_AMOUNT"
  | "WRONG_CURRENCY"
  | "WRONG_REFERENCE"
  | "WRONG_SUBJECT"
  | "WRONG_BILL_PERIOD"
  | "MISSING_TRACKING"
  | "STALE_OUTCOME"
  | "UNTRUSTED_ISSUER"
  | "INVALID_SIGNATURE";

export interface VerificationResult {
  readonly accepted: boolean;
  readonly status?: VerificationStatus;
  readonly reasonCodes: readonly VerificationReason[];
}
