import { createServer } from "node:http";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { createMerchantServer, MerchantLedger } from "../../apps/merchant-sandbox/src/server";
import {
  handleMerchantCallback,
  type CallbackRecordStore
} from "../../apps/web/lib/callback-controller";
import { MerchantSandboxAdapter } from "../../packages/capabilities/src/merchant-sandbox";
import {
  ActionBroker,
  type ActionReceipt,
  type ActionRecordStore,
  type Reservation
} from "../../packages/runtime/src/action-broker";
import {
  CaseRunner,
  type FollowThroughCase,
  type FollowThroughStore
} from "../../packages/runtime/src/case-runner";
import {
  EvidenceService,
  type EvidenceCaseStore,
  type EvidenceRecord
} from "../../packages/runtime/src/evidence-service";
import type {
  NotificationRecord,
  NotificationStore
} from "../../packages/runtime/src/notifications";
import { makeDraftCase } from "../helpers/draft-case";

class WalkingStore
  implements
    FollowThroughStore,
    EvidenceCaseStore,
    ActionRecordStore,
    NotificationStore,
    CallbackRecordStore
{
  readonly actions = new Map<string, Reservation>();
  readonly evidence: EvidenceRecord[] = [];
  readonly notifications = new Map<string, NotificationRecord>();
  readonly callbacks = new Map<string, "IN_FLIGHT" | "COMPLETED">();
  constructor(public item: FollowThroughCase) {}
  get(): Promise<FollowThroughCase> {
    return Promise.resolve(this.item);
  }
  compareAndSet(_caseId: string, expectedVersion: number, next: FollowThroughCase): Promise<void> {
    if (this.item.version !== expectedVersion) throw new Error("VERSION_CONFLICT");
    this.item = next;
    return Promise.resolve();
  }
  record(input: {
    expectedVersion: number;
    nextState: FollowThroughCase["state"];
    evidence: EvidenceRecord;
  }): Promise<{ duplicate: boolean }> {
    if (
      this.evidence.some(
        (record) => record.candidate.evidenceId === input.evidence.candidate.evidenceId
      )
    )
      return Promise.resolve({ duplicate: true });
    if (this.item.version !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
    this.evidence.push(input.evidence);
    this.item = { ...this.item, state: input.nextState, version: this.item.version + 1 };
    return Promise.resolve({ duplicate: false });
  }
  reserve(key: string): Promise<Reservation> {
    const old = this.actions.get(key);
    if (old?.status === "SUCCEEDED") return Promise.resolve(old);
    if (old) return Promise.resolve({ status: "IN_FLIGHT" });
    this.actions.set(key, { status: "RESERVED" });
    return Promise.resolve({ status: "RESERVED" });
  }
  succeed(key: string, receipt: ActionReceipt): Promise<void> {
    this.actions.set(key, { status: "SUCCEEDED", receipt });
    return Promise.resolve();
  }
  fail(key: string): Promise<void> {
    this.actions.delete(key);
    return Promise.resolve();
  }
  createIfAbsent(
    record: NotificationRecord
  ): Promise<{ record: NotificationRecord; duplicate: boolean }> {
    const old = this.notifications.get(record.dedupeKey);
    if (old) return Promise.resolve({ record: old, duplicate: true });
    this.notifications.set(record.dedupeKey, record);
    return Promise.resolve({ record, duplicate: false });
  }
  reserveCallback(key: string): Promise<"RESERVED" | "IN_FLIGHT" | "COMPLETED"> {
    const old = this.callbacks.get(key);
    if (old) return Promise.resolve(old);
    this.callbacks.set(key, "IN_FLIGHT");
    return Promise.resolve("RESERVED");
  }
  completeCallback(key: string): Promise<void> {
    this.callbacks.set(key, "COMPLETED");
    return Promise.resolve();
  }
  failCallback(key: string): Promise<void> {
    this.callbacks.delete(key);
    return Promise.resolve();
  }
}

async function listen(server: ReturnType<typeof createServer>): Promise<string> {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("ADDRESS_MISSING");
  return `http://127.0.0.1:${String(address.port)}`;
}

async function eventually(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("CONDITION_NOT_REACHED");
}

describe("refund walking skeleton", () => {
  it("crosses HTTP, rejects acknowledgement, verifies completion, and emits one notification", async () => {
    const draft = makeDraftCase();
    const store = new WalkingStore({
      caseId: draft.caseId,
      ownerId: draft.ownerId,
      state: "READY",
      version: 1,
      plan: draft.plan,
      approval: {
        ownerId: draft.ownerId,
        planVersion: 1,
        planHash: draft.plan.planHash,
        expiresAt: draft.plan.expiresAt
      },
      actionOrdinal: 1,
      correlationId: "corr_walking_skeleton_12345678",
      dueAt: "2026-08-15T12:00:00.000Z"
    });
    const secret = "walking-skeleton-secret";
    const evidence = new EvidenceService(store, store);
    const callbackServer = createServer((incoming, outgoing) => {
      void (async () => {
        const chunks: Uint8Array[] = [];
        for await (const chunk of incoming) chunks.push(Buffer.from(chunk as Uint8Array));
        const body = Buffer.concat(chunks).toString("utf8");
        const response = await handleMerchantCallback(
          new Request("http://callback.test", {
            method: "POST",
            headers: {
              "x-dueback-timestamp": String(incoming.headers["x-dueback-timestamp"]),
              "x-dueback-signature": String(incoming.headers["x-dueback-signature"])
            },
            body
          }),
          { secret, now: () => "2026-08-15T12:00:05.000Z", callbacks: store, evidence }
        );
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(await response.text());
      })();
    });
    const callbackUrl = await listen(callbackServer);
    const ledger = new MerchantLedger();
    const merchantServer = createMerchantServer({
      callbackSecret: secret,
      callbackUrl,
      now: () => "2026-08-15T12:00:00.000Z",
      ledger,
      callbackDelayMs: 5
    });
    const merchantUrl = await listen(merchantServer);
    const runner = new CaseRunner(
      store,
      new ActionBroker(
        store,
        new MerchantSandboxAdapter({ baseUrl: merchantUrl, scenario: "signed-completion" })
      ),
      { scheduleCase: () => Promise.resolve({}) }
    );
    try {
      await expect(
        runner.run({ caseId: draft.caseId, expectedVersion: 1, now: "2026-08-15T12:00:00.000Z" })
      ).resolves.toMatchObject({ status: "WAITING_EXTERNAL" });
      await eventually(() => store.item.state === "DONE");
      expect(
        store.evidence.map((record) => [record.candidate.level, record.verification.accepted])
      ).toEqual([
        ["REQUEST_ACKNOWLEDGED", false],
        ["MERCHANT_CONFIRMED", true]
      ]);
      expect(ledger.count()).toBe(1);
      expect(store.notifications.size).toBe(1);
      expect(
        store.evidence.every((record) => record.correlationId === store.item.correlationId)
      ).toBe(true);
      expect([...store.notifications.values()][0]?.correlationId).toBe(store.item.correlationId);
      await expect(
        runner.run({ caseId: draft.caseId, expectedVersion: 1, now: "2026-08-15T12:01:00.000Z" })
      ).resolves.toEqual({ status: "STALE_TASK" });
      expect(ledger.count()).toBe(1);
    } finally {
      merchantServer.close();
      callbackServer.close();
      await Promise.all([once(merchantServer, "close"), once(callbackServer, "close")]);
    }
  });
});
