import { once } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { createMerchantServer } from "../../apps/merchant-sandbox/src/server";
import { MerchantSandboxAdapter } from "../../packages/capabilities/src/merchant-sandbox";
import {
  ExecutionBroker,
  type ExecutionRecordStore,
  type Reservation
} from "../../packages/runtime/src/capability-broker";
import type { ApprovedActionPolicy, ProposedCapabilityExecution } from "../../packages/domain/src/index";

class Records implements ExecutionRecordStore {
  readonly values = new Map<string, Reservation>();
  reserve(key: string): Promise<Reservation> {
    const existing = this.values.get(key);
    if (existing)
      return Promise.resolve(existing.status === "RESERVED" ? { status: "IN_FLIGHT" } : existing);
    const reserved = { status: "RESERVED" } as const;
    this.values.set(key, reserved);
    return Promise.resolve(reserved);
  }
  succeed(key: string, receipt: { receiptId: string; acceptedAt: string }): Promise<void> {
    this.values.set(key, { status: "SUCCEEDED", receipt });
    return Promise.resolve();
  }
  fail(key: string): Promise<void> {
    this.values.delete(key);
    return Promise.resolve();
  }
}

const hash = `sha256:${"a".repeat(64)}`;
const approval = {
  ownerId: "person_1",
  planVersion: 1,
  planHash: hash,
  expiresAt: "2099-01-01T00:00:00.000Z"
} as const;
const policy: ApprovedActionPolicy = {
  ownerId: "person_1",
  planVersion: 1,
  planHash: hash,
  allowedActions: ["SEND_FOLLOW_UP"],
  allowedRecipient: "merchant@controlled.test",
  sharedFields: ["transactionRef", "amountMinor", "currency"],
  approval
};
const proposal: ProposedCapabilityExecution = {
  ownerId: "person_1",
  planVersion: 1,
  planHash: hash,
  actionType: "SEND_FOLLOW_UP",
  recipient: "merchant@controlled.test",
  sharedFields: {
    transactionRef: "ORDER-79",
    amountMinor: "7900",
    currency: "USD"
  }
};

describe("merchant action contract", () => {
  it("crosses a real HTTP boundary and keeps one merchant request across broker replay", async () => {
    const server = createMerchantServer({
      callbackSecret: "test-secret",
      now: () => "2026-08-15T12:00:00.000Z"
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("SERVER_ADDRESS_MISSING");
    const request = vi.fn(fetch);
    const adapter = new MerchantSandboxAdapter({
      baseUrl: `http://127.0.0.1:${address.port}`,
      scenario: "acknowledgement",
      fetch: request
    });
    const broker = new ExecutionBroker(new Records(), adapter);
    const input = {
      caseId: "mission_12345678",
      actionOrdinal: 1,
      policy,
      proposal,
      now: "2026-08-15T12:00:00.000Z"
    };
    try {
      const first = await broker.execute(input);
      const duplicate = await broker.execute(input);
      expect(first).toMatchObject({ status: "SUCCEEDED", duplicate: false });
      expect(duplicate).toMatchObject({ status: "SUCCEEDED", duplicate: true });
      expect(request).toHaveBeenCalledOnce();
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});
