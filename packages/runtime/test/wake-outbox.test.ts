import { describe, expect, it, vi } from "vitest";
import {
  DurableWakeScheduler,
  wakeIntent,
  type WakeIntent,
  type WakeOutboxStore
} from "../src/wake-outbox";

class MemoryOutbox implements WakeOutboxStore {
  readonly intents = new Map<string, WakeIntent>();
  listPending(limit: number): Promise<readonly WakeIntent[]> {
    return Promise.resolve([...this.intents.values()]
      .filter((intent) => intent.status === "PENDING")
      .slice(0, limit));
  }
  markDispatched(intentId: string, taskName: string, observedAt: string): Promise<void> {
    const intent = this.intents.get(intentId);
    if (!intent) throw new Error("WAKE_INTENT_NOT_FOUND");
    this.intents.set(intentId, {
      ...intent,
      status: "DISPATCHED",
      taskName,
      attemptCount: intent.attemptCount + 1,
      updatedAt: observedAt
    });
    return Promise.resolve();
  }
  markFailed(intentId: string, reason: string, observedAt: string): Promise<void> {
    const intent = this.intents.get(intentId);
    if (!intent) throw new Error("WAKE_INTENT_NOT_FOUND");
    this.intents.set(intentId, {
      ...intent,
      lastError: reason,
      attemptCount: intent.attemptCount + 1,
      updatedAt: observedAt
    });
    return Promise.resolve();
  }
}

describe("durable wake outbox", () => {
  it("reconciles a persisted intent after enqueue recovers", async () => {
    const outbox = new MemoryOutbox();
    const intent = wakeIntent({
      caseId: "case_outbox_1234",
      expectedVersion: 2,
      wakeAt: "2026-08-18T15:00:00.000Z",
      createdAt: "2026-08-18T14:00:00.000Z"
    });
    outbox.intents.set(intent.intentId, intent);
    const scheduleCase = vi.fn()
      .mockRejectedValueOnce(new Error("QUEUE_UNAVAILABLE"))
      .mockResolvedValueOnce({ taskName: "task-recovered", duplicate: false });
    let now = "2026-08-18T14:00:01.000Z";
    const dispatcher = new DurableWakeScheduler({ scheduleCase }, outbox, () => now);

    await expect(dispatcher.reconcile()).resolves.toEqual({ dispatched: 0, failed: 1 });
    expect(outbox.intents.get(intent.intentId)).toMatchObject({
      status: "PENDING",
      attemptCount: 1,
      lastError: "QUEUE_UNAVAILABLE"
    });

    now = "2026-08-18T14:01:00.000Z";
    await expect(dispatcher.reconcile()).resolves.toEqual({ dispatched: 1, failed: 0 });
    expect(outbox.intents.get(intent.intentId)).toMatchObject({
      status: "DISPATCHED",
      attemptCount: 2,
      taskName: "task-recovered"
    });
  });
});
