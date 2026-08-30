import { describe, expect, it } from "vitest";
import { errorCopy } from "../lib/error-copy";

describe("public error copy", () => {
  it("does not expose internal constants to people", () => {
    expect(errorCopy("CASE_OWNERSHIP_REQUIRED")).toContain("session");
    expect(errorCopy("CASE_OWNERSHIP_REQUIRED")).not.toContain("OWNERSHIP");
    expect(errorCopy("MODEL_CALL_BUDGET_EXHAUSTED")).toContain("model-call limit");
  });

  it("redacts unknown internal errors", () => {
    expect(errorCopy("database connection string")).toBe(
      "DueBack could not complete that request. Please try again."
    );
  });
});
