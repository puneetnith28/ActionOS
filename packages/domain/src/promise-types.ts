import type { VerificationStatus, VerificationRequirement } from "./types";

export type PromiseType = "REFUND" | "BILL_CREDIT" | "REPLACEMENT";

export interface PromiseTypeManifest {
  readonly type: PromiseType;
  readonly label: string;
  readonly requiredPlanFields: readonly string[];
  readonly sharedFields: readonly string[];
  readonly minimumVerificationStatus: VerificationStatus;
  readonly requiredOutcomeFields: NonNullable<VerificationRequirement["requiredOutcomeFields"]>;
  readonly completionClaim: string;
  readonly claimLimitation: string;
}

export const promiseTypeManifests: Readonly<Record<PromiseType, PromiseTypeManifest>> = {
  REFUND: {
    type: "REFUND",
    label: "Refund",
    requiredPlanFields: ["amountMinor", "currency", "transactionRef"],
    sharedFields: ["amountMinor", "currency", "transactionRef"],
    minimumVerificationStatus: "OUTCOME_CONFIRMED",
    requiredOutcomeFields: ["amountMinor", "currency"],
    completionClaim: "Merchant-confirmed refund",
    claimLimitation: "Funds settlement is not verified."
  },
  BILL_CREDIT: {
    type: "BILL_CREDIT",
    label: "Future-bill credit",
    requiredPlanFields: ["amountMinor", "currency", "transactionRef", "billPeriod"],
    sharedFields: ["amountMinor", "currency", "transactionRef", "billPeriod"],
    minimumVerificationStatus: "OUTCOME_CONFIRMED",
    requiredOutcomeFields: ["amountMinor", "currency", "billPeriod"],
    completionClaim: "Credit confirmed for the specified bill",
    claimLimitation: "A later bill total is not independently verified."
  },
  REPLACEMENT: {
    type: "REPLACEMENT",
    label: "Replacement with tracking",
    requiredPlanFields: ["subject", "transactionRef"],
    sharedFields: ["subject", "transactionRef"],
    minimumVerificationStatus: "OUTCOME_CONFIRMED",
    requiredOutcomeFields: ["subject", "trackingNumber"],
    completionClaim: "Replacement shipment confirmed with tracking",
    claimLimitation: "Delivery is not verified until separate delivery evidence exists."
  }
};

export function assertManifestRequirement(
  manifest: PromiseTypeManifest,
  requirement: VerificationRequirement
): void {
  for (const field of manifest.requiredPlanFields) {
    if (requirement[field as keyof VerificationRequirement] === undefined) {
      throw new Error(`PROMISE_TYPE_FIELD_REQUIRED:${field}`);
    }
  }
  if (requirement.minimumStatus !== manifest.minimumVerificationStatus) {
    throw new Error("PROMISE_TYPE_VERIFICATION_STATUS_MISMATCH");
  }
}
