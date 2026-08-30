import { describe, expect, it, vi } from "vitest";
import type { CaseControlStore, DeletionReceipt } from "../../packages/runtime/src/case-control";
import { CaseControlService } from "../../packages/runtime/src/case-control";
import type { FollowThroughCase } from "../../packages/runtime/src/case-runner";
import { handleCaseControl } from "../../apps/web/lib/control-controller";
import { makeDraftCase } from "../helpers/draft-case";

class ExceptionStore implements CaseControlStore {
  readonly evidenceIds = ["evidence_original_completion"];
  constructor(public item: FollowThroughCase) {}
  get(caseId: string): Promise<FollowThroughCase | undefined> {
    return Promise.resolve(caseId === this.item.caseId ? this.item : undefined);
  }
  transition(input: {
    expectedVersion: number;
    action: "STOP" | "REVOKE" | "EXPIRE" | "REOPEN" | "RESUME";
    reason: string;
    now: string;
  }): Promise<FollowThroughCase> {
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
      controlledAt: input.now
    };
    return Promise.resolve(this.item);
  }
  requestDeletion(): Promise<DeletionReceipt> {
    return Promise.resolve({ caseId: this.item.caseId, status: "DELETION_ACCEPTED", requestedAt: "2026-08-15T12:05:00.000Z", tombstoneId: "deletion_exception_12345678" });
  }
}

function request(caseId: string, action: string, expectedVersion: number, reason?: string) {
  return new Request(`https://dueback.test/api/cases/${caseId}/control`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, expectedVersion, reason, idempotencyKey: `command-${action.toLowerCase()}-12345678` })
  });
}

describe("exception and reopen journey", () => {
  it("reopens, preserves proof, resumes within approval, then stops future work", async () => {
    const draft = makeDraftCase();
    const store = new ExceptionStore({
      caseId: draft.caseId,
      ownerId: draft.ownerId,
      state: "DONE",
      version: 4,
      plan: draft.plan,
      approval: {
        ownerId: draft.ownerId,
        planVersion: draft.plan.version,
        planHash: draft.plan.planHash,
        expiresAt: draft.plan.expiresAt
      },
      actionOrdinal: 1,
      dueAt: "2026-08-15T12:00:00.000Z",
      completedLevel: "MERCHANT_CONFIRMED",
      correlationId: "corr_exception_1234567890"
    });
    const scheduleCase = vi.fn(() => Promise.resolve({}));
    const service = new CaseControlService(store, { scheduleCase });
    const dependencies = {
      authenticate: vi.fn(() => Promise.resolve({ uid: draft.ownerId })),
      service,
      now: () => "2026-08-15T12:05:00.000Z"
    };

    const reopened = await handleCaseControl(
      request(draft.caseId, "REOPEN", 4, "The funds did not arrive"),
      draft.caseId,
      dependencies
    );
    expect(reopened.status).toBe(200);
    expect(store.item.state).toBe("NEEDS_ATTENTION");
    expect(store.evidenceIds).toEqual(["evidence_original_completion"]);

    const resumed = await handleCaseControl(
      request(draft.caseId, "RESUME", 5, "Try the approved follow-up again"),
      draft.caseId,
      dependencies
    );
    expect(resumed.status).toBe(200);
    expect(store.item.state).toBe("READY");
    expect(scheduleCase).toHaveBeenCalledOnce();

    const stopped = await handleCaseControl(
      request(draft.caseId, "STOP", 6),
      draft.caseId,
      dependencies
    );
    expect(stopped.status).toBe(200);
    expect(store.item.state).toBe("CANCELLED");
  });

  it("returns an observable deletion receipt", async () => {
    const draft = makeDraftCase();
    const store = new ExceptionStore({
      caseId: draft.caseId, ownerId: draft.ownerId, state: "READY", version: 2,
      plan: draft.plan, approval: { ownerId: draft.ownerId, planVersion: draft.plan.version, planHash: draft.plan.planHash, expiresAt: draft.plan.expiresAt },
      actionOrdinal: 1, dueAt: "2026-08-15T12:00:00.000Z", correlationId: "corr_delete_1234567890"
    });
    const response = await handleCaseControl(request(draft.caseId, "DELETE", 2), draft.caseId, {
      authenticate: vi.fn(() => Promise.resolve({ uid: draft.ownerId })),
      service: new CaseControlService(store, { scheduleCase: vi.fn(() => Promise.resolve({})) }),
      now: () => "2026-08-15T12:05:00.000Z"
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: "DELETION_ACCEPTED", caseId: draft.caseId });
  });
});
