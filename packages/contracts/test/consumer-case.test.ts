import { describe, expect, it } from "vitest";
import {
  caseSummarySchema,
  conversationEntrySchema,
  identityClaimSchema,
  outcomeComparisonSchema,
  technicalStepSchema
} from "../src/index";

const at = "2026-08-17T18:00:00.000Z";

describe("consumer case contracts", () => {
  it("accepts bounded consumer projections", () => {
    expect(caseSummarySchema.parse({
      missionId: "mission_12345678", companyName: "Example", outcomeLabel: "USD 59 refund",
      bucket: "WORKING", statusLabel: "Waiting for the company", lastActivityAt: at,
      nextStepLabel: "DueBack will evaluate the next reply", attentionRequired: false,
      channelLabel: "Email"
    })).toBeTruthy();
    expect(conversationEntrySchema.parse({
      entryId: "entry_12345678", direction: "INBOUND", occurredAt: at, channelLabel: "Email",
      partyLabel: "e•••@example.com", safeSummary: "The company acknowledged the request.",
      transportStatus: "DELIVERED", authenticity: "VERIFIED_ROUTE",
      evidenceDecision: "INSUFFICIENT", reasonSummary: "The amount and reference are missing."
    })).toBeTruthy();
    expect(outcomeComparisonSchema.parse({
      verificationStatus: "ACTION_ATTEMPTED", accepted: false,
      limitation: "A request acknowledgement does not prove the refund.",
      fields: [{ label: "Amount", promised: "USD 59", status: "MISSING" }]
    })).toBeTruthy();
  });

  it("rejects raw content, unknown fields and full email addresses", () => {
    expect(() => conversationEntrySchema.parse({
      entryId: "entry_12345678", direction: "INBOUND", occurredAt: at, channelLabel: "Email",
      partyLabel: "person@example.com", safeSummary: "Request received", authenticity: "VERIFIED_ROUTE",
      evidenceDecision: "INSUFFICIENT", rawBody: "private original email"
    })).toThrow();
    expect(() => caseSummarySchema.parse({
      missionId: "mission_12345678", companyName: "person@example.com", outcomeLabel: "Refund",
      bucket: "WORKING", statusLabel: "Waiting", lastActivityAt: at, nextStepLabel: "Wait",
      attentionRequired: false, channelLabel: "Email"
    })).toThrow();
  });

  it("stores identity claims and technical steps without bearer credentials or raw payloads", () => {
    const claim = {
      claimId: "claim_12345678", missionId: "mission_12345678",
      sourceOwnerFingerprint: `sha256:${"a".repeat(64)}`,
      targetOwnerFingerprint: `sha256:${"b".repeat(64)}`,
      operation: "CLAIM_DRAFT", status: "COLLISION",
      idempotencyKey: `sha256:${"c".repeat(64)}`, requestedAt: at,
      reasonCodes: ["OWNER_COLLISION"]
    };
    expect(identityClaimSchema.parse(claim)).toBeTruthy();
    expect(() => identityClaimSchema.parse({ ...claim, sourceIdToken: "secret" })).toThrow();
    expect(technicalStepSchema.parse({
      stepId: "step_12345678", stage: "VERIFIER", status: "REJECTED",
      systemLabel: "Deterministic evidence policy", occurredAt: at,
      correlationSuffix: "abcd1234", reasonCodes: ["INSUFFICIENT_STATUS"]
    })).toBeTruthy();
    expect(() => technicalStepSchema.parse({
      stepId: "step_12345678", stage: "INBOUND", status: "SUCCEEDED",
      systemLabel: "Inbound email", reasonCodes: [], rawPayload: { body: "private" }
    })).toThrow();
  });
});
