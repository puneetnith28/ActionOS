import { describe, expect, it } from "vitest";
import { verifyOutcome } from "../src/verifier";
import type { ExecutionOutcome, VerificationRequirement } from "../src/types";

const requirement: VerificationRequirement = {
  minimumStatus: "OUTCOME_CONFIRMED",
  amountMinor: 7900,
  currency: "USD",
  transactionRef: "ORDER-79",
  maxAgeSeconds: 3600,
  trustedIssuer: "merchant-sandbox"
};

const candidate: ExecutionOutcome = {
  outcomeId: "ev_1",
  missionId: "mission_1",
  status: "OUTCOME_CONFIRMED",
  amountMinor: 7900,
  currency: "USD",
  transactionRef: "ORDER-79",
  issuedAt: "2026-08-15T12:00:00.000Z",
  issuer: "merchant-sandbox",
  signatureValid: true
};

function verify(overrides: Partial<ExecutionOutcome> = {}) {
  return verifyOutcome({
    missionId: "mission_1",
    requirement,
    candidate: { ...candidate, ...overrides },
    now: "2026-08-15T12:05:00.000Z"
  });
}

describe("verifyOutcome", () => {
  it("accepts exact merchant-confirmed evidence", () => {
    expect(verify()).toEqual({
      accepted: true,
      status: "OUTCOME_CONFIRMED",
      reasonCodes: ["ACCEPTED"]
    });
  });

  it.each([
    ["acknowledgement", { status: "ACTION_ATTEMPTED" }, "INSUFFICIENT_STATUS"],
    ["wrong mission", { missionId: "mission_2" }, "WRONG_MISSION"],
    ["wrong amount", { amountMinor: 7800 }, "WRONG_AMOUNT"],
    ["missing amount", { amountMinor: undefined }, "WRONG_AMOUNT"],
    ["wrong currency", { currency: "ARS" }, "WRONG_CURRENCY"],
    ["missing currency", { currency: undefined }, "WRONG_CURRENCY"],
    ["wrong reference", { transactionRef: "OTHER" }, "WRONG_REFERENCE"],
    ["missing reference", { transactionRef: undefined }, "WRONG_REFERENCE"],
    ["unsigned evidence", { signatureValid: false }, "INVALID_SIGNATURE"],
    ["untrusted issuer", { issuer: "unknown" }, "UNTRUSTED_ISSUER"],
    ["stale evidence", { issuedAt: "2026-08-01T12:00:00.000Z" }, "STALE_OUTCOME"]
  ] as const)("rejects %s", (_name, overrides, reason) => {
    const result = verify(overrides);
    expect(result.accepted).toBe(false);
    expect(result.reasonCodes).toContain(reason);
  });

  it.each(["PLANNED", "ACTION_ATTEMPTED", "SYSTEM_ACKNOWLEDGED"] as const)(
    "does not accept the insufficient status %s",
    (status) => {
      expect(verify({ status }).reasonCodes).toContain("INSUFFICIENT_STATUS");
    }
  );

  it("accepts stronger independently verified settlement evidence without downgrading it", () => {
    expect(verify({ status: "STATE_VERIFIED" })).toMatchObject({
      accepted: true,
      status: "STATE_VERIFIED"
    });
  });

  it("requires explicit replacement subject and tracking evidence", () => {
    const replacementRequirement: VerificationRequirement = {
      minimumStatus: "OUTCOME_CONFIRMED",
      transactionRef: "ORDER-79",
      subject: "damaged headphones",
      requiredOutcomeFields: ["subject", "trackingNumber"],
      maxAgeSeconds: 3600,
      trustedIssuer: "merchant-sandbox"
    };
    const result = verifyOutcome({
      missionId: "mission_1",
      requirement: replacementRequirement,
      candidate: {
        outcomeId: "ev_replacement",
        missionId: "mission_1",
        status: "OUTCOME_CONFIRMED",
        transactionRef: "ORDER-79",
        subject: "damaged headphones",
        issuedAt: "2026-08-15T12:00:00.000Z",
        issuer: "merchant-sandbox",
        signatureValid: true
      },
      now: "2026-08-15T12:05:00.000Z"
    });
    expect(result.accepted).toBe(false);
    expect(result.reasonCodes).toContain("MISSING_TRACKING");
  });
});
