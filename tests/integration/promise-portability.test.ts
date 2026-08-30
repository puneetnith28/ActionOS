import { describe, expect, it } from "vitest";
import { validateCapabilityExecution } from "../../packages/domain/src/capability-validator";
import { reduceCase } from "../../packages/domain/src/reducer";
import { verifyEvidence } from "../../packages/domain/src/verifier";
import { assertManifestRequirement } from "../../packages/domain/src/promise-types";
import { ExecutionBroker, type Reservation } from "../../packages/runtime/src/capability-broker";
import {
  billCreditFixture,
  replacementFixture
} from "../../packages/test-fixtures/src/promise-manifests";

const fixtures = [billCreditFixture, replacementFixture] as const;

describe("promise type portability", () => {
  it.each(fixtures)(
    "$manifest.type reuses approval, policy, verification, and lifecycle semantics",
    async ({ manifest, plan, acceptedEvidence }) => {
      const requirement = plan.evidenceRequirements[0];
      if (!requirement) throw new Error("FIXTURE_REQUIREMENT_MISSING");
      assertManifestRequirement(manifest, requirement);
      const approval = {
        ownerId: plan.ownerId,
        planVersion: plan.version,
        planHash: plan.planHash,
        expiresAt: plan.expiresAt
      };
      const proposalFields = Object.fromEntries(
        plan.sharedFields.map((field) => {
          const value = requirement[field as keyof typeof requirement];
          return [field, String(value)];
        })
      );
      const authorization = validateCapabilityExecution(
        {
          ownerId: plan.ownerId,
          planVersion: plan.version,
          planHash: plan.planHash,
          allowedActions: plan.allowedActions,
          allowedRecipient: plan.allowedRecipient,
          sharedFields: plan.sharedFields,
          approval
        },
        {
          ownerId: plan.ownerId,
          planVersion: plan.version,
          planHash: plan.planHash,
          actionType: "SEND_FOLLOW_UP",
          recipient: plan.allowedRecipient,
          sharedFields: proposalFields
        },
        "2026-09-01T12:00:00.000Z"
      );
      expect(authorization.authorized).toBe(true);
      const records = new Map<string, Reservation>();
      const broker = new ExecutionBroker(
        {
          reserve: async (key) => {
            const old = records.get(key);
            if (old) return old;
            records.set(key, { status: "RESERVED" });
            return { status: "RESERVED" };
          },
          succeed: async (key, receipt) => {
            records.set(key, { status: "SUCCEEDED", receipt });
          },
          fail: async (key) => {
            records.delete(key);
          }
        },
        {
          execute: async () => ({
            receiptId: `receipt_${manifest.type.toLowerCase()}`,
            acceptedAt: "2026-09-01T12:00:00.000Z"
          })
        }
      );
      await expect(
        broker.execute({
          caseId: plan.caseId,
          actionOrdinal: 1,
          policy: {
            ownerId: plan.ownerId,
            planVersion: plan.version,
            planHash: plan.planHash,
            allowedActions: plan.allowedActions,
            allowedRecipient: plan.allowedRecipient,
            sharedFields: plan.sharedFields,
            approval
          },
          proposal: {
            ownerId: plan.ownerId,
            planVersion: plan.version,
            planHash: plan.planHash,
            actionType: "SEND_FOLLOW_UP",
            recipient: plan.allowedRecipient,
            sharedFields: proposalFields
          },
          now: "2026-09-01T12:00:00.000Z"
        })
      ).resolves.toMatchObject({ status: "SUCCEEDED", duplicate: false });

      const verification = verifyEvidence({
        caseId: plan.caseId,
        requirement,
        candidate: acceptedEvidence,
        now: "2026-09-01T12:01:00.000Z"
      });
      expect(verification).toMatchObject({ accepted: true, reasonCodes: ["ACCEPTED"] });
      const completed = reduceCase(
        {
          caseId: plan.caseId,
          ownerId: plan.ownerId,
          state: "RUNNING",
          version: 2,
          planVersion: plan.version,
          planHash: plan.planHash,
          approval
        },
        {
          expectedVersion: 2,
          target: "DONE",
          reasonCode: "EVIDENCE_ACCEPTED",
          actor: "SYSTEM",
          verification
        }
      );
      expect(completed.snapshot.state).toBe("DONE");
    }
  );

  it("does not complete a bill credit for the wrong bill period", () => {
    const requirement = billCreditFixture.plan.evidenceRequirements[0];
    if (!requirement) throw new Error("FIXTURE_REQUIREMENT_MISSING");
    expect(
      verifyEvidence({
        caseId: billCreditFixture.plan.caseId,
        requirement,
        candidate: { ...billCreditFixture.acceptedEvidence, billPeriod: "2026-10" },
        now: "2026-09-01T12:01:00.000Z"
      })
    ).toMatchObject({ accepted: false, reasonCodes: ["WRONG_BILL_PERIOD"] });
  });

  it("does not complete a replacement without tracking", () => {
    const requirement = replacementFixture.plan.evidenceRequirements[0];
    if (!requirement) throw new Error("FIXTURE_REQUIREMENT_MISSING");
    const { trackingNumber: _trackingNumber, ...withoutTracking } =
      replacementFixture.acceptedEvidence;
    expect(
      verifyEvidence({
        caseId: replacementFixture.plan.caseId,
        requirement,
        candidate: withoutTracking,
        now: "2026-09-01T12:01:00.000Z"
      })
    ).toMatchObject({ accepted: false, reasonCodes: ["MISSING_TRACKING"] });
  });
});
