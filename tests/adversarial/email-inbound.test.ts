import { describe, expect, it, vi } from "vitest";
import { emailEventFixtures } from "../../packages/test-fixtures/src/email-events";
import { InboundService } from "../../packages/runtime/src/inbound-service";
import type { EvidenceService } from "../../packages/runtime/src/evidence-service";
import type { InterventionService } from "../../packages/runtime/src/interventions";
import { makeDraftMission } from "../helpers/draft-case";

describe("hostile inbound email", () => {
  it("treats injected instructions as data and keeps acknowledgement below DONE", async () => {
    const draft = makeDraftMission();
    const item = {
      caseId: draft.caseId,
      ownerId: draft.ownerId,
      state: "WAITING_EXTERNAL" as const,
      version: 2,
      plan: draft.plan,
      approval: {
        ownerId: draft.ownerId,
        planVersion: draft.plan.version,
        planHash: draft.plan.planHash,
        expiresAt: draft.plan.expiresAt
      },
      actionOrdinal: 1,
      dueAt: "2026-08-15T00:00:00.000Z"
    };
    const reconcile = vi.fn(() => Promise.resolve({
      status: "INSUFFICIENT" as const,
      verification: { accepted: false, reasonCodes: ["INSUFFICIENT_LEVEL" as const] }
    }));
    const service = new InboundService(
      {
        get: () => Promise.resolve(item),
        compareAndSet: () => Promise.resolve(),
        caseForReplyRoute: () => Promise.resolve(item.caseId)
      },
      { interpret: ({ text }) => Promise.resolve({
        replyType: "ACKNOWLEDGEMENT",
        evidenceLevel: "REQUEST_ACKNOWLEDGED",
        transactionRef: text.includes("ORDER-79") ? "ORDER-79" : undefined,
        changedTerms: [],
        uncertainty: "NONE"
      }) },
      { reconcile } as unknown as EvidenceService,
      { raise: vi.fn() } as unknown as InterventionService
    );
    await expect(service.process(emailEventFixtures.hostileReply, "2026-08-16T12:00:00.000Z"))
      .resolves.toEqual({ status: "INSUFFICIENT" });
    expect(reconcile).toHaveBeenCalledWith(expect.objectContaining({
      level: "REQUEST_ACKNOWLEDGED"
    }), "2026-08-16T12:00:00.000Z", expect.any(String));
  });
});
