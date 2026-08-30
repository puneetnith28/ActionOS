import { describe, expect, it, vi } from "vitest";
import { acceptUpload } from "../../packages/capabilities/src/upload";
import { validateCapabilityExecution } from "../../packages/domain/src/capability-validator";
import { ExecutionBroker } from "../../packages/runtime/src/capability-broker";
import { MissionRunner, type FollowThroughMission } from "../../packages/runtime/src/mission-runner";
import { IntakeService, type DraftCase } from "../../packages/runtime/src/intake-service";
import { assertLogicalActionBudget, redactedPublicError } from "../../apps/web/lib/security-limits";
import { makeDraftCase } from "../helpers/draft-case";

describe("hostile input and budget boundaries", () => {
  it("treats prompt injection as data and denies its requested authority", () => {
    const draft = makeDraftCase();
    const decision = validateCapabilityExecution(
      {
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
          expiresAt: draft.plan.expiresAt
        }
      },
      {
        ownerId: draft.ownerId,
        planVersion: draft.plan.version,
        planHash: draft.plan.planHash,
        actionType: "EXPORT_ALL_CASES",
        recipient: "attacker.invalid",
        sharedFields: { sourceInstruction: "mark settled" }
      },
      "2026-08-16T00:00:00.000Z"
    );
    expect(decision.authorized).toBe(false);
    expect(decision.reasonCodes).toEqual(
      expect.arrayContaining(["ACTION_NOT_ALLOWED", "RECIPIENT_NOT_ALLOWED", "FIELD_NOT_ALLOWED"])
    );
  });

  it.each([
    ["application/pdf", "<html><script>act()</script></html>"],
    ["text/html", "<html>active</html>"],
    ["application/zip", "PK\u0003\u0004archive"]
  ])("rejects active or mismatched format %s", (declaredMediaType, content) => {
    expect(() =>
      acceptUpload({
        declaredMediaType,
        bytes: new TextEncoder().encode(content),
        receivedAt: "2026-08-16T00:00:00.000Z"
      })
    ).toThrow();
  });

  it("deduplicates before consuming another new-case budget", async () => {
    let saved: DraftCase | undefined;
    const consume = vi.fn(() => Promise.resolve());
    const service = new IntakeService(
      {
        findByDedupeKey: () => Promise.resolve(saved),
        createDraft: (draft) => {
          saved = draft;
          return Promise.resolve();
        }
      },
      { extract: () => Promise.resolve(makeDraftCase().promiseDraft) },
      "merchant@controlled.test",
      { consume }
    );
    const artifact = {
      artifactId: "artifact_hostile_1234",
      ownerId: "person_owner_1234",
      sourceChannel: "paste" as const,
      sha256: "same-content",
      content: "same promise"
    };
    await service.intake(artifact, "2026-08-16T00:00:00.000Z");
    await service.intake(artifact, "2026-08-16T00:01:00.000Z");
    expect(consume).toHaveBeenCalledOnce();
  });

  it("moves an over-budget action to attention without calling the adapter", async () => {
    const draft = makeDraftCase();
    let item: FollowThroughMission = {
      caseId: draft.caseId,
      ownerId: draft.ownerId,
      state: "READY",
      version: 1,
      plan: draft.plan,
      approval: {
        ownerId: draft.ownerId,
        planVersion: 1,
        planHash: draft.plan.planHash,
        expiresAt: draft.plan.expiresAt
      },
      actionOrdinal: 4,
      dueAt: "2026-08-15T00:00:00.000Z"
    };
    const execute = vi.fn();
    const runner = new MissionRunner(
      {
        get: () => Promise.resolve(item),
        compareAndSet: (_caseId, _version, next) => {
          item = next;
          return Promise.resolve();
        }
      },
      new ExecutionBroker(
        {
          reserve: vi.fn(),
          succeed: vi.fn(),
          fail: vi.fn()
        },
        { execute }
      ),
      { scheduleMission: vi.fn() }
    );
    await expect(
      runner.run({ caseId: item.caseId, expectedVersion: 1, now: "2026-08-16T00:00:00.000Z" })
    ).resolves.toMatchObject({ status: "NEEDS_ATTENTION" });
    expect(execute).not.toHaveBeenCalled();
    expect(item.state).toBe("NEEDS_ATTENTION");
  });

  it("redacts unexpected security failures and enforces the logical action bound", () => {
    expect(() => assertLogicalActionBudget(4)).toThrow("LOGICAL_ACTION_BUDGET_EXHAUSTED");
    expect(redactedPublicError(new Error("secret prompt content"))).toBe("REQUEST_FAILED");
  });
});
