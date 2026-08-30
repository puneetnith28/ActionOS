import { describe, expect, it } from "vitest";
import { PlanService } from "@actionos/runtime/plan-service";
import type { DraftMission } from "@actionos/runtime/intake-service";
import { handlePlanRequest } from "../lib/plan-controller";

describe("plan API contract", () => {
  it("does not allow another owner to inspect a case", async () => {
    const service = new PlanService({
      get: () => Promise.resolve({ ownerId: "person_12345678" } as DraftMission),
      replace: () => Promise.resolve()
    });
    const response = await handlePlanRequest(
      new Request("https://actionos.test/api/cases/mission_12345678/plan"),
      "mission_12345678",
      {
        authenticate: () => Promise.resolve({ uid: "person_attacker" }),
        service,
        now: () => "2026-08-15T12:00:00.000Z"
      }
    );
    expect(response.status).toBe(403);
  });

  it("refuses boundary.when the persisted channel is unavailable", async () => {
    const service = new PlanService({
      get: () => Promise.resolve({
        ownerId: "person_12345678",
        plan: { channelType: "MANAGED_EMAIL" }
      } as DraftMission),
      replace: () => Promise.resolve()
    });
    const response = await handlePlanRequest(
      new Request("https://actionos.test/api/cases/mission_12345678/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          expectedPlanVersion: 1,
          expectedPlanHash: `sha256:${"a".repeat(64)}`
        })
      }),
      "mission_12345678",
      {
        authenticate: () => Promise.resolve({ uid: "person_12345678" }),
        service,
        now: () => "2026-08-16T12:00:00.000Z",
        isChannelAvailable: () => false
      }
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "CONTACT_CHANNEL_UNAVAILABLE" });
  });

  it("refuses real email activation for an anonymous browser owner", async () => {
    const service = new PlanService({
      get: () => Promise.resolve({
        ownerId: "person_12345678",
        plan: { channelType: "MANAGED_EMAIL" }
      } as DraftMission),
      replace: () => Promise.resolve()
    });
    const response = await handlePlanRequest(
      new Request("https://actionos.test/api/cases/mission_12345678/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          expectedPlanVersion: 1,
          expectedPlanHash: `sha256:${"a".repeat(64)}`
        })
      }),
      "mission_12345678",
      {
        authenticate: () => Promise.resolve({
          uid: "person_12345678",
          firebase: { sign_in_provider: "anonymous" }
        }),
        service,
        now: () => "2026-08-16T12:00:00.000Z",
        isChannelAvailable: () => true,
        isRecoverableOwner: (owner) => owner.firebase?.sign_in_provider === "google.com"
      }
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "RECOVERABLE_IDENTITY_REQUIRED" });
  });

  it("refuses sending owner notifications to an unverified third-party email", async () => {
    const service = new PlanService({
      get: () => Promise.resolve({
        ownerId: "person_12345678",
        plan: {
          channelType: "MANAGED_EMAIL",
          notificationRecipient: "third-party@example.test"
        }
      } as DraftMission),
      replace: () => Promise.resolve()
    });
    const response = await handlePlanRequest(
      new Request("https://actionos.test/api/cases/mission_12345678/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "approve", expectedPlanVersion: 1,
          expectedPlanHash: `sha256:${"a".repeat(64)}`
        })
      }),
      "mission_12345678",
      {
        authenticate: () => Promise.resolve({
          uid: "person_12345678", email: "owner@example.test", email_verified: true,
          firebase: { sign_in_provider: "google.com" }
        }),
        service,
        now: () => "2026-08-16T12:00:00.000Z",
        isChannelAvailable: () => true,
        isRecoverableOwner: () => true
      }
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "VERIFIED_NOTIFICATION_EMAIL_REQUIRED"
    });
  });

  it("approves and schedules a supported current channel", async () => {
    const hash = `sha256:${"a".repeat(64)}`;
    const provenance = [{
      artifactId: "artifact_12345678", locator: "text:0-100", excerptHash: hash,
      confidence: "HIGH" as const
    }];
    let draft: DraftMission = {
      missionId: "mission_12345678", ownerId: "person_12345678", artifactId: "artifact_12345678",
      dedupeKey: hash, state: "AWAITING_APPROVAL" as const,
      promiseDraft: {
        promisor: { value: "Northstar", provenance, uncertainty: "NONE" as const },
        result: { value: "USD 79 refund", provenance, uncertainty: "NONE" as const },
        amountMinor: { value: 7900, provenance, uncertainty: "NONE" as const },
        currency: { value: "USD", provenance, uncertainty: "NONE" as const },
        transactionRef: { value: "ORDER-79", provenance, uncertainty: "NONE" as const },
        dueAt: { value: "2026-08-20T00:00:00.000Z", provenance, uncertainty: "NONE" as const },
        proposedVerificationStatus: "OUTCOME_CONFIRMED" as const
      },
      plan: {
        planId: "plan_12345678", missionId: "mission_12345678", ownerId: "person_12345678",
        version: 1, planHash: hash, goal: "USD 79 refund",
        allowedActions: ["SEND_FOLLOW_UP" as const], allowedRecipient: "merchant@controlled.test",
        channelType: "CONTROLLED_SANDBOX" as const,
        sharedFields: ["transactionRef", "amountMinor", "currency"],
        evidenceRequirements: [{
          minimumStatus: "OUTCOME_CONFIRMED" as const, amountMinor: 7900, currency: "USD",
          transactionRef: "ORDER-79", maxAgeSeconds: 3600, trustedIssuer: "merchant-sandbox"
        }],
        expiresAt: "2026-08-22T00:00:00.000Z"
      },
      activationBlocked: false, blockingFields: [], createdAt: "2026-08-15T00:00:00.000Z"
    };
    const scheduleMission = () => Promise.resolve({});
    const service = new PlanService({
      get: () => Promise.resolve(draft),
      replace: (_missionId, _version, next) => { draft = next; return Promise.resolve(); }
    }, { scheduleMission });
    const response = await handlePlanRequest(new Request(
      "https://actionos.test/api/cases/mission_12345678/plan",
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        action: "approve", expectedPlanVersion: 1, expectedPlanHash: hash
      }) }
    ), "mission_12345678", {
      authenticate: () => Promise.resolve({ uid: "person_12345678" }),
      service,
      now: () => "2026-08-16T12:00:00.000Z",
      isChannelAvailable: (channel) => channel === "CONTROLLED_SANDBOX"
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ state: "READY" });
  });

  it("rejects a client-selected channel unless the server resolves it as available", async () => {
    const service = new PlanService({
      get: () => Promise.resolve({ ownerId: "person_12345678" } as DraftMission),
      replace: () => Promise.resolve()
    });
    const response = await handlePlanRequest(new Request(
      "https://actionos.test/api/cases/mission_12345678/plan",
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        action: "select-channel", expectedPlanVersion: 1,
        revision: { channelType: "MANAGED_EMAIL", senderIdentity: "attacker@example.test" }
      }) }
    ), "mission_12345678", {
      authenticate: () => Promise.resolve({ uid: "person_12345678" }),
      service,
      now: () => "2026-08-16T12:00:00.000Z",
      isChannelAvailable: () => false,
      resolveChannel: () => undefined
    });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "CONTACT_CHANNEL_UNAVAILABLE" });
  });
});
