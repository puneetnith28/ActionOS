import { describe, expect, it, vi } from "vitest";
import { ExecutionBroker } from "../../packages/runtime/src/capability-broker";
import { assertControlledRecipient } from "../../apps/web/lib/security-limits";

describe("managed email authority boundary", () => {
  it("blocks arbitrary domains and a proposal owned by someone else", async () => {
    expect(() => { assertControlledRecipient("support@attacker.test", ["controlled.test"]); })
      .toThrow("COMPANY_EMAIL_RECIPIENT_NOT_ALLOWED");
    const execute = vi.fn();
    const broker = new ExecutionBroker({
      reserve: () => Promise.resolve({ status: "RESERVED" as const }),
      succeed: () => Promise.resolve(),
      fail: () => Promise.resolve()
    }, { execute });
    await expect(broker.execute({
      caseId: "case_12345678",
      actionOrdinal: 1,
      policy: {
        ownerId: "owner_expected", planVersion: 1, planHash: "sha256:plan",
        allowedActions: ["SEND_FOLLOW_UP"], allowedRecipient: "support@controlled.test",
        allowedChannel: "MANAGED_EMAIL", sharedFields: ["transactionRef"],
        approval: { ownerId: "owner_expected", planVersion: 1, planHash: "sha256:plan", expiresAt: "2027-01-01T00:00:00.000Z" }
      },
      proposal: {
        ownerId: "owner_attacker", planVersion: 1, planHash: "sha256:plan",
        actionType: "SEND_FOLLOW_UP", channelType: "MANAGED_EMAIL",
        recipient: "support@controlled.test", sharedFields: { transactionRef: "ORDER-79" }
      },
      now: "2026-08-16T12:00:00.000Z"
    })).resolves.toMatchObject({ status: "DENIED" });
    expect(execute).not.toHaveBeenCalled();
  });
});
