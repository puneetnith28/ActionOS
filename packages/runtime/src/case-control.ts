import type { FollowThroughCase } from "./case-runner";
import { stableHash } from "@dueback/domain";
import { wakeIntent, type WakeIntent } from "./wake-outbox";

export type CaseControlAction = "STOP" | "REVOKE" | "EXPIRE" | "REOPEN" | "RESUME" | "REVISE" | "DELETE";

export interface ControlScheduler {
  scheduleCase(input: {
    caseId: string;
    expectedVersion: number;
    wakeAt: string;
    correlationId?: string;
  }): Promise<unknown>;
}

export interface DeletionReceipt {
  readonly caseId: string;
  readonly status: "DELETION_ACCEPTED";
  readonly requestedAt: string;
  readonly tombstoneId: string;
}

export interface CaseControlStore {
  getCommandResult?(input: {
    idempotencyKey: string;
    caseId: string;
    ownerId: string;
    action: CaseControlAction;
  }): Promise<FollowThroughCase | DeletionReceipt | undefined>;
  get(caseId: string): Promise<FollowThroughCase | undefined>;
  transition(input: {
    caseId: string;
    ownerId: string;
    expectedVersion: number;
    action: Exclude<CaseControlAction, "DELETE" | "REVISE">;
    reason: string;
    now: string;
    idempotencyKey: string;
    wake?: WakeIntent;
  }): Promise<FollowThroughCase>;
  requestDeletion(input: {
    caseId: string;
    ownerId: string;
    expectedVersion: number;
    now: string;
    idempotencyKey: string;
  }): Promise<DeletionReceipt>;
  beginReapproval(input: {
    caseId: string;
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
    caseId: string;
    ownerId: string;
    expectedVersion: number;
    action: CaseControlAction;
    reason?: string;
    now: string;
    idempotencyKey?: string;
  }): Promise<FollowThroughCase | DeletionReceipt> {
    const idempotencyKey = input.idempotencyKey ?? stableHash({
      namespace: "dueback/case-control/v1",
      caseId: input.caseId,
      ownerId: input.ownerId,
      expectedVersion: input.expectedVersion,
      action: input.action,
      reason: input.reason?.trim() ?? ""
    });
    const prior = await this.store.getCommandResult?.({
      idempotencyKey, caseId: input.caseId, ownerId: input.ownerId, action: input.action
    });
    if (prior) {
      if (input.action === "RESUME" && "state" in prior) {
        if (!this.scheduler) throw new Error("CONTROL_SCHEDULER_REQUIRED");
        await this.scheduler.scheduleCase({
          caseId: prior.caseId,
          expectedVersion: prior.version,
          wakeAt: prior.nextWakeAt ?? prior.controlledAt ?? input.now,
          ...(prior.correlationId ? { correlationId: prior.correlationId } : {})
        });
      }
      return prior;
    }
    const item = await this.store.get(input.caseId);
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
        caseId: input.caseId,
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
      (item.approval.revokedAt || Date.parse(item.approval.expiresAt) <= Date.parse(input.now))
    ) {
      throw new Error("NEW_APPROVAL_REQUIRED");
    }
    if (["STOP", "REVOKE", "EXPIRE"].includes(input.action) && item.state === "DONE") {
      throw new Error("TERMINAL_CASE_CONTROL_DENIED");
    }
    if (input.action === "REOPEN" && !input.reason?.trim())
      throw new Error("REOPEN_REASON_REQUIRED");
    const wake = input.action === "RESUME" ? wakeIntent({
      caseId: input.caseId,
      expectedVersion: input.expectedVersion + 1,
      wakeAt: input.now,
      createdAt: input.now,
      ...(item.correlationId ? { correlationId: item.correlationId } : {})
    }) : undefined;
    const next = await this.store.transition({
      caseId: input.caseId,
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
        caseId: next.caseId,
        expectedVersion: next.version,
        wakeAt: input.now,
        ...(next.correlationId ? { correlationId: next.correlationId } : {})
      });
    }
    return next;
  }
}
