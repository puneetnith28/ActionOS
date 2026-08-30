import { describe, expect, it } from "vitest";
import { validateCapabilityExecution } from "../src/capability-validator";
import type { CapabilityPolicy, ProposedCapabilityExecution } from "../src/capability-validator";

const policy: CapabilityPolicy = {
  ownerId: "person_1",
  planVersion: 1,
  planHash: "sha256:plan",
  allowedActions: ["SEND_FOLLOW_UP"],
  allowedRecipient: "merchant@example.test",
  allowedChannel: "MANAGED_EMAIL",
  sharedFields: ["transactionRef"],
  boundary: {
    ownerId: "person_1",
    planVersion: 1,
    planHash: "sha256:plan",
    expiresAt: "2026-08-16T00:00:00.000Z"
  }
};

const proposal: ProposedCapabilityExecution = {
  ownerId: "person_1",
  planVersion: 1,
  planHash: "sha256:plan",
  actionType: "SEND_FOLLOW_UP",
  recipient: "merchant@example.test",
  channelType: "MANAGED_EMAIL",
  sharedFields: { transactionRef: "ORDER-79" }
};

describe("validateCapabilityExecution", () => {
  it("authorizes only the exact approved action", () => {
    expect(validateCapabilityExecution(policy, proposal, "2026-08-15T12:00:00.000Z")).toEqual({
      authorized: true,
      reasonCodes: ["AUTHORIZED"]
    });
  });

  it.each([
    ["external recipient", { recipient: "attacker@example.test" }, "RECIPIENT_NOT_ALLOWED"],
    ["unapproved channel", { channelType: "PARTNER_API" }, "CHANNEL_NOT_ALLOWED"],
    ["unapproved field", { sharedFields: { inventory: "all" } }, "FIELD_NOT_ALLOWED"],
    ["unapproved action", { actionType: "ISSUE_PAYMENT" }, "ACTION_NOT_ALLOWED"],
    ["different owner", { ownerId: "person_2" }, "OWNER_MISMATCH"],
    ["changed plan", { planVersion: 2 }, "PLAN_MISMATCH"]
  ] as const)("blocks %s", (_name, override, reason) => {
    const decision = validateCapabilityExecution(
      { ...policy },
      { ...proposal, ...override },
      "2026-08-15T12:00:00.000Z"
    );
    expect(decision.authorized).toBe(false);
    expect(decision.reasonCodes).toContain(reason);
  });
});
