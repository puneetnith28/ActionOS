import { describe, expect, it } from "vitest";
import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import type { RuntimeTimelineEvent } from "@actionos/runtime/timeline";
import { handleMissionResult } from "../lib/result-controller";

const item = {
  missionId: "mission_result_12345678",
  ownerId: "person_owner_12345678",
  state: "DONE",
  version: 4
} as unknown as FollowThroughMission;

const events: RuntimeTimelineEvent[] = [
  {
    eventId: "000001-plan-approved",
    missionId: item.missionId,
    sequence: 1,
    type: "PLAN_APPROVED",
    actor: "PERSON",
    occurredAt: "2026-08-16T00:00:00.000Z",
    reasonCodes: ["CURRENT_PLAN_VERSION_APPROVED"],
    correlationId: "corr_result_123456789012",
    state: "READY"
  },
  {
    eventId: "000002-action-result",
    missionId: item.missionId,
    sequence: 2,
    type: "ACTION_RESULT",
    actor: "SYSTEM",
    occurredAt: "2026-08-16T00:00:01.000Z",
    reasonCodes: ["ACTION_ACCEPTED"],
    correlationId: "corr_result_123456789012",
    state: "WAITING_EXTERNAL",
    receiptId: "receipt_result_1234",
    idempotencyKey: `sha256:${"a".repeat(64)}`
  }
];

describe("result controller timeline", () => {
  it("returns persisted actor/time/reason/correlation events for the owner", async () => {
    const response = await handleMissionResult(
      new Request("https://actionos.test/result"),
      item.missionId,
      {
        authenticate: () => Promise.resolve({ uid: item.ownerId }),
        store: {
          get: () => Promise.resolve(item),
          listEvidence: () => Promise.resolve([]),
          listInterventions: () => Promise.resolve([]),
          listEvents: () => Promise.resolve(events)
        }
      }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ events });
  });

  it("does not expose the ledger across owners", async () => {
    const response = await handleMissionResult(
      new Request("https://actionos.test/result"),
      item.missionId,
      {
        authenticate: () => Promise.resolve({ uid: "person_attacker_1234" }),
        store: {
          get: () => Promise.resolve(item),
          listEvidence: () => Promise.resolve([])
        }
      }
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "MISSION_NOT_FOUND" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
