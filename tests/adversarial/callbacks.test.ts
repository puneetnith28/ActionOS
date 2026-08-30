import { describe, expect, it } from "vitest";
import {
  CallbackReplayGuard,
  signCallback
} from "../../packages/capabilities/src/callback-signature";
import {
  verifyEvidence,
  type EvidenceCandidate,
  type EvidenceRequirement
} from "../../packages/domain/src/index";

const now = "2026-08-15T12:00:00.000Z";
const body = JSON.stringify({ caseId: "mission_12345678", transactionRef: "ORDER-79" });
const secret = "callback-test-secret";

describe("merchant callbacks", () => {
  it("accepts a fresh valid signature once", () => {
    const guard = new CallbackReplayGuard();
    const signature = signCallback(body, now, secret);
    expect(guard.verify({ body, timestamp: now, signature, secret, now })).toEqual({ valid: true });
    expect(guard.verify({ body, timestamp: now, signature, secret, now })).toEqual({
      valid: false,
      reason: "REPLAYED_CALLBACK"
    });
  });

  it("rejects invalid and stale signatures", () => {
    expect(
      new CallbackReplayGuard().verify({ body, timestamp: now, signature: "v1=bad", secret, now })
    ).toEqual({ valid: false, reason: "INVALID_SIGNATURE" });
    const old = "2026-08-15T11:00:00.000Z";
    expect(
      new CallbackReplayGuard().verify({
        body,
        timestamp: old,
        signature: signCallback(body, old, secret),
        secret,
        now
      })
    ).toEqual({ valid: false, reason: "STALE_CALLBACK" });
  });

  it("rejects validly signed evidence for the wrong case or reference", () => {
    const requirement: EvidenceRequirement = {
      minimumLevel: "MERCHANT_CONFIRMED",
      amountMinor: 7900,
      currency: "USD",
      transactionRef: "ORDER-79",
      maxAgeSeconds: 3600,
      trustedIssuer: "merchant-sandbox"
    };
    const base: EvidenceCandidate = {
      evidenceId: "evidence_12345678",
      caseId: "mission_12345678",
      level: "MERCHANT_CONFIRMED",
      amountMinor: 7900,
      currency: "USD",
      transactionRef: "ORDER-79",
      issuedAt: now,
      issuer: "merchant-sandbox",
      signatureValid: true
    };
    expect(
      verifyEvidence({
        caseId: base.caseId,
        requirement,
        candidate: { ...base, caseId: "mission_wrong" },
        now
      }).reasonCodes
    ).toContain("WRONG_CASE");
    expect(
      verifyEvidence({
        caseId: base.caseId,
        requirement,
        candidate: { ...base, transactionRef: "ORDER-WRONG" },
        now
      }).reasonCodes
    ).toContain("WRONG_REFERENCE");
  });
});
