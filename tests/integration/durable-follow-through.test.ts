import { describe, expect, it, vi } from "vitest";
import {
  ExecutionBroker,
  type ExecutionReceipt,
  type ExecutionRecordStore,
  type Reservation
} from "../../packages/runtime/src/capability-broker";
import {
  MissionRunner,
  type FollowThroughMission,
  type FollowThroughStore
} from "../../packages/runtime/src/mission-runner";
import { makeDraftMission } from "../helpers/draft-mission";
import {
  InterventionService,
  type InterventionRecord
} from "../../packages/runtime/src/interventions";
import type { NotificationRecord } from "../../packages/runtime/src/notifications";
import { MissionNotificationService } from "../../packages/runtime/src/notifications";
import type { WakeIntent } from "../../packages/runtime/src/wake-outbox";

class Records implements ExecutionRecordStore {
  readonly records = new Map<string, Reservation>();
  reserve(key: string): Promise<Reservation> {
    const value = this.records.get(key);
    if (value?.status === "SUCCEEDED") return Promise.resolve(value);
    if (value) return Promise.resolve({ status: "IN_FLIGHT" });
    this.records.set(key, { status: "RESERVED" });
    return Promise.resolve({ status: "RESERVED" });
  }
  succeed(key: string, receipt: ExecutionReceipt): Promise<void> {
    this.records.set(key, { status: "SUCCEEDED", receipt });
    return Promise.resolve();
  }
  fail(key: string): Promise<void> {
    this.records.delete(key);
    return Promise.resolve();
  }
}

class Cases implements FollowThroughStore {
  failNextWrite = false;
  readonly wakes: WakeIntent[] = [];
  constructor(public value: FollowThroughMission) {}
  get(): Promise<FollowThroughMission> {
    return Promise.resolve(this.value);
  }
  compareAndSet(
    _missionId: string,
    expectedVersion: number,
    next: FollowThroughMission,
    wake?: WakeIntent
  ): Promise<void> {
    if (this.value.version !== expectedVersion) throw new Error("VERSION_CONFLICT");
    if (this.failNextWrite) {
      this.failNextWrite = false;
      throw new Error("INJECTED_PERSISTENCE_CRASH");
    }
    this.value = next;
    if (wake) this.wakes.push(wake);
    return Promise.resolve();
  }
}

function readyCase(): FollowThroughMission {
  const draft = makeDraftMission();
  return {
    missionId: draft.missionId,
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
    dueAt: "2026-08-15T12:00:00.000Z"
  };
}

