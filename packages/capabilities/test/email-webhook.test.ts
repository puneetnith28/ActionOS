import { describe, expect, it } from "vitest";
import {
  parseEmailProviderEvent,
  signEmailWebhook,
  transportStatusForProviderEvent,
  verifyEmailWebhook
} from "../src/email-webhook";

const secret = `whsec_${Buffer.from("test-secret-value").toString("base64")}`;
const now = "2026-08-16T12:00:00.000Z";
const timestamp = String(Date.parse(now) / 1000);
const body = JSON.stringify({
  type: "email.received",
  created_at: now,
  data: { email_id: "provider_email_123", to: ["case+route@example.test"] }
});

describe("email webhook boundary", () => {
  it("verifies the exact raw body and parses the bounded event", () => {
    const signature = `v1,${signEmailWebhook(body, "event_123", timestamp, secret)}`;
    expect(verifyEmailWebhook({ body, id: "event_123", timestamp, signature, secret, now })).toBe(true);
    expect(parseEmailProviderEvent(body).data.email_id).toBe("provider_email_123");
  });

  it("maps only known transport events", () => {
    expect(transportStatusForProviderEvent("email.delivered")).toBe("DELIVERED");
    expect(transportStatusForProviderEvent("email.bounced")).toBe("BOUNCED");
    expect(transportStatusForProviderEvent("email.received")).toBeUndefined();
  });

  it("rejects changed, stale and malformed events", () => {
    const signature = `v1,${signEmailWebhook(body, "event_123", timestamp, secret)}`;
    expect(verifyEmailWebhook({ body: `${body} `, id: "event_123", timestamp, signature, secret, now })).toBe(false);
    expect(verifyEmailWebhook({ body, id: "event_123", timestamp, signature, secret, now: "2026-08-16T13:00:00.000Z" })).toBe(false);
    expect(() => parseEmailProviderEvent("{}")).toThrow("EMAIL_WEBHOOK_PAYLOAD_INVALID");
  });
});
