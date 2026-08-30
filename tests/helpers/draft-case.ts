import type { DraftCase } from "../../packages/runtime/src/intake-service";

export const testHash = `sha256:${"a".repeat(64)}`;

export function makeDraftCase(overrides: Partial<DraftCase> = {}): DraftCase {
  const provenance = [
    {
      artifactId: "artifact_12345678",
      locator: "text:0-100",
      excerptHash: testHash,
      confidence: "HIGH" as const
    }
  ];
  return {
    caseId: "case_12345678",
    ownerId: "person_12345678",
    artifactId: "artifact_12345678",
    dedupeKey: testHash,
    state: "AWAITING_APPROVAL",
    promiseDraft: {
      promisor: { value: "Northstar", provenance, uncertainty: "NONE" },
      result: { value: "USD 79 refund", provenance, uncertainty: "NONE" },
      amountMinor: { value: 7900, provenance, uncertainty: "NONE" },
      currency: { value: "USD", provenance, uncertainty: "NONE" },
      transactionRef: { value: "ORDER-79", provenance, uncertainty: "NONE" },
      dueAt: { value: "2026-08-20T00:00:00.000Z", provenance, uncertainty: "NONE" },
      proposedEvidenceLevel: "MERCHANT_CONFIRMED"
    },
    plan: {
      planId: "plan_12345678",
      caseId: "case_12345678",
      ownerId: "person_12345678",
      version: 1,
      planHash: testHash,
      goal: "USD 79 refund",
      allowedActions: ["SEND_FOLLOW_UP"],
      allowedRecipient: "merchant@controlled.test",
      sharedFields: ["transactionRef", "amountMinor", "currency"],
      evidenceRequirements: [
        {
          minimumLevel: "MERCHANT_CONFIRMED",
          amountMinor: 7900,
          currency: "USD",
          transactionRef: "ORDER-79",
          maxAgeSeconds: 3600,
          trustedIssuer: "merchant-sandbox"
        }
      ],
      expiresAt: "2026-08-22T00:00:00.000Z"
    },
    activationBlocked: false,
    blockingFields: [],
    createdAt: "2026-08-15T00:00:00.000Z",
    ...overrides
  };
}
