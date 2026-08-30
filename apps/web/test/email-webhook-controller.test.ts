import { describe, expect, it, vi } from "vitest";
import { signEmailWebhook } from "@actionos/capabilities/email-webhook";
import { handleEmailWebhook } from "../lib/email-webhook-controller";

const now = "2026-08-16T12:00:00.000Z";
const timestamp = String(Date.parse(now) / 1000);
const secret = `whsec_${Buffer.from("controller-secret").toString("base64")}`;
const body = JSON.stringify({ type: "email.received", created_at: now, data: { email_id: "email_123" } });

describe("email webhook controller", () => {
  it("projects an enqueue failure into a visible provider-event failure state", async () => {
    const events = {
      reserveProviderEvent: vi.fn(() => Promise.resolve("RESERVED" as const)),
      markProviderEvent: vi.fn(() => Promise.resolve())
    };
    const scheduler = { scheduleInbound: vi.fn(() => Promise.reject(new Error("QUEUE_UNAVAILABLE"))) };
    const response = await handleEmailWebhook(new Request("https://actionos.test/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "svix-id": "event_failed_123",
        "svix-timestamp": timestamp,
        "svix-signature": `v1,${signEmailWebhook(body, "event_failed_123", timestamp, secret)}` },
      body
    }), { secret, now: () => now, events, scheduler });
    expect(response.status).toBe(400);
    expect(events.markProviderEvent).toHaveBeenCalledWith(
      "event_failed_123", "FAILED", now, ["QUEUE_UNAVAILABLE"]
    );
  });

  it("reserves, enqueues and completes one verified event", async () => {
    const events = {
      reserveProviderEvent: vi.fn(() => Promise.resolve("RESERVED" as const)),
      markProviderEvent: vi.fn(() => Promise.resolve())
    };
    const scheduler = { scheduleInbound: vi.fn(() => Promise.resolve({ taskName: "task", duplicate: false })) };
    const response = await handleEmailWebhook(new Request("https://actionos.test/api/webhooks/email", {
      method: "POST",
      headers: {
        "svix-id": "event_123",
        "svix-timestamp": timestamp,
        "svix-signature": `v1,${signEmailWebhook(body, "event_123", timestamp, secret)}`
      },
      body
    }), { secret, now: () => now, events, scheduler });
    expect(response.status).toBe(202);
    expect(scheduler.scheduleInbound).toHaveBeenCalledOnce();
    expect(events.markProviderEvent).toHaveBeenCalledWith("event_123", "ENQUEUED", now);
  });

  it("rejects an invalid signature before reserving", async () => {
    const events = {
      reserveProviderEvent: vi.fn(),
      markProviderEvent: vi.fn()
    };
    const response = await handleEmailWebhook(new Request("https://actionos.test/api/webhooks/email", {
      method: "POST",
      headers: { "svix-id": "event_123", "svix-timestamp": timestamp, "svix-signature": "v1,bad" },
      body
    }), { secret, now: () => now, events, scheduler: { scheduleInbound: vi.fn() } });
    expect(response.status).toBe(401);
    expect(events.reserveProviderEvent).not.toHaveBeenCalled();
  });

  it("acknowledges a replay without scheduling duplicate work", async () => {
    const events = {
      reserveProviderEvent: vi.fn(() => Promise.resolve("COMPLETED" as const)),
      markProviderEvent: vi.fn()
    };
    const scheduler = { scheduleInbound: vi.fn() };
    const response = await handleEmailWebhook(new Request("https://actionos.test/api/webhooks/email", {
      method: "POST",
      headers: {
        "svix-id": "event_123",
        "svix-timestamp": timestamp,
        "svix-signature": `v1,${signEmailWebhook(body, "event_123", timestamp, secret)}`
      },
      body
    }), { secret, now: () => now, events, scheduler });
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({ duplicate: true, status: "COMPLETED" });
    expect(scheduler.scheduleInbound).not.toHaveBeenCalled();
  });
});
