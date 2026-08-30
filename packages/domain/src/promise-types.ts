import type { EvidenceLevel, EvidenceRequirement } from "./types";

export type PromiseType = "REFUND" | "BILL_CREDIT" | "REPLACEMENT";

export interface PromiseTypeManifest {
  readonly type: PromiseType;
  readonly label: string;
  readonly requiredPlanFields: readonly string[];
  readonly sharedFields: readonly string[];
  readonly minimumEvidenceLevel: EvidenceLevel;
  readonly requiredEvidenceFields: NonNullable<EvidenceRequirement["requiredEvidenceFields"]>;
  readonly completionClaim: string;
  readonly claimLimitation: string;
}

export const promiseTypeManifests: Readonly<Record<PromiseType, PromiseTypeManifest>> = {
  REFUND: {
    type: "REFUND",
    label: "Refund",
    requiredPlanFields: ["amountMinor", "currency", "transactionRef"],
    sharedFields: ["amountMinor", "currency", "transactionRef"],
    minimumEvidenceLevel: "MERCHANT_CONFIRMED",
    requiredEvidenceFields: ["amountMinor", "currency"],
    completionClaim: "Merchant-confirmed refund",
    claimLimitation: "Funds settlement is not verified."
  },
  BILL_CREDIT: {
    type: "BILL_CREDIT",
    label: "Future-bill credit",
    requiredPlanFields: ["amountMinor", "currency", "transactionRef", "billPeriod"],
    sharedFields: ["amountMinor", "currency", "transactionRef", "billPeriod"],
    minimumEvidenceLevel: "MERCHANT_CONFIRMED",
    requiredEvidenceFields: ["amountMinor", "currency", "billPeriod"],
    completionClaim: "Credit confirmed for the specified bill",
    claimLimitation: "A later bill total is not independently verified."
  },
  REPLACEMENT: {
    type: "REPLACEMENT",
    label: "Replacement with tracking",
    requiredPlanFields: ["subject", "transactionRef"],
    sharedFields: ["subject", "transactionRef"],
    minimumEvidenceLevel: "MERCHANT_CONFIRMED",
    requiredEvidenceFields: ["subject", "trackingNumber"],
    completionClaim: "Replacement shipment confirmed with tracking",
    claimLimitation: "Delivery is not verified until separate delivery evidence exists."
  }
};

export function assertManifestRequirement(
  manifest: PromiseTypeManifest,
  requirement: EvidenceRequirement
): void {
  for (const field of manifest.requiredPlanFields) {
    if (requirement[field as keyof EvidenceRequirement] === undefined) {
      throw new Error(`PROMISE_TYPE_FIELD_REQUIRED:${field}`);
    }
  }
  if (requirement.minimumLevel !== manifest.minimumEvidenceLevel) {
    throw new Error("PROMISE_TYPE_EVIDENCE_LEVEL_MISMATCH");
  }
}
