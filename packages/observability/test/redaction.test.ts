import { describe, expect, it } from "vitest";
import { redactUnknownFields, safeEvent } from "../src/index";

describe("privacy-safe observability", () => {
  it("keeps only structured correlation and outcome fields", () => {
    expect(
      safeEvent({
        runId: "run_12345678",
        missionId: "case_12345678",
        correlationId: "corr_12345678",
        event: "EVIDENCE_REJECTED",
        outcome: "REJECTED",
        reasonCode: "INSUFFICIENT_STATUS"
      })
    ).toEqual({
      runId: "run_12345678",
      missionId: "case_12345678",
      correlationId: "corr_12345678",
      event: "EVIDENCE_REJECTED",
      outcome: "REJECTED",
      reasonCode: "INSUFFICIENT_STATUS"
    });
  });

  it("drops raw source, prompt, email, and nested values from unknown fields", () => {
    expect(
      redactUnknownFields({
        missionId: "case_12345678",
        prompt: "secret prompt",
        email: "person@example.test",
        raw: "receipt contents",
        nested: { source: "private" },
        attempt: 2
      })
    ).toEqual({ missionId: "case_12345678", attempt: 2 });
  });

  it("drops channel addresses, message content, headers and credentials regardless of casing", () => {
    expect(redactUnknownFields({
      channelType: "MANAGED_EMAIL",
      deliveryStatus: "ACCEPTED",
      Recipient: "person@example.test",
      reply_route: "case+secret@example.test",
      subject: "private order",
      messageText: "private body",
      authorizationHeader: "Bearer secret",
      webhookToken: "secret",
      providerMessageIdHash: "sha256:safe"
    })).toEqual({
      channelType: "MANAGED_EMAIL",
      deliveryStatus: "ACCEPTED",
      providerMessageIdHash: "sha256:safe"
    });
  });
});
