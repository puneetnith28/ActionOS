import { describe, expect, it, vi } from "vitest";
import { ActionBroker, ActionOutcomeUnknownError } from "../src/action-broker";
import type {
  ActionReceipt,
  ActionRecordStore,
  ClosedActionAdapter,
  Reservation
} from "../src/action-broker";
import type { ExecutionPolicy, ProposedAction } from "@actionos/domain";

const policy: ExecutionPolicy = {
  ownerId: "person_1",
  planVersion: 1,
  planHash: "sha256:plan",
  allowedActions: ["SEND_FOLLOW_UP"],
  allowedRecipient: "merchant@example.test",
  sharedFields: ["transactionRef"],
  boundary: {
    ownerId: "person_1",
    planVersion: 1,
    planHash: "sha256:plan",
    expiresAt: "2026-08-16T00:00:00.000Z"
  }
};

const proposal: ProposedAction = {
  ownerId: "person_1",
  planVersion: 1,
  planHash: "sha256:plan",
  actionType: "SEND_FOLLOW_UP",
  recipient: "merchant@example.test",
  sharedFields: { transactionRef: "ORDER-79" }
};

class MemoryActionStore implements ActionRecordStore {
  private readonly records = new Map<string, Reservation>();

  reserve(key: string): Promise<Reservation> {
    const existing = this.records.get(key);
    if (existing)
      return Promise.resolve(existing.status === "RESERVED" ? { status: "IN_FLIGHT" } : existing);
    const reservation: Reservation = { status: "RESERVED" };
    this.records.set(key, reservation);
    return Promise.resolve(reservation);
  }

  succeed(key: string, receipt: ActionReceipt): Promise<void> {
    this.records.set(key, { status: "SUCCEEDED", receipt });
    return Promise.resolve();
  }

  fail(key: string): Promise<void> {
    this.records.delete(key);
    return Promise.resolve();
  }
}

describe("ActionBroker", () => {
  it("performs one external effect across duplicate delivery", async () => {
    const execute = vi.fn(() =>
      Promise.resolve({ receiptId: "receipt_1", acceptedAt: "2026-08-15T12:00:00.000Z" })
    );
    const adapter: ClosedActionAdapter = {
      execute
    };
    const broker = new ActionBroker(new MemoryActionStore(), adapter);
    const input = {
      missionId: "case_1",
      actionOrdinal: 1,
      policy,
      proposal,
      now: "2026-08-15T12:00:00.000Z"
    };

    await expect(broker.execute(input)).resolves.toMatchObject({
      status: "SUCCEEDED",
      duplicate: false
    });
    await expect(broker.execute(input)).resolves.toMatchObject({
      status: "SUCCEEDED",
      duplicate: true
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("never calls the adapter for an unapproved recipient", async () => {
    const execute = vi.fn<ClosedActionAdapter["execute"]>();
    const adapter: ClosedActionAdapter = { execute };
    const broker = new ActionBroker(new MemoryActionStore(), adapter);
    await expect(
      broker.execute({
        missionId: "case_1",
        actionOrdinal: 1,
        policy,
        proposal: { ...proposal, recipient: "attacker@example.test" },
        now: "2026-08-15T12:00:00.000Z"
      })
    ).resolves.toMatchObject({ status: "DENIED" });
    expect(execute).not.toHaveBeenCalled();
  });

  it("keeps an uncertain provider acceptance reserved and never blindly resends", async () => {
    const execute = vi.fn<ClosedActionAdapter["execute"]>(() =>
      Promise.reject(new ActionOutcomeUnknownError("TRANSPORT_UNKNOWN"))
    );
    const broker = new ActionBroker(new MemoryActionStore(), { execute });
    const input = {
      missionId: "case_1",
      actionOrdinal: 1,
      policy,
      proposal,
      now: "2026-08-15T12:00:00.000Z"
    };
    await expect(broker.execute(input)).rejects.toThrow("TRANSPORT_UNKNOWN");
    await expect(broker.execute(input)).resolves.toMatchObject({ status: "PENDING_DUPLICATE" });
    expect(execute).toHaveBeenCalledOnce();
  });

  it("persists enough redacted identity to reconcile an uncertain acceptance", async () => {
    const store = new MemoryActionStore();
    const markUnknown = vi.fn(() => Promise.resolve());
    const broker = new ActionBroker(Object.assign(store, { markUnknown }), {
      execute: () => Promise.reject(new ActionOutcomeUnknownError("TRANSPORT_UNKNOWN"))
    });
    await expect(broker.execute({
      missionId: "case_1", actionOrdinal: 1, policy, proposal,
      now: "2026-08-15T12:00:00.000Z", correlationId: "corr_12345678"
    })).rejects.toThrow("TRANSPORT_UNKNOWN");
    expect(markUnknown).toHaveBeenCalledWith(expect.objectContaining({
      missionId: "case_1", channelType: "UNKNOWN",
      correlationId: "corr_12345678", reasonCode: "TRANSPORT_UNKNOWN"
    }));
    expect(JSON.stringify(markUnknown.mock.calls)).toContain('"recipientFingerprint":"sha256:');
    expect(JSON.stringify(markUnknown.mock.calls)).not.toContain(proposal.recipient);
  });

  it("reserves owner/recipient/domain/channel budget once before the provider call", async () => {
    const reserveExternalSend = vi.fn(() => Promise.resolve());
    const execute = vi.fn(() => Promise.resolve({
      receiptId: "receipt_1",
      acceptedAt: "2026-08-15T12:00:00.000Z"
    }));
    const broker = new ActionBroker(new MemoryActionStore(), { execute }, { reserveExternalSend });
    const input = {
      missionId: "case_1",
      actionOrdinal: 1,
      policy,
      proposal,
      now: "2026-08-15T12:00:00.000Z"
    };
    await broker.execute(input);
    await broker.execute(input);
    expect(reserveExternalSend).toHaveBeenCalledOnce();
    expect(reserveExternalSend).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: "person_1",
      recipient: "merchant@example.test"
    }));
  });

  it("does not call the provider when an external send budget is exhausted", async () => {
    const execute = vi.fn<ClosedActionAdapter["execute"]>();
    const broker = new ActionBroker(new MemoryActionStore(), { execute }, {
      reserveExternalSend: () => Promise.reject(new Error("EXTERNAL_SEND_BUDGET_EXHAUSTED"))
    });
    await expect(broker.execute({
      missionId: "case_1",
      actionOrdinal: 1,
      policy,
      proposal,
      now: "2026-08-15T12:00:00.000Z"
    })).rejects.toThrow("EXTERNAL_SEND_BUDGET_EXHAUSTED");
    expect(execute).not.toHaveBeenCalled();
  });
});
