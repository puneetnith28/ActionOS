import { describe, expect, it, vi } from "vitest";
import {
  MissionControlService,
  type MissionControlStore,
  type DeletionReceipt
} from "../../packages/runtime/src/mission-control";
import type { FollowThroughMission } from "../../packages/runtime/src/mission-runner";
import { EvidenceService, type EvidenceRecord } from "../../packages/runtime/src/evidence-service";
import type { NotificationRecord } from "../../packages/runtime/src/notifications";
import { makeDraftMission } from "../helpers/draft-mission";
import type { WakeIntent } from "../../packages/runtime/src/wake-outbox";

function activeCase(state: FollowThroughMission["state"] = "WAITING_EXTERNAL"): FollowThroughMission {
  const draft = makeDraftMission();
  return {
    missionId: draft.missionId,
    ownerId: draft.ownerId,
    state,
    version: 3,
    plan: draft.plan,
    approval: {
      ownerId: draft.ownerId,
      planVersion: draft.plan.version,
      planHash: draft.plan.planHash,
      expiresAt: draft.plan.expiresAt
    },
    actionOrdinal: 1,
    dueAt: "2026-08-15T12:00:00.000Z",
    correlationId: "corr_control_123456789012"
  };
}

class ControlMemory implements MissionControlStore {
  evidence: EvidenceRecord[] = [];
  deleted = false;
  commands = new Map<string, { missionId: string; ownerId: string; action: string; result: FollowThroughMission | DeletionReceipt }>();
  wakes: WakeIntent[] = [];
  constructor(public item: FollowThroughMission) {}
  get(missionId: string): Promise<FollowThroughMission | undefined> {
    return Promise.resolve(!this.deleted && missionId === this.item.missionId ? this.item : undefined);
  }
  getCommandResult(input: { idempotencyKey: string; missionId: string; ownerId: string; action: string }): Promise<FollowThroughMission | DeletionReceipt | undefined> {
    const prior = this.commands.get(input.idempotencyKey);
    if (prior && (prior.missionId !== input.missionId || prior.ownerId !== input.ownerId || prior.action !== input.action))
      throw new Error("IDEMPOTENCY_KEY_REUSED");
    return Promise.resolve(prior?.result);
  }
  transition(input: {
    missionId: string;
    ownerId: string;
    expectedVersion: number;
    action: "STOP" | "REVOKE" | "EXPIRE" | "REOPEN" | "RESUME";
    reason: string;
    now: string;
    idempotencyKey: string;
    wake?: WakeIntent;
  }): Promise<FollowThroughMission> {
    const prior = this.commands.get(input.idempotencyKey);
    if (prior) return Promise.resolve(prior.result as FollowThroughMission);
    if (this.item.version !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
    const state =
      input.action === "REOPEN"
        ? "NEEDS_ATTENTION"
        : input.action === "RESUME"
          ? "READY"
          : input.action === "EXPIRE"
            ? "EXPIRED"
            : "CANCELLED";
    this.item = {
      ...this.item,
      state,
      version: input.expectedVersion + 1,
      controlReason: input.reason,
      controlledAt: input.now,
      ...(input.action === "RESUME" ? { nextWakeAt: input.now } : {})
    };
    if (input.wake) this.wakes.push(input.wake);
    this.commands.set(input.idempotencyKey, { missionId: input.missionId, ownerId: input.ownerId, action: input.action, result: this.item });
    return Promise.resolve(this.item);
  }
  requestDeletion(input: { missionId: string; ownerId: string; action?: string; now: string; idempotencyKey: string }): Promise<DeletionReceipt> {
    const prior = this.commands.get(input.idempotencyKey);
    if (prior) return Promise.resolve(prior.result as DeletionReceipt);
    this.deleted = true;
    const result = {
      missionId: input.missionId,
      status: "DELETION_ACCEPTED",
      requestedAt: input.now,
      tombstoneId: "tombstone_12345678"
    } as const;
    this.commands.set(input.idempotencyKey, { missionId: input.missionId, ownerId: input.ownerId, action: "DELETE", result });
    return Promise.resolve(result);
  }
  beginReapproval(input: { missionId: string; ownerId: string; expectedVersion: number; reason: string; now: string; idempotencyKey: string }): Promise<FollowThroughMission> {
    const prior = this.commands.get(input.idempotencyKey);
    if (prior) return Promise.resolve(prior.result as FollowThroughMission);
    if (this.item.version !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
    this.item = {
      ...this.item,
      state: "CANCELLED",
      version: input.expectedVersion + 1,
      approval: { ...this.item.approval, revokedAt: input.now },
      controlReason: input.reason,
      controlledAt: input.now,
      updatedAt: input.now
    };
    this.commands.set(input.idempotencyKey, { missionId: input.missionId, ownerId: input.ownerId, action: "REVISE", result: this.item });
    return Promise.resolve(this.item);
  }
}

describe("case controls", () => {
  it.each([
    ["STOP", "CANCELLED"],
    ["REVOKE", "CANCELLED"],
    ["EXPIRE", "EXPIRED"]
  ] as const)("applies %s and leaves the mission terminal for workers", async (action, state) => {
    const store = new ControlMemory(activeCase());
    const result = await new MissionControlService(store).command({
      missionId: store.item.missionId,
      ownerId: store.item.ownerId,
      expectedVersion: 3,
      action,
      now: "2026-08-15T12:00:00.000Z"
    });
    expect(result).toMatchObject({ state, version: 4 });
  });

  it("reopens DONE while preserving prior evidence", async () => {
    const store = new ControlMemory(activeCase("DONE"));
    store.evidence.push({
      candidate: {
        evidenceId: "evidence_12345678",
        missionId: store.item.missionId,
        level: "MERCHANT_CONFIRMED",
        amountMinor: 7900,
        currency: "USD",
        transactionRef: "ORDER-79",
        issuedAt: "2026-08-15T12:00:00.000Z",
        issuer: "merchant-sandbox",
        signatureValid: true
      },
      verification: { accepted: true, level: "MERCHANT_CONFIRMED", reasonCodes: ["ACCEPTED"] },
      recordedAt: "2026-08-15T12:00:00.000Z",
      correlationId: "corr_control_123456789012"
    });
    const result = await new MissionControlService(store).command({
      missionId: store.item.missionId,
      ownerId: store.item.ownerId,
      expectedVersion: 3,
      action: "REOPEN",
      reason: "Funds never appeared",
      now: "2026-08-15T12:01:00.000Z"
    });
    expect(result).toMatchObject({ state: "NEEDS_ATTENTION" });
    expect(store.evidence).toHaveLength(1);
  });

  it("makes a requested deletion immediately inaccessible", async () => {
    const store = new ControlMemory(activeCase());
    await new MissionControlService(store).command({
      missionId: store.item.missionId,
      ownerId: store.item.ownerId,
      expectedVersion: 3,
      action: "DELETE",
      now: "2026-08-15T12:00:00.000Z"
    });
    await expect(store.get(store.item.missionId)).resolves.toBeUndefined();
  });

  it("resolves an exception by scheduling only the already-approved action", async () => {
    const store = new ControlMemory(activeCase("NEEDS_ATTENTION"));
    const scheduleMission = vi.fn(() => Promise.resolve({}));
    const result = await new MissionControlService(store, { scheduleMission }).command({
      missionId: store.item.missionId,
      ownerId: store.item.ownerId,
      expectedVersion: 3,
      action: "RESUME",
      reason: "Reference confirmed",
      now: "2026-08-15T12:00:00.000Z"
    });
    expect(result).toMatchObject({ state: "READY", version: 4 });
    expect(scheduleMission).toHaveBeenCalledWith(
      expect.objectContaining({ missionId: store.item.missionId, expectedVersion: 4 })
    );
    expect(store.wakes).toEqual([expect.objectContaining({
      missionId: store.item.missionId,
      expectedVersion: 4,
      status: "PENDING"
    })]);
  });

  it("re-dispatches an idempotent RESUME after the first enqueue fails", async () => {
    const store = new ControlMemory(activeCase("NEEDS_ATTENTION"));
    const scheduleMission = vi.fn()
      .mockRejectedValueOnce(new Error("QUEUE_UNAVAILABLE"))
      .mockResolvedValueOnce({ taskName: "resume-recovered", duplicate: false });
    const service = new MissionControlService(store, { scheduleMission });
    const command = {
      missionId: store.item.missionId,
      ownerId: store.item.ownerId,
      expectedVersion: 3,
      action: "RESUME" as const,
      reason: "Reference confirmed",
      now: "2026-08-15T12:00:00.000Z",
      idempotencyKey: "resume-command-1"
    };

    await expect(service.command(command)).rejects.toThrow("QUEUE_UNAVAILABLE");
    expect(store.item).toMatchObject({ state: "READY", version: 4 });
    expect(store.wakes).toHaveLength(1);

    await expect(service.command(command)).resolves.toMatchObject({ state: "READY", version: 4 });
    expect(scheduleMission).toHaveBeenCalledTimes(2);
  });

  it("moves conflicting evidence to attention and asks only for the mismatched field", async () => {
    const store = new ControlMemory(activeCase());
    const notifications = {
      createIfAbsent: vi.fn(async (record: NotificationRecord) => ({ record, duplicate: false }))
    };
    const interventions = {
      createInterventionIfAbsent: vi.fn(async (record) => ({ record, duplicate: false })),
      listInterventions: vi.fn(() => Promise.resolve([]))
    };
    const service = new EvidenceService(
      {
        get: (missionId) => store.get(missionId),
        record: async (input) => {
          store.item = { ...store.item, state: input.nextState, version: store.item.version + 1 };
          store.evidence.push(input.evidence);
          return { duplicate: false };
        }
      },
      notifications,
      interventions
    );
    const result = await service.reconcile(
      {
        evidenceId: "evidence_wrong_amount",
        missionId: store.item.missionId,
        level: "MERCHANT_CONFIRMED",
        amountMinor: 1,
        currency: "USD",
        transactionRef: "ORDER-79",
        issuedAt: "2026-08-15T12:00:00.000Z",
        issuer: "merchant-sandbox",
        signatureValid: true
      },
      "2026-08-15T12:00:05.000Z"
    );
    expect(store.item.state).toBe("NEEDS_ATTENTION");
    expect(result.intervention).toMatchObject({ requestedField: "amount" });
    expect(result.intervention).toMatchObject({
      question: "Does the approved amount need correction?",
      allowedDecisions: ["REVISE", "STOP"]
    });
    expect(notifications.createIfAbsent).toHaveBeenCalledOnce();
  });

  it("revokes the active authority before opening a new plan revision", async () => {
    const store = new ControlMemory(activeCase("NEEDS_ATTENTION"));
    const result = await new MissionControlService(store).command({
      missionId: store.item.missionId,
      ownerId: store.item.ownerId,
      expectedVersion: 3,
      action: "REVISE",
      reason: "Correct the approved amount",
      now: "2026-08-15T12:00:00.000Z"
    });
    expect(result).toMatchObject({
      state: "CANCELLED",
      version: 4,
      approval: { revokedAt: "2026-08-15T12:00:00.000Z" }
    });
  });

  it.each([
    ["STOP", "WAITING_EXTERNAL"],
    ["REOPEN", "DONE"],
    ["RESUME", "NEEDS_ATTENTION"],
    ["REVISE", "NEEDS_ATTENTION"]
  ] as const)("returns one transition for concurrent %s replay", async (action, initialState) => {
    const store = new ControlMemory(activeCase(initialState));
    const service = new MissionControlService(store, { scheduleMission: () => Promise.resolve({}) });
    const command = {
      missionId: store.item.missionId, ownerId: store.item.ownerId, expectedVersion: 3,
      action, now: "2026-08-15T12:00:00.000Z", reason: action === "REOPEN" ? "Not resolved" : undefined,
      idempotencyKey: `same-command-${action.toLowerCase()}-12345678`
    };
    const [first, second] = await Promise.all([service.command(command), service.command(command)]);
    expect(first).toEqual(second);
    expect(store.item.version).toBe(4);
    expect(store.commands.size).toBe(1);
  });
});
