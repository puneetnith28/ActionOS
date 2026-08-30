import type { EvidenceCandidateContract, ResolutionPlan } from "@dueback/contracts";
import { stableHash } from "@dueback/domain";
import { promiseTypeManifests } from "@dueback/domain/promise-types";

function plan(input: Omit<ResolutionPlan, "planHash">): ResolutionPlan {
  return { ...input, planHash: stableHash(input) };
}

export const billCreditFixture = {
  manifest: promiseTypeManifests.BILL_CREDIT,
  plan: plan({
    planId: "plan_bill_credit_1234",
    caseId: "case_bill_credit_1234",
    ownerId: "person_portability_1",
    version: 1,
    goal: "Apply the promised USD 25 credit to the September 2026 bill",
    promiseType: "BILL_CREDIT",
    allowedActions: ["SEND_FOLLOW_UP"],
    allowedRecipient: "merchant@controlled.dueback.test",
    sharedFields: ["transactionRef", "amountMinor", "currency", "billPeriod"],
    evidenceRequirements: [
      {
        minimumLevel: "MERCHANT_CONFIRMED",
        amountMinor: 2500,
        currency: "USD",
        transactionRef: "ACCOUNT-44",
        billPeriod: "2026-09",
        requiredEvidenceFields: ["amountMinor", "currency", "billPeriod"],
        maxAgeSeconds: 2_592_000,
        trustedIssuer: "merchant-sandbox"
      }
    ],
    expiresAt: "2026-09-30T23:59:59.000Z"
  }),
  acceptedEvidence: {
    evidenceId: "evidence_bill_credit_ok",
    caseId: "case_bill_credit_1234",
    level: "MERCHANT_CONFIRMED",
    amountMinor: 2500,
    currency: "USD",
    transactionRef: "ACCOUNT-44",
    billPeriod: "2026-09",
    issuedAt: "2026-09-01T12:00:00.000Z",
    issuer: "merchant-sandbox",
    signatureValid: true
  } satisfies EvidenceCandidateContract
};

export const replacementFixture = {
  manifest: promiseTypeManifests.REPLACEMENT,
  plan: plan({
    planId: "plan_replacement_1234",
    caseId: "case_replacement_1234",
    ownerId: "person_portability_1",
    version: 1,
    goal: "Ship the promised replacement headphones with tracking",
    promiseType: "REPLACEMENT",
    allowedActions: ["SEND_FOLLOW_UP"],
    allowedRecipient: "merchant@controlled.dueback.test",
    sharedFields: ["transactionRef", "subject"],
    evidenceRequirements: [
      {
        minimumLevel: "MERCHANT_CONFIRMED",
        transactionRef: "RMA-808",
        subject: "Noise-cancelling headphones",
        requiredEvidenceFields: ["subject", "trackingNumber"],
        maxAgeSeconds: 2_592_000,
        trustedIssuer: "merchant-sandbox"
      }
    ],
    expiresAt: "2026-09-30T23:59:59.000Z"
  }),
  acceptedEvidence: {
    evidenceId: "evidence_replacement_ok",
    caseId: "case_replacement_1234",
    level: "MERCHANT_CONFIRMED",
    transactionRef: "RMA-808",
    subject: "Noise-cancelling headphones",
    trackingNumber: "TRACK-123456",
    issuedAt: "2026-09-01T12:00:00.000Z",
    issuer: "merchant-sandbox",
    signatureValid: true
  } satisfies EvidenceCandidateContract
};
