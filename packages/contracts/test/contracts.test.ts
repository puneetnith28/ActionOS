import { describe, expect, it } from "vitest";
import {
  actionEnvelopeSchema,
  actionReceiptSchema,
  channelCapabilitySchema,
  deliveryEventSchema,
  inboundEnvelopeSchema,
  messageThreadSchema,
  outcomeContractSchema,
  promiseDraftSchema,
  resolutionPlanSchema
} from "../src/index";

describe("boundary contracts", () => {
  it("rejects a free-form model draft without provenance", () => {
    expect(() =>
      promiseDraftSchema.parse({
        promisor: "Merchant",
        result: "refund"
      })
    ).toThrow();
  });

  it("rejects an action without explicit authority context", () => {
    expect(() =>
      actionEnvelopeSchema.parse({
        actionId: "action_123",
        missionId: "case_123"
      })
    ).toThrow();
  });

  it("accepts legacy plans while validating multichannel plans", () => {
    const base = {
      planId: "plan_12345678",
      missionId: "case_12345678",
      ownerId: "person_12345678",
      version: 1,
      planHash: `sha256:${"a".repeat(64)}`,
      goal: "USD 79 refund",
      allowedActions: ["SEND_FOLLOW_UP"],
      allowedRecipient: "support@example.test",
      sharedFields: ["transactionRef", "amountMinor", "currency"],
      evidenceRequirements: [{
        minimumStatus: "OUTCOME_CONFIRMED",
        amountMinor: 7900,
        currency: "USD",
        transactionRef: "ORDER-79",
        maxAgeSeconds: 3600,
        trustedIssuer: "merchant-sandbox"
      }],
      expiresAt: "2026-08-22T00:00:00.000Z"
    };
    expect(resolutionPlanSchema.parse(base).channelType).toBeUndefined();
    expect(resolutionPlanSchema.parse({
      ...base,
      executionMode: "ACCELERATED_DEMO",
      timingPolicyVersion: "accelerated-demo/v1",
      channelType: "MANAGED_EMAIL",
      messageTemplateVersion: "follow-up/v1",
      messageSubject: "Follow-up for ORDER-79",
      messageBody: "Please confirm the promised outcome.",
      maxLogicalSends: 3
    })).toMatchObject({
      channelType: "MANAGED_EMAIL",
      executionMode: "ACCELERATED_DEMO",
      timingPolicyVersion: "accelerated-demo/v1"
    });
  });

  it("requires truthful channel capability fields", () => {
    expect(channelCapabilitySchema.parse({
      channelType: "CONTROLLED_SANDBOX",
      status: "AVAILABLE",
      canSend: true,
      canReceive: true,
      supportsThreading: false,
      supportsDeliveryReceipt: true,
      supportsAuthenticatedReply: true,
      requiresUserOAuth: false,
      reasonCodes: ["CONFIGURED"],
      checkedAt: "2026-08-16T00:00:00.000Z"
    }).status).toBe("AVAILABLE");
  });

  it("validates receipt, thread, delivery and inbound boundaries", () => {
    const hash = `sha256:${"b".repeat(64)}`;
    expect(actionReceiptSchema.parse({
      receiptId: "receipt_12345678",
      missionId: "case_12345678",
      channelType: "MANAGED_EMAIL",
      providerMessageId: "email_12345678",
      recipientFingerprint: hash,
      actionIdempotencyKey: hash,
      transportStatus: "ACCEPTED",
      acceptedAt: "2026-08-16T00:00:00.000Z"
    }).transportStatus).toBe("ACCEPTED");
    expect(messageThreadSchema.parse({
      threadId: "thread_12345678",
      missionId: "case_12345678",
      channelType: "MANAGED_EMAIL",
      replyRouteFingerprint: hash,
      providerMessageId: "email_12345678",
      createdAt: "2026-08-16T00:00:00.000Z",
      expiresAt: "2026-09-15T00:00:00.000Z"
    }).channelType).toBe("MANAGED_EMAIL");
    expect(deliveryEventSchema.parse({
      deliveryEventId: "delivery_12345678",
      providerEventId: "provider_event_12345678",
      providerMessageId: "email_12345678",
      channelType: "MANAGED_EMAIL",
      status: "DELIVERED",
      observedAt: "2026-08-16T00:01:00.000Z",
      reasonCodes: []
    }).status).toBe("DELIVERED");
    expect(inboundEnvelopeSchema.parse({
      inboundId: "inbound_12345678",
      providerEventId: "provider_event_12345678",
      providerEmailId: "email_12345678",
      channelType: "MANAGED_EMAIL",
      correlationStatus: "EXACT",
      senderFingerprint: hash,
      recipientRouteFingerprints: [hash],
      subject: "Re: order",
      text: "Request received",
      contentHash: hash,
      providerSignatureValid: true,
      receivedAt: "2026-08-16T00:01:00.000Z"
    }).correlationStatus).toBe("EXACT");
  });

  it("rejects invalid channel records instead of coercing them", () => {
    expect(() => actionReceiptSchema.parse({
      receiptId: "short",
      acceptedAt: "not-a-date"
    })).toThrow();
    expect(() => deliveryEventSchema.parse({
      deliveryEventId: "delivery_12345678",
      providerEventId: "provider_event_12345678",
      providerMessageId: "email_12345678",
      channelType: "EMAILISH",
      status: "DONE",
      observedAt: "2026-08-16T00:01:00.000Z",
      reasonCodes: []
    })).toThrow();
  });

  it.each([
    {
      recipe: "COMMERCIAL_FOLLOW_UP",
      actionIntents: ["FOLLOW_UP", "CHECK_STATUS"],
      recipeData: { reference: "ORDER-79", amountMinor: 7900, currency: "USD" }
    },
    {
      recipe: "APPOINTMENT",
      actionIntents: ["FIND_OPTION", "RESERVE_APPOINTMENT"],
      recipeData: { service: "dentist", acceptableWindows: ["weekday mornings"] }
    },
    {
      recipe: "DOCUMENT",
      actionIntents: ["REQUEST_DOCUMENT", "CHECK_STATUS"],
      recipeData: { documentName: "signed enrollment certificate", deliveryChannel: "email" }
    }
  ])("accepts the $recipe recipe through one outcome contract", (recipe) => {
    expect(
      outcomeContractSchema.parse({
        contractId: "outcome_12345678",
        outcome: "Obtain the requested result",
        responsibleParty: "Responsible organization",
        proofRequired: "Independent confirmation that matches this exact outcome",
        ...recipe
      }).recipe
    ).toBe(recipe.recipe);
  });
});
