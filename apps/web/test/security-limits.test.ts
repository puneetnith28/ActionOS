import { describe, expect, it } from "vitest";
import {
  estimateGemini35FlashGlobalCost,
  assertControlledRecipient,
  gemini35FlashGlobalPricing,
  modelBudgetKey,
  publicSecurityLimits,
  redactedPublicError,
  parseAllowedRecipientDomains
} from "../lib/security-limits";

describe("public evaluation budgets and model cost evidence", () => {
  it("pins every public budget from FR-035", () => {
    expect(publicSecurityLimits).toEqual({
      newCasesPerIdentityPerDay: 10,
      modelCallsPerNormalCase: 4,
      taskAttemptsPerCase: 5,
      logicalExternalActionsPerCase: 3,
      notificationsPerCase: 3
    });
  });

  it("isolates content-derived artifact budgets by owner", () => {
    const artifactId = "artifact_same_content";
    expect(modelBudgetKey("owner_a", artifactId)).not.toBe(modelBudgetKey("owner_b", artifactId));
    expect(modelBudgetKey("owner_a", artifactId)).toBe(modelBudgetKey("owner_a", artifactId));
  });

  it("estimates standard global cost only from observed token counts", () => {
    expect(gemini35FlashGlobalPricing).toMatchObject({
      inputUsdPerMillionTokens: 1.5,
      outputUsdPerMillionTokens: 9,
      observedOn: "2026-08-16"
    });
    expect(estimateGemini35FlashGlobalCost({ inputTokens: 1_000, outputTokens: 100 })).toBe(0.0024);
    expect(
      estimateGemini35FlashGlobalCost({ inputTokens: undefined, outputTokens: 100 })
    ).toBeNull();
  });

  it("exposes budget exhaustion but redacts unknown failures", () => {
    expect(redactedPublicError(new Error("MODEL_CALL_BUDGET_EXHAUSTED"))).toBe(
      "MODEL_CALL_BUDGET_EXHAUSTED"
    );
    expect(redactedPublicError(new Error("source content"))).toBe("REQUEST_FAILED");
    const schemaError = new Error("internal schema details");
    schemaError.name = "ZodError";
    expect(redactedPublicError(schemaError)).toBe("PROMISE_PLAN_INVALID");
  });

  it("permits only explicit controlled recipient domains", () => {
    const domains = parseAllowedRecipientDomains("example.com, DEMO.test,example.com");
    expect(domains).toEqual(["example.com", "demo.test"]);
    expect(() => { assertControlledRecipient("support@example.com", domains); }).not.toThrow();
    expect(() => { assertControlledRecipient("support@eu.example.com", domains); }).not.toThrow();
    expect(() => { assertControlledRecipient("support@evil-example.com", domains); }).toThrow(
      "COMPANY_EMAIL_RECIPIENT_NOT_ALLOWED"
    );
    expect(() => { assertControlledRecipient("support@example.com", []); }).toThrow(
      "COMPANY_EMAIL_RECIPIENT_NOT_ALLOWED"
    );
  });
});
