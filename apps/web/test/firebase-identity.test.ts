import { describe, expect, it } from "vitest";
import { recoverableAuthError } from "../lib/firebase-client";

describe("recoverable Firebase identity policy", () => {
  it.each(["auth/credential-already-in-use", "auth/email-already-in-use"])("fails closed on %s without claiming a draft", (code) => {
    expect(recoverableAuthError(code, true)).toBe("RECOVERABLE_ACCOUNT_ALREADY_EXISTS");
  });

  it("does not reinterpret an existing-account collision during normal sign-in", () => {
    expect(recoverableAuthError("auth/credential-already-in-use", false)).toBe("RECOVERABLE_SIGN_IN_FAILED");
  });

  it.each(["auth/popup-closed-by-user", "auth/cancelled-popup-request"])("keeps cancellation non-destructive for %s", (code) => {
    expect(recoverableAuthError(code, true)).toBe("RECOVERABLE_SIGN_IN_CANCELLED");
  });
});
