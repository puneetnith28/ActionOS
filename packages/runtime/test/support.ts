import type { DraftCase } from "../src/intake-service";

export function makeDraft(): DraftCase {
  const hash = `sha256:${"a".repeat(64)}`;
  const provenance = [
    {
      artifactId: "artifact_12345678",
      locator: "text:0-100",
      excerptHash: hash,
      confidence: "HIGH" as const
    }
  ];
  return {
    missionId: "case_12345678",
    ownerId: "person_12345678",
    artifactId: "artifact_12345678",
    dedupeKey: hash,
    state: "AWAITING_APPROVAL",
    promiseDraft: {
      promisor: { value: "Northstar", provenance, uncertainty: "NONE" },
      result: { value: "USD 79 refund", provenance, uncertainty: "NONE" },
      amountMinor: { value: 7900, provenance, uncertainty: "NONE" },
      currency: { value: "USD", provenance, uncertainty: "NONE" },
      transactionRef: { value: "ORDER-79", provenance, uncertainty: "NONE" },
      dueAt: { value: "2026-08-20T00:00:00.000Z", provenance, uncertainty: "NONE" },
      proposedVerificationStatus: "OUTCOME_CONFIRMED"
    },
    plan: {
      planId: "plan_12345678",
      missionId: "case_12345678",
      ownerId: "person_12345678",
      version: 1,
      planHash: hash,
      goal: "USD 79 refund",
      allowedActions: ["SEND_FOLLOW_UP"],
      allowedRecipient: "merchant@controlled.test",
      sharedFields: ["transactionRef", "amountMinor", "currency"],
      evidenceRequirements: [
        {
          minimumStatus: "OUTCOME_CONFIRMED",
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
    createdAt: "2026-08-15T00:00:00.000Z"
  };
}
