import { describe, expect, it, vi } from "vitest";
import { signCallback } from "@actionos/channel-adapters/callback-signature";
import { handleMerchantCallback, type CallbackRecordStore } from "../lib/callback-controller";

class Callbacks implements CallbackRecordStore {
  status: "IN_FLIGHT" | "COMPLETED" | undefined;
  reserveCallback(): Promise<"RESERVED" | "IN_FLIGHT" | "COMPLETED"> {
    if (this.status) return Promise.resolve(this.status);
    this.status = "IN_FLIGHT";
    return Promise.resolve("RESERVED");
  }
  completeCallback(): Promise<void> {
    this.status = "COMPLETED";
    return Promise.resolve();
  }
  failCallback(): Promise<void> {
    this.status = undefined;
    return Promise.resolve();
  }
}

const now = "2026-08-15T12:00:00.000Z";
const secret = "callback-secret";
const payload = {
  outcomeId: "evidence_12345678",
  missionId: "mission_12345678",
  status: "OUTCOME_CONFIRMED",
  amountMinor: 7900,
  currency: "USD",
  transactionRef: "ORDER-79",
  issuedAt: now,
  issuer: "merchant-sandbox"
};

function callback(body = JSON.stringify(payload), signature = signCallback(body, now, secret)) {
  return new Request("https://actionos.test/api/callbacks/merchant", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-actionos-timestamp": now,
      "x-actionos-signature": signature
    },
    body
  });
}

describe("merchant callback controller", () => {
  it("authenticates, reconciles, and marks a callback complete", async () => {
    const callbacks = new Callbacks();
    const reconcile = vi.fn(() =>
      Promise.resolve({
        status: "VERIFIED" as const,
        verification: {
          accepted: true,
          status: "OUTCOME_CONFIRMED" as const,
          reasonCodes: ["ACCEPTED" as const]
        }
      })
    );
    const response = await handleMerchantCallback(callback(), {
      secret,
      now: () => now,
      callbacks,
      evidence: { reconcile } as never
    });
    expect(response.status).toBe(200);
    expect(reconcile).toHaveBeenCalledWith(expect.objectContaining({ signatureValid: true }), now);
    expect(callbacks.status).toBe("COMPLETED");
  });

  it("rejects invalid signatures without invoking the verifier", async () => {
    const reconcile = vi.fn();
    const response = await handleMerchantCallback(callback(JSON.stringify(payload), "v1=bad"), {
      secret,
      now: () => now,
      callbacks: new Callbacks(),
      evidence: { reconcile } as never
    });
    expect(response.status).toBe(401);
    expect(reconcile).not.toHaveBeenCalled();
  });

  it("deduplicates a completed callback", async () => {
    const callbacks = new Callbacks();
    callbacks.status = "COMPLETED";
    const reconcile = vi.fn();
    const response = await handleMerchantCallback(callback(), {
      secret,
      now: () => now,
      callbacks,
      evidence: { reconcile } as never
    });
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({ duplicate: true });
    expect(reconcile).not.toHaveBeenCalled();
  });

  it("returns a retryable conflict while the action owner is publishing state", async () => {
    const callbacks = new Callbacks();
    const response = await handleMerchantCallback(callback(), {
      secret,
      now: () => now,
      callbacks,
      evidence: {
        reconcile: vi.fn().mockRejectedValue(new Error("VERSION_CONFLICT"))
      } as never
    });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "CALLBACK_STATE_NOT_READY" });
    expect(callbacks.status).toBeUndefined();
  });
});