describe("durable follow-through", () => {
  it("schedules a distinct bounded logical follow-up after silence", async () => {
    const base = readyCase();
    const cases = new Cases({
      ...base,
      plan: {
        ...base.plan,
        messageBody: "Please confirm the approved refund.",
        followUpIntervalSeconds: 60,
        maxLogicalSends: 2
      }
    });
    const execute = vi.fn(() =>
      Promise.resolve({ receiptId: `receipt_${execute.mock.calls.length}`, acceptedAt: "2026-08-15T12:00:00.000Z" })
    );
    const scheduleMission = vi.fn(() => Promise.resolve({}));
    const runner = new MissionRunner(
      cases,
      new ExecutionBroker(new Records(), { execute }),
      { scheduleMission }
    );

    await expect(runner.run({
      missionId: cases.value.missionId,
      expectedVersion: 1,
      now: "2026-08-15T12:00:00.000Z"
    })).resolves.toMatchObject({ status: "WAITING_EXTERNAL" });
    expect(cases.value).toMatchObject({
      state: "WAITING_EXTERNAL",
      version: 2,
      actionOrdinal: 2,
      nextWakeAt: "2026-08-15T12:01:00.000Z"
    });
    expect(scheduleMission).toHaveBeenLastCalledWith(expect.objectContaining({
      missionId: cases.value.missionId,
      expectedVersion: 2,
      wakeAt: "2026-08-15T12:01:00.000Z"
    }));
    const firstIdempotencyKey = cases.value.lastActionIdempotencyKey;

    await expect(runner.run({
      missionId: cases.value.missionId,
      expectedVersion: 2,
      now: "2026-08-15T12:01:00.000Z"
    })).resolves.toMatchObject({ status: "WAITING_EXTERNAL" });
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[1]?.[0]).toMatchObject({ body: expect.stringContaining("follow-up 2") });
    expect(cases.value.actionOrdinal).toBe(3);
    expect(cases.value.lastActionIdempotencyKey).not.toBe(firstIdempotencyKey);
  });

  it("recovers an adapter failure through a bounded scheduled retry", async () => {
    const cases = new Cases(readyCase());
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error("INJECTED_503"))
      .mockResolvedValueOnce({ receiptId: "receipt_1", acceptedAt: "2026-08-15T12:00:31.000Z" });
    const scheduleMission = vi.fn(() => Promise.resolve({}));
    const runner = new MissionRunner(
      cases,
      new ExecutionBroker(new Records(), { execute }),
      { scheduleMission },
      30
    );
    await expect(
      runner.run({
        missionId: cases.value.missionId,
        expectedVersion: 1,
        now: "2026-08-15T12:00:00.000Z"
      })
    ).resolves.toMatchObject({ status: "WAITING_RETRY" });
    expect(cases.value.state).toBe("WAITING_RETRY");
    expect(scheduleMission).toHaveBeenCalledOnce();
    await expect(
      runner.run({
        missionId: cases.value.missionId,
        expectedVersion: 2,
        now: "2026-08-15T12:00:31.000Z"
      })
    ).resolves.toMatchObject({ status: "WAITING_EXTERNAL" });
    expect(execute).toHaveBeenCalledTimes(2);
    expect(cases.value).toMatchObject({
      lastAttemptAt: "2026-08-15T12:00:31.000Z",
      updatedAt: "2026-08-15T12:00:31.000Z",
      lastReceiptId: "receipt_1",
      lastActionDuplicate: false
    });
    expect(cases.value.lastActionIdempotencyKey).toMatch(/^sha256:/);
  });

  it("does not repeat the external effect after a crash and worker restart", async () => {
    const cases = new Cases(readyCase());
    cases.failNextWrite = true;
    const execute = vi.fn(() =>
      Promise.resolve({ receiptId: "receipt_1", acceptedAt: "2026-08-15T12:00:00.000Z" })
    );
    const records = new Records();
    const scheduleMission = vi.fn(() => Promise.resolve({}));
    const firstProcess = new MissionRunner(
      cases,
      new ExecutionBroker(records, { execute }),
      { scheduleMission },
      1
    );
    await expect(
      firstProcess.run({
        missionId: cases.value.missionId,
        expectedVersion: 1,
        now: "2026-08-15T12:00:00.000Z"
      })
    ).resolves.toMatchObject({ status: "WAITING_RETRY" });

    const restarted = new MissionRunner(
      cases,
      new ExecutionBroker(records, { execute }),
      { scheduleMission },
      1
    );
    const result = await restarted.run({
      missionId: cases.value.missionId,
      expectedVersion: 2,
      now: "2026-08-15T12:00:02.000Z"
    });
    expect(result).toMatchObject({ status: "WAITING_EXTERNAL", broker: { duplicate: true } });
    expect(execute).toHaveBeenCalledOnce();
    expect(cases.value).toMatchObject({
      lastAttemptAt: "2026-08-15T12:00:02.000Z",
      updatedAt: "2026-08-15T12:00:02.000Z",
      lastReceiptId: "receipt_1",
      lastActionDuplicate: true
    });
  });

  it("ignores duplicate tasks after state advanced", async () => {
    const cases = new Cases({ ...readyCase(), state: "WAITING_EXTERNAL", version: 2 });
    const runner = new MissionRunner(cases, new ExecutionBroker(new Records(), { execute: vi.fn() }), {
      scheduleMission: vi.fn()
    });
    await expect(
      runner.run({
        missionId: cases.value.missionId,
        expectedVersion: 1,
        now: "2026-08-15T12:00:00.000Z"
      })
    ).resolves.toEqual({ status: "STALE_TASK" });
  });

  it("does not let a concurrent delivery overwrite the worker that owns the action", async () => {
    const initial = readyCase();
    const cases = new Cases(initial);
    const records = new Records();
    // Reserve the exact key without completing its external call, modeling a
    // second Cloud Task that arrives while the first worker owns the send.
    let releaseAction: ((receipt: ExecutionReceipt) => void) | undefined;
    const blockingAdapter = {
      execute: vi.fn(() => new Promise<ExecutionReceipt>((resolve) => { releaseAction = resolve; }))
    };
    const broker = new ExecutionBroker(records, blockingAdapter);
    const first = broker.execute({
      missionId: initial.missionId,
      actionOrdinal: initial.actionOrdinal,
      policy: {
        ownerId: initial.ownerId,
        planVersion: initial.plan.version,
        planHash: initial.plan.planHash,
        allowedActions: initial.plan.allowedActions,
        allowedRecipient: initial.plan.allowedRecipient,
        sharedFields: initial.plan.sharedFields,
        approval: initial.approval
      },
      proposal: {
        ownerId: initial.ownerId,
        planVersion: initial.plan.version,
        planHash: initial.plan.planHash,
        actionType: "SEND_FOLLOW_UP",
        recipient: initial.plan.allowedRecipient,
        sharedFields: {}
      },
      now: "2026-08-15T12:00:00.000Z"
    });
    await vi.waitFor(() => expect(blockingAdapter.execute).toHaveBeenCalledOnce());
    void first;
    const scheduleMission = vi.fn();
    const runner = new MissionRunner(cases, broker, { scheduleMission });

    await expect(runner.run({
      missionId: initial.missionId,
      expectedVersion: initial.version,
      now: "2026-08-15T12:00:00.100Z"
    })).resolves.toEqual({ status: "ACTION_IN_FLIGHT" });
    expect(cases.value).toEqual(initial);
    expect(scheduleMission).not.toHaveBeenCalled();
    releaseAction?.({ receiptId: "receipt_owner", acceptedAt: "2026-08-15T12:00:00.200Z" });
    await first;
  });

  it("recovers a wake enqueue failure after state persistence without repeating the action", async () => {
    const cases = new Cases(readyCase());
    const execute = vi.fn().mockResolvedValue({
      receiptId: "receipt_wake_1",
      acceptedAt: "2026-08-15T12:00:00.000Z"
    });
    const scheduleMission = vi.fn()
      .mockRejectedValueOnce(new Error("INJECTED_QUEUE_UNAVAILABLE"))
      .mockResolvedValue({ taskName: "recovered-task", duplicate: false });
    const runner = new MissionRunner(
      cases,
      new ExecutionBroker(new Records(), { execute }),
      { scheduleMission }
    );

    await expect(runner.run({
      missionId: cases.value.missionId,
      expectedVersion: 1,
      now: "2026-08-15T12:00:00.000Z"
    })).rejects.toThrow("WAKE_DISPATCH_FAILED");

    expect(cases.value).toMatchObject({ state: "WAITING_EXTERNAL", version: 2 });
    expect(cases.wakes).toEqual([expect.objectContaining({
      missionId: cases.value.missionId,
      expectedVersion: 2,
      status: "PENDING"
    })]);
    expect(execute).toHaveBeenCalledOnce();

    await expect(runner.run({
      missionId: cases.value.missionId,
      expectedVersion: 1,
      now: "2026-08-15T12:00:01.000Z"
    })).resolves.toEqual({ status: "STALE_TASK" });

    expect(scheduleMission).toHaveBeenCalledTimes(2);
    expect(scheduleMission).toHaveBeenLastCalledWith(expect.objectContaining({
      missionId: cases.value.missionId,
      expectedVersion: 2
    }));
    expect(execute).toHaveBeenCalledOnce();
  });

  it("stops after the approved logical-send budget and returns one owner decision", async () => {
    const base = readyCase();
    const cases = new Cases({
      ...base,
      state: "WAITING_EXTERNAL",
      version: 2,
      actionOrdinal: 3,
      nextWakeAt: "2026-08-15T12:00:00.000Z",
      plan: { ...base.plan, maxLogicalSends: 2 }
    });
    const interventionRecords = new Map<string, InterventionRecord>();
    const notificationRecords = new Map<string, NotificationRecord>();
    const interventions = new InterventionService(
      {
        createInterventionIfAbsent: async (record) => {
          const prior = interventionRecords.get(record.dedupeKey);
          if (prior) return { record: prior, duplicate: true };
          interventionRecords.set(record.dedupeKey, record);
          return { record, duplicate: false };
        },
        listInterventions: () => Promise.resolve([...interventionRecords.values()])
      },
      {
        createIfAbsent: async (record) => {
          const prior = notificationRecords.get(record.dedupeKey);
          if (prior) return { record: prior, duplicate: true };
          notificationRecords.set(record.dedupeKey, record);
          return { record, duplicate: false };
        }
      }
    );
    const execute = vi.fn();
    const runner = new MissionRunner(
      cases,
      new ExecutionBroker(new Records(), { execute }),
      { scheduleMission: vi.fn() },
      30,
      5,
      interventions
    );

    await expect(runner.run({
      missionId: cases.value.missionId,
      expectedVersion: 2,
      now: "2026-08-15T12:00:00.000Z"
    })).resolves.toEqual({ status: "NEEDS_ATTENTION", reason: "ACTION_BUDGET_EXHAUSTED" });
    expect(cases.value).toMatchObject({
      state: "NEEDS_ATTENTION",
      version: 3,
      lastError: "ACTION_BUDGET_EXHAUSTED"
    });
    expect(cases.value.nextWakeAt).toBeUndefined();
    expect(execute).not.toHaveBeenCalled();
    expect([...interventionRecords.values()]).toEqual([
      expect.objectContaining({ kind: "ACTION_BUDGET_EXHAUSTED", allowedDecisions: ["REVISE", "STOP"] })
    ]);
    expect(notificationRecords.size).toBe(1);

    await expect(runner.run({
      missionId: cases.value.missionId,
      expectedVersion: 2,
      now: "2026-08-15T12:00:01.000Z"
    })).resolves.toEqual({ status: "STALE_TASK" });
    expect(interventionRecords.size).toBe(1);
    expect(notificationRecords.size).toBe(1);
  });

  it("stops bounded recovery and creates one inspectable intervention", async () => {
    const cases = new Cases(readyCase());
    const interventionRecords = new Map<string, InterventionRecord>();
    const notificationRecords = new Map<string, NotificationRecord>();
    const interventionService = new InterventionService(
      {
        createInterventionIfAbsent: async (record) => {
          const old = interventionRecords.get(record.dedupeKey);
          if (old) return { record: old, duplicate: true };
          interventionRecords.set(record.dedupeKey, record);
          return { record, duplicate: false };
        },
        listInterventions: () => Promise.resolve([...interventionRecords.values()])
      },
      {
        createIfAbsent: async (record) => {
          const old = notificationRecords.get(record.dedupeKey);
          if (old) return { record: old, duplicate: true };
          notificationRecords.set(record.dedupeKey, record);
          return { record, duplicate: false };
        }
      }
    );
    const runner = new MissionRunner(
      cases,
      new ExecutionBroker(new Records(), { execute: vi.fn(() => Promise.reject(new Error("503"))) }),
      { scheduleMission: vi.fn() },
      30,
      1,
      interventionService
    );
    await expect(
      runner.run({
        missionId: cases.value.missionId,
        expectedVersion: 1,
        now: "2026-08-15T12:00:00.000Z",
        correlationId: "corr_recovery_123456789012"
      })
    ).resolves.toEqual({ status: "NEEDS_ATTENTION", reason: "RECOVERY_EXHAUSTED" });
    expect(cases.value.state).toBe("NEEDS_ATTENTION");
    expect(cases.value.updatedAt).toBe("2026-08-15T12:00:00.000Z");
    expect(interventionRecords.size).toBe(1);
    expect(notificationRecords.size).toBe(1);
  });

  it("fails a revoked approval without retry and emits one terminal notification", async () => {
    const base = readyCase();
    const cases = new Cases({
      ...base,
      approval: { ...base.approval, revokedAt: "2026-08-15T11:59:00.000Z" }
    });
    const notifications = new Map<string, NotificationRecord>();
    const notify = new MissionNotificationService({
      createIfAbsent: async (record) => {
        const prior = notifications.get(record.dedupeKey);
        if (prior) return { record: prior, duplicate: true };
        notifications.set(record.dedupeKey, record);
        return { record, duplicate: false };
      }
    });
    const scheduleMission = vi.fn(() => Promise.resolve({}));
    const runner = new MissionRunner(
      cases,
      new ExecutionBroker(new Records(), { execute: vi.fn() }),
      { scheduleMission },
      30,
      5,
      undefined,
      notify
    );
    await expect(runner.run({
      missionId: cases.value.missionId,
      expectedVersion: 1,
      now: "2026-08-15T12:00:00.000Z",
      correlationId: "corr_denied_12345678"
    })).resolves.toEqual({ status: "FAILED", reason: "ACTION_DENIED" });
    expect(cases.value).toMatchObject({ state: "FAILED", updatedAt: "2026-08-15T12:00:00.000Z" });
    expect(scheduleMission).not.toHaveBeenCalled();
    expect(notifications.size).toBe(1);
    expect([...notifications.values()][0]?.kind).toBe("MISSION_FAILED");
  });
});
