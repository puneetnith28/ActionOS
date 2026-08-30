import { describe, expect, it, vi } from "vitest";
import type { DraftCase } from "../src/intake-service";
import { PlanService } from "../src/plan-service";
import type { PlanStore } from "../src/plan-service";

const hash = `sha256:${"a".repeat(64)}`;
const provenance = [
  {
    artifactId: "artifact_12345678",
    locator: "text:0-100",
    excerptHash: hash,
    confidence: "HIGH" as const
  }
];

function caseDraft(): DraftCase {
  return {
    caseId: "case_12345678",
    ownerId: "person_12345678",
    artifactId: "artifact_12345678",
    dedupeKey: hash,
    state: "AWAITING_APPROVAL",
    promiseDraft: {
      promisor: { value: "Northstar", provenance, uncertainty: "NONE" },
      result: { value: "USD 79 refund", provenance, uncertainty: "NONE" },
      amountMinor: { value: 7900, provenance, uncertainty: "NONE" },
      currency: { value: "USD", provenance, uncertainty: "NONE" },
      transactionRef: { value: "ORDER-79", provenance, uncertainty: "NONE" },
      dueAt: { value: "2026-08-20T00:00:00.000Z", provenance, uncertainty: "NONE" },
      proposedEvidenceLevel: "MERCHANT_CONFIRMED"
    },
    plan: {
      planId: "plan_12345678",
      caseId: "case_12345678",
      ownerId: "person_12345678",
      version: 1,
      planHash: hash,
      goal: "USD 79 refund",
      allowedActions: ["SEND_FOLLOW_UP"],
      allowedRecipient: "merchant@controlled.test",
      sharedFields: ["transactionRef", "amountMinor", "currency"],
      evidenceRequirements: [
        {
          minimumLevel: "MERCHANT_CONFIRMED",
          amountMinor: 7900,
          currency: "USD",
          transactionRef: "ORDER-79",
          maxAgeSeconds: 3600,
          trustedIssuer: "merchant-sandbox"
        }
      ],
      expiresAt: "2026-08-22T00:00:00.000Z"
    },
    activationBlocked: false,
    blockingFields: [],
    createdAt: "2026-08-15T00:00:00.000Z"
  };
}

class MemoryPlanStore implements PlanStore {
  constructor(private draft: DraftCase = caseDraft()) {}
  get(): Promise<DraftCase> {
    return Promise.resolve(this.draft);
  }
  replace(_caseId: string, expectedPlanVersion: number, next: DraftCase): Promise<void> {
    if (this.draft.plan.version !== expectedPlanVersion)
      return Promise.reject(new Error("CONFLICT"));
    this.draft = next;
    return Promise.resolve();
  }
  deleteDraft(_caseId: string, ownerId: string): Promise<void> {
    if (this.draft.ownerId !== ownerId) return Promise.reject(new Error("CASE_OWNERSHIP_REQUIRED"));
    this.draft = undefined as unknown as DraftCase;
    return Promise.resolve();
  }
}

