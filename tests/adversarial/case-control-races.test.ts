import { describe, expect, it, vi } from "vitest";
import { validateCapabilityExecution } from "../../packages/domain/src/capability-validator";
import { EvidenceService } from "../../packages/runtime/src/evidence-service";
import { makeDraftMission } from "../helpers/draft-case";

describe("case control races", () => {
  it("rejects the old approval after authority revision revokes it", () => {
    const draft = makeDraftMission();
    const requirement = draft.plan.evidenceRequirements[0];
    expect(requirement).toBeTruthy();
    const decision = validateCapabilityExecution({
      ownerId: draft.ownerId,
      planVersion: draft.plan.version,
      planHash: draft.plan.planHash,
      allowedActions: draft.plan.allowedActions,
      allowedRecipient: draft.plan.allowedRecipient,
      sharedFields: draft.plan.sharedFields,
      approval: {
        ownerId: draft.ownerId,
        planVersion: draft.plan.version,
        planHash: draft.plan.planHash,
        expiresAt: draft.plan.expiresAt,
        revokedAt: "2026-08-17T19:00:00.000Z"
      }
    }, {
      ownerId: draft.ownerId,
      planVersion: draft.plan.version,
      planHash: draft.plan.planHash,
      actionType: "SEND_FOLLOW_UP",
      recipient: draft.plan.allowedRecipient,
      sharedFields: { transactionRef: requirement?.transactionRef ?? "" }
    }, "2026-08-17T19:00:01.000Z");
    expect(decision).toEqual({ authorized: false, reasonCodes: ["APPROVAL_EXPIRED"] });
  });

  it.each(["CANCELLED", "EXPIRED", "DONE"] as const)("rejects late evidence after %s", async (state) => {
    const draft = makeDraftMission();
    const record = vi.fn();
    const service = new EvidenceService({
      get: () => Promise.resolve({
        caseId: draft.caseId, ownerId: draft.ownerId, state, version: 4, plan: draft.plan
      }),
      record
    }, { createIfAbsent: vi.fn() });
    await expect(service.reconcile({ caseId: draft.caseId } as never, "2026-08-17T19:00:02.000Z"))
      .rejects.toThrow("EVIDENCE_NOT_ACCEPTED_IN_STATE");
    expect(record).not.toHaveBeenCalled();
  });
});
