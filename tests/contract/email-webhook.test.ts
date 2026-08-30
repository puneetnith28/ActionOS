import { describe, expect, it, vi } from "vitest";
import { emailEventFixtures } from "../../packages/test-fixtures/src/email-events";
import { signEmailWebhook } from "../../packages/capabilities/src/email-webhook";
import { handleEmailWebhook } from "../../apps/web/lib/email-webhook-controller";

const now = "2026-08-16T12:00:00.000Z";
const timestamp = String(Date.parse(now) / 1000);
const secret = `whsec_${Buffer.from("contract-secret").toString("base64")}`;

function request(body: string, signatureBody = body) {
  return new Request("https://actionos.test/api/webhooks/email", {
    method: "POST",
    headers: {
      "svix-id": "provider_event_12345678",
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${signEmailWebhook(signatureBody, "provider_event_12345678", timestamp, secret)}`
    },
    body
  });
}

describe("email webhook contract", () => {
  it("authenticates the original bytes and deduplicates provider identity", async () => {
    const body = JSON.stringify(emailEventFixtures.receivedAcknowledgement);
    const events = {
      reserveProviderEvent: vi.fn(() => Promise.resolve("RESERVED" as const)),
      markProviderEvent: vi.fn(() => Promise.resolve())
    };
    const scheduler = { scheduleInbound: vi.fn(() => Promise.resolve({ taskName: "task", duplicate: false })) };
    const response = await handleEmailWebhook(request(body), {
      secret, now: () => now, events, scheduler
    });
    expect(response.status).toBe(202);
    expect(events.reserveProviderEvent).toHaveBeenCalledWith(expect.objectContaining({
      providerEventId: "provider_event_12345678",
      eventType: "email.received"
    }));
    expect(scheduler.scheduleInbound).toHaveBeenCalledOnce();
  });

  it("rejects any body mutation before persistence or enqueue", async () => {
    const original = JSON.stringify(emailEventFixtures.receivedAcknowledgement);
    const changed = original.replace("email_ack", "email_evil");
    const events = { reserveProviderEvent: vi.fn(), markProviderEvent: vi.fn() };
    const scheduler = { scheduleInbound: vi.fn() };
    const response = await handleEmailWebhook(request(changed, original), {
      secret, now: () => now, events, scheduler
    });
    expect(response.status).toBe(401);
    expect(events.reserveProviderEvent).not.toHaveBeenCalled();
    expect(scheduler.scheduleInbound).not.toHaveBeenCalled();
  });
});
