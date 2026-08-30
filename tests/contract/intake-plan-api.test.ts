import { describe, expect, it, vi } from "vitest";
import { handleIntake } from "../../apps/web/lib/intake-controller";
import { handlePlanRequest } from "../../apps/web/lib/plan-controller";
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

const auth = () => Promise.resolve({ uid: "person_12345678" });
const now = () => "2026-08-15T12:00:00.000Z";

function command(body: object): Request {
  return new Request("https://actionos.test/api/missions/mission_12345678/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("intake and plan HTTP contract", () => {
  it("accepts pasted source and returns the created case without leaking the draft", async () => {
    const intake = vi.fn(() => Promise.resolve({ draft: makeDraftMission(), duplicate: false }));
    const form = new FormData();
    form.set("text", "Northstar promised a USD 79 refund for ORDER-79.");
    const response = await handleIntake(
      new Request("https://actionos.test/api/intake", { method: "POST", body: form }),
      { authenticate: auth, service: { intake } as never, now }
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      missionId: "mission_12345678",
      duplicate: false,
      activationBlocked: false,
      blockingFields: []
    });
    expect(intake).toHaveBeenCalledOnce();
  });

  it("simulates with an explicit no-action guarantee", async () => {
    const response = await handlePlanRequest(command({ action: "simulate" }), "mission_12345678", {
      authenticate: auth,
      service: new PlanService(new MemoryStore()),
      now
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ externalActionPerformed: false });
  });

  it("revises the version and refuses approval bound to the superseded hash", async () => {
    const store = new MemoryStore();
    const service = new PlanService(store);
    const revised = await handlePlanRequest(
      command({ action: "revise", expectedPlanVersion: 1, revision: { amountMinor: 5900 } }),
      "mission_12345678",
      { authenticate: auth, service, now }
    );
    expect(revised.status).toBe(200);
    expect(store.current.plan.version).toBe(2);

    const stale = await handlePlanRequest(
      command({ action: "approve", expectedPlanVersion: 1, expectedPlanHash: testHash }),
      "mission_12345678",
      { authenticate: auth, service, now }
    );
    expect(stale.status).toBe(409);
    await expect(stale.json()).resolves.toEqual({ error: "STALE_PLAN_APPROVAL" });
  });

  it("approves only the exact current version and hash", async () => {
    const store = new MemoryStore();
    const response = await handlePlanRequest(
      command({ action: "approve", expectedPlanVersion: 1, expectedPlanHash: testHash }),
      "mission_12345678",
      { authenticate: auth, service: new PlanService(store), now }
    );
    expect(response.status).toBe(200);
    expect(store.current.approval).toMatchObject({
      ownerId: "person_12345678",
      planVersion: 1,
      planHash: testHash
    });
  });
});
