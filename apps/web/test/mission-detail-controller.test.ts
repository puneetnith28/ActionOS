import { describe, expect, it, vi } from "vitest";
import { managedEmailProjectionFixture, weakAcknowledgementFixture } from "@actionos/test-fixtures/mission-projections";
import { handleCaseDetail } from "../lib/mission-detail-controller";
import type { FollowThroughMission } from "@actionos/runtime/case-runner";
import type { EvidenceRecord } from "@actionos/runtime/evidence-service";

const item = managedEmailProjectionFixture as unknown as FollowThroughCase;
const evidence = weakAcknowledgementFixture as unknown as EvidenceRecord;

describe("mission detail controller", () => {
  it("returns only the owner-safe projection", async () => {
    const response = await handleCaseDetail(new Request("https://actionos.test/detail"), item.missionId, {
      authenticate: () => Promise.resolve({ uid: item.ownerId }),
      store: { get: () => Promise.resolve(item), listEvidence: () => Promise.resolve([evidence]) }
    });
    expect(response.status).toBe(200);
    const body = await response.json() as { ownerId?: string; plan?: unknown; channel: { label: string } };
    expect(body.ownerId).toBeUndefined();
    expect(body.plan).toBeUndefined();
    expect(body.channel.label).toBe("Email");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("uses an indistinguishable 404 before reading subordinate records", async () => {
    const listEvidence = vi.fn();
    const response = await handleCaseDetail(new Request("https://actionos.test/detail"), item.missionId, {
      authenticate: () => Promise.resolve({ uid: "person_other_12345678" }),
      store: { get: () => Promise.resolve(item), listEvidence }
    });
    expect(response.status).toBe(404);
    expect(listEvidence).not.toHaveBeenCalled();
  });
});
