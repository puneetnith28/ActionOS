import { describe, expect, it, vi } from "vitest";
import { merchantScenarios, scenarioStep } from "../src/scenarios";
import { deliverCallbackWithRetry, MerchantLedger } from "../src/server";

describe("merchant scenarios", () => {
  it("defines every deterministic judge scenario", () => {
    expect(Object.keys(merchantScenarios)).toEqual([
      "acknowledgement",
      "retry-once",
      "mismatch",
      "signed-completion",
      "replay",
      "latency"
    ]);
  });

  it("advances retry-once from failure to acknowledgement to completion", () => {
    expect(scenarioStep("retry-once", 1).status).toBe(503);
    expect(scenarioStep("retry-once", 2).outcome).toBe("REQUEST_ACKNOWLEDGED");
    expect(scenarioStep("retry-once", 3).outcome).toBe("MERCHANT_CONFIRMED");
  });

  it("keeps a judge-visible acknowledgement window without process-local progression", () => {
    expect(scenarioStep("signed-completion", 1)).toMatchObject({
      status: 202,
      outcome: "REQUEST_ACKNOWLEDGED",
      followupOutcome: "MERCHANT_CONFIRMED",
      followupDelayMs: 8_000
    });
    expect(scenarioStep("signed-completion", 99)).toEqual(scenarioStep("signed-completion", 1));
  });

  it("advances the story across distinct logical-action idempotency keys", () => {
    const ledger = new MerchantLedger();
    expect(ledger.attempt("case_one")).toBe(1);
    expect(ledger.attempt("case_one")).toBe(2);
    expect(ledger.attempt("case_one")).toBe(3);
    expect(ledger.attempt("case_two")).toBe(1);
  });

  it("retries transient callback conflicts and eventually delivers", async () => {
    const send = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    const wait = vi.fn().mockResolvedValue(undefined);
    await expect(deliverCallbackWithRetry(send, wait, [10, 20])).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls).toEqual([[10], [20]]);
  });

  it("does not retry a permanently invalid callback", async () => {
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 422 }));
    await expect(deliverCallbackWithRetry(send, vi.fn(), [10])).rejects.toThrow("CALLBACK_422");
    expect(send).toHaveBeenCalledOnce();
  });
});
