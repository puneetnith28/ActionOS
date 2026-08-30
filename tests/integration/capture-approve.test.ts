import { describe, expect, it, vi } from "vitest";
import { PlanService, type PlanStore } from "../../packages/runtime/src/plan-service";
import type { DraftMission } from "../../packages/runtime/src/intake-service";
import { makeDraftMission, testHash } from "../helpers/draft-mission";

class MemoryStore implements PlanStore {
  constructor(public current: DraftMission = makeDraftMission()) {}
  get(missionId: string): Promise<DraftMission | undefined> {
    return Promise.resolve(missionId === this.current.missionId ? this.current : undefined);
  }
  replace(_missionId: string, expectedPlanVersion: number, next: DraftMission): Promise<void> {
    if (this.current.plan.version !== expectedPlanVersion) throw new Error("CONFLICT");
    this.current = next;
    return Promise.resolve();
  }
}

describe("capture then approve boundary", () => {
  it("performs no external action before approval", async () => {
    const externalAction = vi.fn();
    const service = new PlanService(new MemoryStore());
    await service.inspect("mission_12345678", "person_12345678");
    await service.simulate("mission_12345678", "person_12345678");
    expect(externalAction).not.toHaveBeenCalled();
  });

  it("invalidates approval material when a correction creates a new plan", async () => {
    const service = new PlanService(new MemoryStore());
    const revised = await service.revise("mission_12345678", "person_12345678", 1, {
      amountMinor: 5900
    });
    expect(revised.plan.version).toBe(2);
    expect(revised.plan.planHash).not.toBe(testHash);
    await expect(
      service.approve({
        missionId: revised.missionId,
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
        missionId: "mission_12345678",
        ownerId: "person_12345678",
        expectedPlanVersion: 1,
        expectedPlanHash: testHash,
        now: "2026-08-23T00:00:00.000Z"
      })
    ).rejects.toThrow("PLAN_EXPIRED");

    const active = new PlanService(new MemoryStore());
    const approval = {
      missionId: "mission_12345678",
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
    await expect(service.inspect("mission_12345678", "person_attacker")).rejects.toThrow(
      "CASE_OWNERSHIP_REQUIRED"
    );
    await expect(service.reject("mission_12345678", "person_attacker", 1)).rejects.toThrow(
      "CASE_OWNERSHIP_REQUIRED"
    );
  });
});