describe("PlanService", () => {
  it("simulates without performing an external action", async () => {
    const service = new PlanService(new MemoryPlanStore());
    await expect(service.simulate("case_12345678", "person_12345678")).resolves.toMatchObject({
      completionLevel: "MERCHANT_CONFIRMED",
      externalActionPerformed: false
    });
  });

  it("invalidates the prior hash and version after correction", async () => {
    const service = new PlanService(new MemoryPlanStore());
    const revised = await service.revise("case_12345678", "person_12345678", 1, {
      amountMinor: 5900
    });
    expect(revised.plan.version).toBe(2);
    expect(revised.plan.planHash).not.toBe(hash);
    expect(revised.plan.evidenceRequirements[0]?.amountMinor).toBe(5900);
  });

  it("lets a person correct certain fields and remove an inapplicable amount or deadline", async () => {
    const initial = caseDraft();
    const service = new PlanService(new MemoryPlanStore({
      ...initial,
      plan: { ...initial.plan, promiseType: "GENERAL" }
    }));
    const revised = await service.revise("case_12345678", "person_12345678", 1, {
      promisor: "Northstar Argentina",
      result: "Replacement delivered",
      amountMinor: null,
      currency: null,
      transactionRef: "CASE-AR-42",
      dueAt: null,
      followUpAt: "2026-08-19T12:00:00.000Z"
    });

    expect(revised.promiseDraft).toMatchObject({
      promisor: { value: "Northstar Argentina", uncertainty: "NONE" },
      result: { value: "Replacement delivered", uncertainty: "NONE" },
      transactionRef: { value: "CASE-AR-42", uncertainty: "NONE" }
    });
    expect(revised.promiseDraft.amountMinor).toBeUndefined();
    expect(revised.promiseDraft.currency).toBeUndefined();
    expect(revised.promiseDraft.dueAt).toBeUndefined();
    expect(revised.plan.evidenceRequirements[0]).not.toHaveProperty("amountMinor");
    expect(revised.plan.evidenceRequirements[0]).not.toHaveProperty("currency");
    expect(revised.plan.followUpAt).toBe("2026-08-19T12:00:00.000Z");
    expect(revised.plan.messageSubject).toBe("Follow-up for CASE-AR-42");
    expect(revised.plan.messageBody).toContain("Requested outcome: Replacement delivered");
    expect(revised.plan.messageBody).not.toContain("Amount:");
  });

  it("binds a corrected company email into a new plan version", async () => {
    const service = new PlanService(new MemoryPlanStore());
    const revised = await service.revise("case_12345678", "person_12345678", 1, {
      allowedRecipient: "support@northstar.example"
    });
    expect(revised.plan.allowedRecipient).toBe("support@northstar.example");
    expect(revised.plan.version).toBe(2);
    expect(revised.plan.planHash).not.toBe(hash);
  });

  it("switches channels only through trusted server configuration and invalidates approval fields", async () => {
    const service = new PlanService(new MemoryPlanStore());
    const revised = await service.selectChannel("case_12345678", "person_12345678", 1, {
      channelType: "MANAGED_EMAIL",
      allowedRecipient: "support@northstar.example",
      senderIdentity: "DueBack <followup@dueback.example>",
      replyRoute: "case+opaque@reply.dueback.example",
      trustedIssuer: "managed-email:recipient-hash"
    });
    expect(revised.plan).toMatchObject({
      version: 2,
      channelType: "MANAGED_EMAIL",
      allowedRecipient: "support@northstar.example",
      senderIdentity: "DueBack <followup@dueback.example>",
      replyRoute: "case+opaque@reply.dueback.example"
    });
    expect(revised.plan.evidenceRequirements[0]?.trustedIssuer)
      .toBe("managed-email:recipient-hash");
    expect(revised.plan.planHash).not.toBe(hash);
  });

  it("keeps the message derived from the current contract across a return-channel revision", async () => {
    const initial = caseDraft();
    const configured: DraftCase = {
      ...initial,
      plan: {
        ...initial.plan,
        channelType: "MANAGED_EMAIL",
        senderIdentity: "DueBack <followup@example.test>",
        replyRoute: "case+opaque@inbound.example.test",
        messageTemplateVersion: "follow-up/v1",
        messageSubject: "Follow-up for ORDER-79",
        messageBody: "Please confirm ORDER-79.",
        followUpIntervalSeconds: 172800,
        maxLogicalSends: 3
      }
    };
    const service = new PlanService(new MemoryPlanStore(configured));
    const revised = await service.revise("case_12345678", "person_12345678", 1, {
      notificationRecipient: "OWNER@EXAMPLE.TEST"
    });
    expect(revised.plan).toMatchObject({
      channelType: "MANAGED_EMAIL",
      messageTemplateVersion: "follow-up/v1",
      messageSubject: "Follow-up for ORDER-79",
      followUpIntervalSeconds: 172800,
      maxLogicalSends: 3,
      notificationRecipient: "owner@example.test"
    });
    expect(revised.plan.messageBody).toContain("Requested outcome:");
    expect(revised.plan.messageBody).toContain("ORDER-79");
    expect(revised.plan.version).toBe(2);
    expect(revised.plan.planHash).not.toBe(hash);
  });

  it("does not allow an activated plan to be silently revised", async () => {
    const initial = caseDraft();
    const service = new PlanService(new MemoryPlanStore({
      ...initial,
      state: "READY",
      approval: {
        approvalId: "approval_12345678",
        ownerId: initial.ownerId,
        caseId: initial.caseId,
        planVersion: 1,
        planHash: hash,
        approvedAt: "2026-08-15T12:00:00.000Z",
        expiresAt: initial.plan.expiresAt
      }
    }));
    await expect(service.revise(initial.caseId, initial.ownerId, 1, {
      allowedRecipient: "other@example.test"
    })).rejects.toThrow("PLAN_NOT_EDITABLE");
  });

  it("lets a person resolve every critical field exposed by intake", async () => {
    const initial = caseDraft();
    const blocked: DraftCase = {
      ...initial,
      promiseDraft: {
        ...initial.promiseDraft,
        promisor: { ...initial.promiseDraft.promisor, uncertainty: "AMBIGUOUS" },
        result: { ...initial.promiseDraft.result, uncertainty: "AMBIGUOUS" },
        amountMinor: initial.promiseDraft.amountMinor
          ? { ...initial.promiseDraft.amountMinor, uncertainty: "CONTRADICTORY" }
          : undefined,
        currency: initial.promiseDraft.currency
          ? { ...initial.promiseDraft.currency, uncertainty: "AMBIGUOUS" }
          : undefined,
        transactionRef: { ...initial.promiseDraft.transactionRef, uncertainty: "AMBIGUOUS" },
        dueAt: undefined
      },
      blockingFields: ["promisor", "result", "amountMinor", "currency", "transactionRef", "followUpAt"],
      activationBlocked: true
    };
    const service = new PlanService(new MemoryPlanStore(blocked));

    const revised = await service.revise("case_12345678", "person_12345678", 1, {
      promisor: "Northstar Store",
      result: "USD 59 refund",
      amountMinor: 5900,
      currency: "USD",
      transactionRef: "REF-1001",
      followUpAt: "2026-08-20T00:00:00.000Z"
    });

    expect(revised.activationBlocked).toBe(false);
    expect(revised.blockingFields).toEqual([]);
    expect(revised.plan.goal).toBe("USD 59 refund");
    expect(revised.plan.followUpAt).toBe("2026-08-20T00:00:00.000Z");
    expect(revised.plan.evidenceRequirements[0]).toMatchObject({
      amountMinor: 5900,
      currency: "USD",
      transactionRef: "REF-1001"
    });
  });

  it("binds approval and schedules the first durable wake-up", async () => {
    const scheduleCase = vi.fn(() => Promise.resolve({}));
    const service = new PlanService(new MemoryPlanStore(), { scheduleCase });
    const approved = await service.approve({
      caseId: "case_12345678",
      ownerId: "person_12345678",
      expectedPlanVersion: 1,
      expectedPlanHash: hash,
      now: "2026-08-15T12:00:00.000Z"
    });
    expect(approved.state).toBe("READY");
    expect(approved.approval).toMatchObject({
      ownerId: "person_12345678",
      planVersion: 1,
      planHash: hash
    });
    expect(scheduleCase).toHaveBeenCalledWith(expect.objectContaining({
      caseId: "case_12345678",
      expectedVersion: 1,
      wakeAt: "2026-08-20T00:00:00.000Z"
    }));
  });

  it("rejects approval of a stale plan hash", async () => {
    const service = new PlanService(new MemoryPlanStore());
    await expect(
      service.approve({
        caseId: "case_12345678",
        ownerId: "person_12345678",
        expectedPlanVersion: 1,
        expectedPlanHash: "sha256:stale",
        now: "2026-08-15T12:00:00.000Z"
      })
    ).rejects.toThrow("STALE_PLAN_APPROVAL");
  });

  it("deletes a pre-activation draft owned by the person", async () => {
    const store = new MemoryPlanStore();
    const service = new PlanService(store);
    await expect(service.deleteDraft("case_12345678", "person_12345678")).resolves.toBeUndefined();
    await expect(store.get()).resolves.toBeUndefined();
  });
});
