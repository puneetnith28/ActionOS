import type { ExecutionOutcomeContract, ExecutionPlan } from "@actionos/contracts";
import { stableHash } from "@actionos/domain";
import { goalTypeManifests } from "@actionos/domain/promise-types";

function plan(input: Omit<ExecutionPlan, "planHash">): ExecutionPlan {
  return { ...input, planHash: stableHash(input) };
}

export const billCreditFixture = {
  manifest: goalTypeManifests.BILL_CREDIT,
  plan: plan({
    planId: "plan_bill_credit_1234",
    missionId: "case_bill_credit_1234",
    ownerId: "person_portability_1",
    version: 1,
    goal: "Apply the promised USD 25 credit to the September 2026 bill",
    goalType: "BILL_CREDIT",
    allowedActions: ["SEND_FOLLOW_UP"],
    allowedRecipient: "merchant@controlled.dueback.test",
    sharedFields: ["transactionRef", "amountMinor", "currency", "billPeriod"],
    evidenceRequirements: [
      {
        minimumStatus: "OUTCOME_CONFIRMED",
        amountMinor: 2500,
        currency: "USD",
        transactionRef: "ACCOUNT-44",
        billPeriod: "2026-09",
        requiredOutcomeFields: ["amountMinor", "currency", "billPeriod"],
        maxAgeSeconds: 2_592_000,
        trustedIssuer: "merchant-sandbox"
      }
    ],
    expiresAt: "2026-09-30T23:59:59.000Z"
  }),
  acceptedEvidence: {
    outcomeId: "evidence_bill_credit_ok",
    missionId: "case_bill_credit_1234",
    level: "OUTCOME_CONFIRMED",
    amountMinor: 2500,
    currency: "USD",
    transactionRef: "ACCOUNT-44",
    billPeriod: "2026-09",
    issuedAt: "2026-09-01T12:00:00.000Z",
    issuer: "merchant-sandbox",
    signatureValid: true
  } satisfies ExecutionOutcomeContract
};

export const replacementFixture = {
  manifest: goalTypeManifests.REPLACEMENT,
  plan: plan({
    planId: "plan_replacement_1234",
    missionId: "case_replacement_1234",
    ownerId: "person_portability_1",
    version: 1,
    goal: "Ship the promised replacement headphones with tracking",
    goalType: "REPLACEMENT",
    allowedActions: ["SEND_FOLLOW_UP"],
    allowedRecipient: "merchant@controlled.dueback.test",
    sharedFields: ["transactionRef", "subject"],
    evidenceRequirements: [
      {
        minimumStatus: "OUTCOME_CONFIRMED",
        transactionRef: "RMA-808",
        subject: "Noise-cancelling headphones",
        requiredOutcomeFields: ["subject", "trackingNumber"],
        maxAgeSeconds: 2_592_000,
        trustedIssuer: "merchant-sandbox"
      }
    ],
    expiresAt: "2026-09-30T23:59:59.000Z"
  }),
  acceptedEvidence: {
    outcomeId: "evidence_replacement_ok",
    missionId: "case_replacement_1234",
    level: "OUTCOME_CONFIRMED",
    transactionRef: "RMA-808",
    subject: "Noise-cancelling headphones",
    trackingNumber: "TRACK-123456",
    issuedAt: "2026-09-01T12:00:00.000Z",
    issuer: "merchant-sandbox",
    signatureValid: true
  } satisfies ExecutionOutcomeContract
};
