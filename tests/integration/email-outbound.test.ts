import { describe, expect, it, vi } from "vitest";
import {
  ExecutionBroker,
  CapabilityOutcomeUnknownError,
  type ExecutionReceipt,
  type Reservation
} from "../../packages/runtime/src/capability-broker";

describe("managed email interruption safety", () => {
  it("does not resend after a simulated post-acceptance connection loss, even much later", async () => {
    let reservation: Reservation | undefined;
    const store = {
      reserve: () => {
        if (!reservation) {
          reservation = { status: "RESERVED" as const };
          return Promise.resolve(reservation);
        }
        return Promise.resolve({ status: "IN_FLIGHT" as const });
      },
      succeed: (_key: string, receipt: ExecutionReceipt) => {
        reservation = { status: "SUCCEEDED", receipt };
        return Promise.resolve();
      },
      fail: () => {
        reservation = undefined;
        return Promise.resolve();
      }
    };
    const execute = vi.fn(() => Promise.reject(
      new CapabilityOutcomeUnknownError("PROVIDER_ACCEPTED_RESPONSE_LOST")
    ));
    const broker = new ExecutionBroker(store, { execute });
    const input = {
      caseId: "case_12345678",
      actionOrdinal: 1,
      policy: {
        ownerId: "owner_12345678", planVersion: 1, planHash: "sha256:plan",
        allowedActions: ["SEND_FOLLOW_UP" as const], allowedRecipient: "support@example.test",
        allowedChannel: "MANAGED_EMAIL", sharedFields: ["transactionRef"],
        approval: { ownerId: "owner_12345678", planVersion: 1, planHash: "sha256:plan", expiresAt: "2027-01-01T00:00:00.000Z" }
      },
      proposal: {
        ownerId: "owner_12345678", planVersion: 1, planHash: "sha256:plan",
        actionType: "SEND_FOLLOW_UP" as const, channelType: "MANAGED_EMAIL",
        recipient: "support@example.test", sharedFields: { transactionRef: "ORDER-79" }
      },
      now: "2026-08-16T12:00:00.000Z"
    };
    await expect(broker.execute(input)).rejects.toThrow("PROVIDER_ACCEPTED_RESPONSE_LOST");
    await expect(broker.execute({ ...input, now: "2026-12-16T12:00:00.000Z" }))
      .resolves.toMatchObject({ status: "PENDING_DUPLICATE" });
    expect(execute).toHaveBeenCalledOnce();
  });
});
