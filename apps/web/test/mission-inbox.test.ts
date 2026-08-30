import { describe, expect, it } from "vitest";
import { emptyInboxPresentation } from "../lib/inbox-presentation";

describe("emptyInboxPresentation", () => {
  it("offers Google sign-in only to an anonymous session", () => {
    expect(emptyInboxPresentation({ isAnonymous: true })).toEqual({
      heading: "No missions in this session",
      message: "Sign in to recover missions saved with Google, or define a new objective.",
      showSignIn: true
    });
  });

  it("confirms the authenticated account instead of asking it to sign in again", () => {
    expect(emptyInboxPresentation({ isAnonymous: false, email: "owner@example.test" })).toEqual({
      heading: "No active missions",
      message: "Signed in as owner@example.test. This account does not have any active or historical missions.",
      showSignIn: false
    });
  });
});
