import { describe, expect, it, vi } from "vitest";
import { managedEmailProjectionFixture, weakAcknowledgementFixture } from "@dueback/test-fixtures/case-projections";
import { handleCaseDetail } from "../lib/case-detail-controller";
import type { FollowThroughCase } from "@dueback/runtime/case-runner";
import type { EvidenceRecord } from "@dueback/runtime/evidence-service";

const item = managedEmailProjectionFixture as unknown as FollowThroughCase;
const evidence = weakAcknowledgementFixture as unknown as EvidenceRecord;

describe("case detail controller", () => {
  it("returns only the owner-safe projection", async () => {
    const response = await handleCaseDetail(new Request("https://dueback.test/detail"), item.caseId, {
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
    const response = await handleCaseDetail(new Request("https://dueback.test/detail"), item.caseId, {
      authenticate: () => Promise.resolve({ uid: "person_other_12345678" }),
      store: { get: () => Promise.resolve(item), listEvidence }
    });
    expect(response.status).toBe(404);
    expect(listEvidence).not.toHaveBeenCalled();
  });
});
