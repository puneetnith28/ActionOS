import { describe, expect, it } from "vitest";
import { DomainTransitionError, reduceCase } from "../src/reducer";
import type { ApprovalBoundary, CaseSnapshot } from "../src/types";

const approval: ApprovalBoundary = {
  ownerId: "person_1",
  planVersion: 1,
  planHash: "sha256:plan",
  expiresAt: "2999-08-15T12:00:00.000Z"
};

const running: CaseSnapshot = {
  caseId: "case_1",
  ownerId: "person_1",
  state: "RUNNING",
  version: 3,
  planVersion: 1,
  planHash: "sha256:plan",
  approval
};

describe("reduceCase", () => {
  it("never treats tool success or acknowledgement as DONE", () => {
    expect(() =>
      reduceCase(running, {
        expectedVersion: 3,
        target: "DONE",
        reasonCode: "TOOL_SUCCEEDED",
        actor: "SYSTEM"
      })
    ).toThrow(
      new DomainTransitionError(
        "DONE requires accepted deterministic verification",
        "VERIFICATION_REQUIRED"
      )
    );
  });

  it("allows DONE only with accepted deterministic verification", () => {
    const result = reduceCase(running, {
      expectedVersion: 3,
      target: "DONE",
      reasonCode: "EVIDENCE_ACCEPTED",
      actor: "SYSTEM",
      verification: {
        accepted: true,
        level: "MERCHANT_CONFIRMED",
        reasonCodes: ["ACCEPTED"]
      }
    });
    expect(result.snapshot.state).toBe("DONE");
    expect(result.snapshot.completedLevel).toBe("MERCHANT_CONFIRMED");
  });

  it("rejects stale concurrent commands", () => {
    expect(() =>
      reduceCase(running, {
        expectedVersion: 2,
        target: "WAITING_EXTERNAL",
        reasonCode: "REQUEST_SENT",
        actor: "SYSTEM"
      })
    ).toThrow(new DomainTransitionError("Case version changed", "VERSION_CONFLICT"));
  });

  it("rejects an approval for another owner or plan", () => {
    const awaitingApproval: CaseSnapshot = {
      caseId: running.caseId,
      ownerId: running.ownerId,
      state: "AWAITING_APPROVAL",
      version: 1,
      planVersion: running.planVersion,
      planHash: running.planHash
    };
    expect(() =>
      reduceCase(awaitingApproval, {
        expectedVersion: 1,
        target: "READY",
        reasonCode: "PLAN_APPROVED",
        actor: "PERSON",
        approval: { ...approval, ownerId: "attacker" }
      })
    ).toThrow(/Approval does not match/);
  });

  it("rejects an illegal direct transition from draft to running", () => {
    const draft: CaseSnapshot = {
      caseId: "case_1",
      ownerId: "person_1",
      state: "DRAFT",
      version: 0,
      planVersion: 1,
      planHash: "sha256:plan"
    };
    expect(() =>
      reduceCase(draft, {
        expectedVersion: 0,
        target: "RUNNING",
        reasonCode: "BYPASS_APPROVAL",
        actor: "SYSTEM"
      })
    ).toThrow(/Illegal transition/);
  });

  it.each(["CANCELLED", "EXPIRED"] as const)(
    "allows a user-controlled %s terminal state",
    (target) => {
      const result = reduceCase(running, {
        expectedVersion: 3,
        target,
        reasonCode: target,
        actor: "PERSON"
      });
      expect(result.snapshot.state).toBe(target);
    }
  );

  it("reopens DONE into NEEDS_ATTENTION while preserving the evidence level", () => {
    const done: CaseSnapshot = {
      ...running,
      state: "DONE",
      completedLevel: "MERCHANT_CONFIRMED"
    };
    const result = reduceCase(done, {
      expectedVersion: 3,
      target: "NEEDS_ATTENTION",
      reasonCode: "USER_REPORTS_UNRESOLVED",
      actor: "PERSON"
    });
    expect(result.snapshot.state).toBe("NEEDS_ATTENTION");
    expect(result.snapshot.completedLevel).toBe("MERCHANT_CONFIRMED");
  });
});
