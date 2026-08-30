import { describe, expect, it } from "vitest";
import type { MissionGoal } from "@actionos/contracts";
import { IntakeService } from "../src/intake-service";
import type { DraftCase, IntakeStore, PromiseExtractor } from "../src/intake-service";

const hash = `sha256:${"a".repeat(64)}`;

function promiseDraft(uncertainty: "NONE" | "CONTRADICTORY" = "NONE"): MissionGoal {
  const provenance = [
    {
      artifactId: "artifact_12345678",
      locator: "text:0-100",
      excerptHash: hash,
      confidence: "HIGH" as const
    }
  ];
  return {
    promisor: { value: "Northstar", provenance, uncertainty: "NONE" },
    result: { value: "USD 79 refund", provenance, uncertainty: "NONE" },
    amountMinor: { value: 7900, provenance, uncertainty },
    currency: { value: "USD", provenance, uncertainty: "NONE" },
    transactionRef: { value: "ORDER-79", provenance, uncertainty: "NONE" },
    dueAt: { value: "2026-08-20T00:00:00.000Z", provenance, uncertainty: "NONE" },
    proposedVerificationStatus: "OUTCOME_CONFIRMED"
  };
}

class MemoryIntakeStore implements IntakeStore {
  private readonly cases = new Map<string, DraftCase>();

  findByDedupeKey(ownerId: string, dedupeKey: string): Promise<DraftCase | undefined> {
    return Promise.resolve(
      [...this.cases.values()].find(
        (draft) => draft.ownerId === ownerId && draft.dedupeKey === dedupeKey
      )
    );
  }

  createDraft(draft: DraftCase): Promise<void> {
    this.cases.set(draft.missionId, draft);
    return Promise.resolve();
  }
}

describe("IntakeService", () => {
  it("creates one versioned plan and returns the same case for duplicate intake", async () => {
    const extractor: PromiseExtractor = { extract: () => Promise.resolve(promiseDraft()) };
    const service = new IntakeService(
      new MemoryIntakeStore(),
      extractor,
      "merchant@controlled.test"
    );
    const artifact = {
      artifactId: "artifact_12345678",
      ownerId: "person_12345678",
      sourceChannel: "upload" as const,
      sha256: "abc",
      content: "promise"
    };
    const first = await service.intake(artifact, "2026-08-15T12:00:00.000Z");
    const duplicate = await service.intake(artifact, "2026-08-15T12:01:00.000Z");
    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.draft.missionId).toBe(first.draft.missionId);
    expect(first.draft.plan.evidenceRequirements[0]?.minimumStatus).toBe("OUTCOME_CONFIRMED");
    expect(first.draft.plan).toMatchObject({
      executionMode: "ACCELERATED_DEMO",
      timingPolicyVersion: "accelerated-demo/v1",
      followUpAt: "2026-08-15T12:00:02.000Z"
    });
    expect(first.draft.outcomeContract).toMatchObject({
      recipe: "COMMERCIAL_FOLLOW_UP",
      outcome: "USD 79 refund",
      responsibleParty: "Northstar",
      actionIntents: ["FOLLOW_UP", "CHECK_STATUS"],
      recipeData: { reference: "ORDER-79", amountMinor: 7900, currency: "USD" }
    });
  });

  it("blocks activation when a critical amount is contradictory", async () => {
    const extractor: PromiseExtractor = {
      extract: () => Promise.resolve(promiseDraft("CONTRADICTORY"))
    };
    const service = new IntakeService(
      new MemoryIntakeStore(),
      extractor,
      "merchant@controlled.test"
    );
    const result = await service.intake(
      {
        artifactId: "artifact_12345678",
        ownerId: "person_12345678",
        sourceChannel: "paste",
        sha256: "different",
        content: "contradictory promise"
      },
      "2026-08-15T12:00:00.000Z"
    );
    expect(result.draft.activationBlocked).toBe(true);
    expect(result.draft.blockingFields).toContain("amountMinor");
  });

  it("creates a usable general follow-up when the promise has no money", async () => {
    const draft = promiseDraft();
    const general: MissionGoal = {
      goalType: "GENERAL",
      promisor: draft.promisor,
      result: { ...draft.result, value: "Email the coverage certificate" },
      transactionRef: { ...draft.transactionRef, value: "CASE-441" },
      dueAt: draft.dueAt,
      proposedVerificationStatus: "OUTCOME_CONFIRMED"
    };
    const service = new IntakeService(
      new MemoryIntakeStore(),
      { extract: () => Promise.resolve(general) },
      "merchant@controlled.test"
    );
    const result = await service.intake({
      artifactId: "artifact_12345678", ownerId: "person_12345678",
      sourceChannel: "paste", sha256: "general-promise", content: "certificate promise"
    }, "2026-08-15T12:00:00.000Z");
    expect(result.draft.activationBlocked).toBe(false);
    expect(result.draft.plan.goalType).toBe("GENERAL");
    expect(result.draft.plan.sharedFields).toEqual(["transactionRef"]);
    expect(result.draft.plan.messageBody).not.toContain("Amount:");
    expect(result.draft.plan.evidenceRequirements[0]).toMatchObject({
      transactionRef: "CASE-441", minimumStatus: "OUTCOME_CONFIRMED"
    });
  });

  it.each([
    { type: "REFUND" as const, result: "Refund USD 59", money: true, expected: "REFUND" },
    { type: "REFUND" as const, result: "Cancel booking and refund USD 120", money: true, expected: "REFUND" },
    { type: "REPLACEMENT" as const, result: "Replace damaged headphones", money: false, expected: "REPLACEMENT" },
    { type: "GENERAL" as const, result: "Email the coverage certificate", money: false, expected: "GENERAL" }
  ])("builds a valid plan for the visible $type example", async ({ type, result, money, expected }) => {
    const base = promiseDraft();
    const extracted: MissionGoal = {
      goalType: type,
      promisor: base.promisor,
      result: { ...base.result, value: result },
      transactionRef: base.transactionRef,
      dueAt: base.dueAt,
      ...(money ? { amountMinor: base.amountMinor, currency: base.currency } : {}),
      proposedVerificationStatus: "OUTCOME_CONFIRMED"
    };
    const service = new IntakeService(
      new MemoryIntakeStore(),
      { extract: () => Promise.resolve(extracted) },
      "merchant@controlled.test"
    );
    const intake = await service.intake({
      artifactId: "artifact_12345678",
      ownerId: "person_12345678",
      sourceChannel: "paste",
      sha256: `${type}-${result}`,
      content: result
    }, "2026-08-15T12:00:00.000Z");
    expect(intake.draft.plan.goalType).toBe(expected);
    expect(intake.draft.activationBlocked).toBe(false);
    if (type === "REPLACEMENT") {
      expect(intake.draft.plan.evidenceRequirements[0]).toMatchObject({
        subject: result,
        requiredOutcomeFields: ["subject", "trackingNumber"]
      });
      expect(intake.draft.plan.sharedFields).toContain("subject");
    }
  });
});
