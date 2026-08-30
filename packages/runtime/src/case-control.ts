import type { FollowThroughCase } from "./case-runner";
import { stableHash } from "@actionos/domain";
import { wakeIntent, type WakeIntent } from "./wake-outbox";

export type CaseControlAction = "STOP" | "REVOKE" | "EXPIRE" | "REOPEN" | "RESUME" | "REVISE" | "DELETE";

export interface ControlScheduler {
  scheduleCase(input: {
    missionId: string;
    expectedVersion: number;
    wakeAt: string;
    correlationId?: string;
  }): Promise<unknown>;
}

export interface DeletionReceipt {
  readonly missionId: string;
  readonly status: "DELETION_ACCEPTED";
  readonly requestedAt: string;
  readonly tombstoneId: string;
}

export interface CaseControlStore {
  getCommandResult?(input: {
    idempotencyKey: string;
    missionId: string;
    ownerId: string;
    action: CaseControlAction;
  }): Promise<FollowThroughCase | DeletionReceipt | undefined>;
  get(missionId: string): Promise<FollowThroughCase | undefined>;
  transition(input: {
    missionId: string;
    ownerId: string;
    expectedVersion: number;
    action: Exclude<CaseControlAction, "DELETE" | "REVISE">;
    reason: string;
    now: string;
    idempotencyKey: string;
    wake?: WakeIntent;
  }): Promise<FollowThroughCase>;
  requestDeletion(input: {
    missionId: string;
    ownerId: string;
    expectedVersion: number;
    now: string;
    idempotencyKey: string;
  }): Promise<DeletionReceipt>;
  beginReapproval(input: {
    missionId: string;
    ownerId: string;
    expectedVersion: number;
    reason: string;
    now: string;
    idempotencyKey: string;
  }): Promise<FollowThroughCase>;
}

export class CaseControlService {
  constructor(
    private readonly store: CaseControlStore,
    private readonly scheduler?: ControlScheduler
  ) {}

  async command(input: {
    missionId: string;
    ownerId: string;
    expectedVersion: number;
    action: CaseControlAction;
    reason?: string;
    now: string;
    idempotencyKey?: string;
  }): Promise<FollowThroughCase | DeletionReceipt> {
    const idempotencyKey = input.idempotencyKey ?? stableHash({
      namespace: "dueback/case-control/v1",
      missionId: input.missionId,
      ownerId: input.ownerId,
      expectedVersion: input.expectedVersion,
      action: input.action,
      reason: input.reason?.trim() ?? ""
    });
    const prior = await this.store.getCommandResult?.({
      idempotencyKey, missionId: input.missionId, ownerId: input.ownerId, action: input.action
    });
    if (prior) {
      if (input.action === "RESUME" && "state" in prior) {
        if (!this.scheduler) throw new Error("CONTROL_SCHEDULER_REQUIRED");
        await this.scheduler.scheduleCase({
          missionId: prior.missionId,
          expectedVersion: prior.version,
          wakeAt: prior.nextWakeAt ?? prior.controlledAt ?? input.now,
          ...(prior.correlationId ? { correlationId: prior.correlationId } : {})
        });
      }
      return prior;
    }
    const item = await this.store.get(input.missionId);
    if (!item) throw new Error("CASE_NOT_FOUND");
    if (item.ownerId !== input.ownerId) throw new Error("CASE_OWNERSHIP_REQUIRED");
    if (item.version !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
    if (input.action === "DELETE") {
      return this.store.requestDeletion({ ...input, idempotencyKey });
    }
    if (input.action === "REVISE") {
      if (["DONE", "CANCELLED", "EXPIRED"].includes(item.state))
        throw new Error("REAPPROVAL_NOT_AVAILABLE");
      return this.store.beginReapproval({
        missionId: input.missionId,
        ownerId: input.ownerId,
        expectedVersion: input.expectedVersion,
        reason: input.reason?.trim() || "OWNER_REQUESTED_AUTHORITY_REVISION",
        now: input.now,
        idempotencyKey
      });
    }
    if (input.action === "REOPEN" && item.state !== "DONE") throw new Error("REOPEN_REQUIRES_DONE");
    if (input.action === "RESUME" && item.state !== "NEEDS_ATTENTION") {
      throw new Error("RESUME_REQUIRES_ATTENTION");
    }
    if (
      input.action === "RESUME" &&
      (item.boundary.revokedAt || Date.parse(item.boundary.expiresAt) <= Date.parse(input.now))
    ) {
      throw new Error("NEW_BOUNDARY_REQUIRED");
    }
    if (["STOP", "REVOKE", "EXPIRE"].includes(input.action) && item.state === "DONE") {
      throw new Error("TERMINAL_CASE_CONTROL_DENIED");
    }
    if (input.action === "REOPEN" && !input.reason?.trim())
      throw new Error("REOPEN_REASON_REQUIRED");
    const wake = input.action === "RESUME" ? wakeIntent({
      missionId: input.missionId,
      expectedVersion: input.expectedVersion + 1,
      wakeAt: input.now,
      createdAt: input.now,
      ...(item.correlationId ? { correlationId: item.correlationId } : {})
    }) : undefined;
    const next = await this.store.transition({
      missionId: input.missionId,
      ownerId: input.ownerId,
      expectedVersion: input.expectedVersion,
      action: input.action,
      reason: input.reason?.trim() || input.action,
      now: input.now,
      idempotencyKey,
      ...(wake ? { wake } : {})
    });
    if (input.action === "RESUME") {
      if (!this.scheduler) throw new Error("CONTROL_SCHEDULER_REQUIRED");
      await this.scheduler.scheduleCase({
        missionId: next.missionId,
        expectedVersion: next.version,
        wakeAt: input.now,
        ...(next.correlationId ? { correlationId: next.correlationId } : {})
      });
    }
    return next;
  }
}
