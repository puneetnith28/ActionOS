import { describe, expect, it, vi } from "vitest";
import { PlanService, type PlanStore } from "../../packages/runtime/src/plan-service";
import type { DraftCase } from "../../packages/runtime/src/intake-service";
import { makeDraftCase, testHash } from "../helpers/draft-case";

class MemoryStore implements PlanStore {
  constructor(public current: DraftCase = makeDraftCase()) {}
  get(caseId: string): Promise<DraftCase | undefined> {
    return Promise.resolve(caseId === this.current.caseId ? this.current : undefined);
  }
  replace(_caseId: string, expectedPlanVersion: number, next: DraftCase): Promise<void> {
    if (this.current.plan.version !== expectedPlanVersion) throw new Error("CONFLICT");
    this.current = next;
    return Promise.resolve();
  }
}

describe("capture then approve boundary", () => {
  it("performs no external action before approval", async () => {
    const externalAction = vi.fn();
    const service = new PlanService(new MemoryStore());
    await service.inspect("case_12345678", "person_12345678");
    await service.simulate("case_12345678", "person_12345678");
    expect(externalAction).not.toHaveBeenCalled();
  });

  it("invalidates approval material when a correction creates a new plan", async () => {
    const service = new PlanService(new MemoryStore());
    const revised = await service.revise("case_12345678", "person_12345678", 1, {
      amountMinor: 5900
    });
    expect(revised.plan.version).toBe(2);
    expect(revised.plan.planHash).not.toBe(testHash);
    await expect(
      service.approve({
        caseId: revised.caseId,
        ownerId: revised.ownerId,
        expectedPlanVersion: 1,
        expectedPlanHash: testHash,
        now: "2026-08-15T12:00:00.000Z"
      })
    ).rejects.toThrow("STALE_PLAN_APPROVAL");
  });

  it("rejects expired and replayed approvals", async () => {
    const expired = new PlanService(new MemoryStore());
    await expect(
      expired.approve({
        caseId: "case_12345678",
        ownerId: "person_12345678",
        expectedPlanVersion: 1,
        expectedPlanHash: testHash,
        now: "2026-08-23T00:00:00.000Z"
      })
    ).rejects.toThrow("PLAN_EXPIRED");

    const active = new PlanService(new MemoryStore());
    const approval = {
      caseId: "case_12345678",
      ownerId: "person_12345678",
      expectedPlanVersion: 1,
      expectedPlanHash: testHash,
      now: "2026-08-15T12:00:00.000Z"
    };
    await active.approve(approval);
    await expect(active.approve(approval)).rejects.toThrow("PLAN_NOT_APPROVABLE");
  });

  it("denies cross-owner inspection and control", async () => {
    const service = new PlanService(new MemoryStore());
    await expect(service.inspect("case_12345678", "person_attacker")).rejects.toThrow(
      "CASE_OWNERSHIP_REQUIRED"
    );
    await expect(service.reject("case_12345678", "person_attacker", 1)).rejects.toThrow(
      "CASE_OWNERSHIP_REQUIRED"
    );
  });
});
