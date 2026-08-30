import { describe, expect, it } from "vitest";
import { verifyEvidence } from "../src/verifier";
import type { EvidenceCandidate, EvidenceRequirement } from "../src/types";

const requirement: EvidenceRequirement = {
  minimumLevel: "MERCHANT_CONFIRMED",
  amountMinor: 7900,
  currency: "USD",
  transactionRef: "ORDER-79",
  maxAgeSeconds: 3600,
  trustedIssuer: "merchant-sandbox"
};

const candidate: EvidenceCandidate = {
  evidenceId: "ev_1",
  caseId: "case_1",
  level: "MERCHANT_CONFIRMED",
  amountMinor: 7900,
  currency: "USD",
  transactionRef: "ORDER-79",
  issuedAt: "2026-08-15T12:00:00.000Z",
  issuer: "merchant-sandbox",
  signatureValid: true
};

function verify(overrides: Partial<EvidenceCandidate> = {}) {
  return verifyEvidence({
    caseId: "case_1",
    requirement,
    candidate: { ...candidate, ...overrides },
    now: "2026-08-15T12:05:00.000Z"
  });
}

describe("verifyEvidence", () => {
  it("accepts exact merchant-confirmed evidence", () => {
    expect(verify()).toEqual({
      accepted: true,
      level: "MERCHANT_CONFIRMED",
      reasonCodes: ["ACCEPTED"]
    });
  });

  it.each([
    ["acknowledgement", { level: "REQUEST_ACKNOWLEDGED" }, "INSUFFICIENT_LEVEL"],
    ["wrong case", { caseId: "case_2" }, "WRONG_CASE"],
    ["wrong amount", { amountMinor: 7800 }, "WRONG_AMOUNT"],
    ["missing amount", { amountMinor: undefined }, "WRONG_AMOUNT"],
    ["wrong currency", { currency: "ARS" }, "WRONG_CURRENCY"],
    ["missing currency", { currency: undefined }, "WRONG_CURRENCY"],
    ["wrong reference", { transactionRef: "OTHER" }, "WRONG_REFERENCE"],
    ["missing reference", { transactionRef: undefined }, "WRONG_REFERENCE"],
    ["unsigned evidence", { signatureValid: false }, "INVALID_SIGNATURE"],
    ["untrusted issuer", { issuer: "unknown" }, "UNTRUSTED_ISSUER"],
    ["stale evidence", { issuedAt: "2026-08-01T12:00:00.000Z" }, "STALE_EVIDENCE"]
  ] as const)("rejects %s", (_name, overrides, reason) => {
    const result = verify(overrides);
    expect(result.accepted).toBe(false);
    expect(result.reasonCodes).toContain(reason);
  });

  it.each(["PROMISE_RECORDED", "REQUEST_ACKNOWLEDGED", "MERCHANT_COMMITTED"] as const)(
    "does not accept the insufficient level %s",
    (level) => {
      expect(verify({ level }).reasonCodes).toContain("INSUFFICIENT_LEVEL");
    }
  );

  it("accepts stronger independently verified settlement evidence without downgrading it", () => {
    expect(verify({ level: "FUNDS_SETTLED" })).toMatchObject({
      accepted: true,
      level: "FUNDS_SETTLED"
    });
  });

  it("requires explicit replacement subject and tracking evidence", () => {
    const replacementRequirement: EvidenceRequirement = {
      minimumLevel: "MERCHANT_CONFIRMED",
      transactionRef: "ORDER-79",
      subject: "damaged headphones",
      requiredEvidenceFields: ["subject", "trackingNumber"],
      maxAgeSeconds: 3600,
      trustedIssuer: "merchant-sandbox"
    };
    const result = verifyEvidence({
      caseId: "case_1",
      requirement: replacementRequirement,
      candidate: {
        evidenceId: "ev_replacement",
        caseId: "case_1",
        level: "MERCHANT_CONFIRMED",
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
