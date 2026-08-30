import { describe, expect, it } from "vitest";
import { emptyInboxPresentation } from "../lib/inbox-presentation";

describe("emptyInboxPresentation", () => {
  it("offers Google sign-in only to an anonymous session", () => {
    expect(emptyInboxPresentation({ isAnonymous: true })).toEqual({
      heading: "No follow-ups in this session",
      message: "Sign in to recover cases saved with Google, or add a new company promise.",
      showSignIn: true
    });
  });

  it("confirms the authenticated account instead of asking it to sign in again", () => {
    expect(emptyInboxPresentation({ isAnonymous: false, email: "owner@example.test" })).toEqual({
      heading: "No follow-ups yet",
      message: "Signed in as owner@example.test. This account does not have any follow-ups yet.",
      showSignIn: false
    });
  });
});
