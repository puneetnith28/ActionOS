const basePlan = {
  planId: "plan_projection_1234",
  caseId: "case_projection_1234",
  ownerId: "person_projection_1234",
  version: 1,
  goal: "Receive the promised USD 59 refund",
  promiseType: "REFUND",
  allowedActions: ["SEND_FOLLOW_UP"],
  allowedRecipient: "merchant@controlled.example",
  sharedFields: ["transactionRef", "amountMinor", "currency"],
  evidenceRequirements: [{ minimumLevel: "MERCHANT_CONFIRMED", transactionRef: "R-59", amountMinor: 5900, currency: "USD" }],
  expiresAt: "2026-09-01T00:00:00.000Z",
  planHash: `sha256:${"a".repeat(64)}`,
  messageBody: "Private approved message body that must not reach the consumer projection"
} as const;

function projectedCase(channelType: "MANAGED_EMAIL" | "CONTROLLED_SANDBOX") {
  return {
    caseId: basePlan.caseId,
    ownerId: basePlan.ownerId,
    state: "WAITING_EXTERNAL",
    version: 3,
    plan: { ...basePlan, channelType },
    approval: {},
    actionOrdinal: 1,
    dueAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:02:00.000Z"
  };
}

export const managedEmailProjectionFixture = projectedCase("MANAGED_EMAIL");
export const sandboxProjectionFixture = projectedCase("CONTROLLED_SANDBOX");

export const weakAcknowledgementFixture = {
  candidate: {
    evidenceId: "evidence_projection_1234",
    caseId: basePlan.caseId,
    level: "REQUEST_ACKNOWLEDGED",
    transactionRef: "R-59",
    issuedAt: "2026-08-17T10:01:00.000Z",
    issuer: "managed-email:test",
    signatureValid: true
  },
  verification: { accepted: false, reasonCodes: ["INSUFFICIENT_LEVEL", "WRONG_AMOUNT"] },
  recordedAt: "2026-08-17T10:01:00.000Z",
  correlationId: "corr_projection_12345678"
};
