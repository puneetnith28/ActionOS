import { describe, expect, it, vi } from "vitest";
import { InboundService } from "../../packages/runtime/src/inbound-service";
import type { EvidenceService } from "../../packages/runtime/src/evidence-service";
import type { InterventionService } from "../../packages/runtime/src/interventions";
import { makeDraftCase } from "../helpers/draft-case";

describe("email case control races", () => {
  it.each(["CANCELLED", "DONE"] as const)("a late reply cannot reactivate a %s case", async (state) => {
    const draft = makeDraftCase();
    const interpret = vi.fn();
    const reconcile = vi.fn();
    const service = new InboundService({
      get: () => Promise.resolve({
        caseId: draft.caseId,
        ownerId: draft.ownerId,
        state,
        version: 3,
        plan: draft.plan,
        approval: {
          ownerId: draft.ownerId,
          planVersion: draft.plan.version,
          planHash: draft.plan.planHash,
          expiresAt: draft.plan.expiresAt
        },
        actionOrdinal: 1,
        dueAt: "2026-08-15T00:00:00.000Z"
      }),
      compareAndSet: vi.fn(() => Promise.resolve()),
      caseForReplyRoute: () => Promise.resolve(draft.caseId)
    }, { interpret }, { reconcile } as unknown as EvidenceService,
    { raise: vi.fn() } as unknown as InterventionService);
    await expect(service.process({
      providerEmailId: "email_late_12345678",
      from: draft.plan.allowedRecipient,
      to: ["case+opaque@inbound.example.test"],
      subject: "Late reply",
      text: "Confirmed"
    }, "2026-08-16T12:00:00.000Z")).resolves.toMatchObject({
      status: "REJECTED",
      reasonCodes: ["CASE_NOT_ACCEPTING_INBOUND"]
    });
    expect(interpret).not.toHaveBeenCalled();
    expect(reconcile).not.toHaveBeenCalled();
  });
});
