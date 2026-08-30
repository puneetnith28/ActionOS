import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { stableHash } from "../../packages/domain/src/identity.ts";

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const ownerId = process.env.ACTIONOS_DEMO_OWNER_ID;

if (!projectId || !ownerId) {
  throw new Error("GOOGLE_CLOUD_PROJECT and ACTIONOS_DEMO_OWNER_ID are required");
}

if (!getApps().length) initializeApp({ projectId });
const db = getFirestore();

const testHash = `sha256:${"a".repeat(64)}`;

async function seed() {
  const batch = db.batch();

  const draftId = `demo_draft_${Date.now()}`;
  const runId1 = `demo_run_1_${Date.now()}`;
  const runId2 = `demo_run_2_${Date.now()}`;

  const provenance = [
    {
      artifactId: "artifact_12345678",
      locator: "text:0-100",
      excerptHash: testHash,
      confidence: "HIGH"
    }
  ];

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Ready Draft
  batch.set(db.collection("missionDrafts").doc(draftId), {
    missionId: draftId,
    ownerId,
    artifactId: "artifact_demo_1",
    dedupeKey: testHash,
    state: "READY",
    promiseDraft: {
      goalType: "REFUND",
      promisor: { value: "AeroTravel", provenance, uncertainty: "NONE" },
      result: { value: "USD 350 refund", provenance, uncertainty: "NONE" },
      amountMinor: { value: 35000, provenance, uncertainty: "NONE" },
      currency: { value: "USD", provenance, uncertainty: "NONE" },
      transactionRef: { value: "FLIGHT-XYZ", provenance, uncertainty: "NONE" },
      dueAt: { value: nextWeek, provenance, uncertainty: "NONE" },
      proposedVerificationStatus: "ACTION_ATTEMPTED"
    },
    plan: {
      planId: `plan_${draftId}`,
      missionId: draftId,
      ownerId,
      version: 1,
      planHash: testHash,
      goal: "USD 350 refund",
      allowedActions: ["SEND_FOLLOW_UP", "CHECK_STATUS"],
      allowedRecipient: "support@aerotravel.test",
      channelType: "MANAGED_EMAIL",
      sharedFields: ["transactionRef", "amountMinor", "currency"],
      evidenceRequirements: [
        {
          minimumLevel: "OUTCOME_CONFIRMED",
          amountMinor: 35000,
          currency: "USD",
          transactionRef: "FLIGHT-XYZ",
          maxAgeSeconds: 3600,
          trustedIssuer: "managed-email"
        }
      ],
      expiresAt: nextWeek,
      executionMode: "ACCELERATED_DEMO"
    },
    activationBlocked: false,
    blockingFields: [],
    createdAt: now.toISOString()
  });

  // 2. Active Run
  batch.set(db.collection("missionRuns").doc(runId1), {
    missionId: runId1,
    ownerId,
    state: "RUNNING",
    version: 1,
    plan: {
      planId: `plan_${runId1}`,
      missionId: runId1,
      ownerId,
      version: 1,
      planHash: testHash,
      goal: "USD 120 bill credit",
      allowedActions: ["SEND_FOLLOW_UP", "CHECK_STATUS"],
      allowedRecipient: "billing@internetprovider.test",
      channelType: "MANAGED_EMAIL",
      sharedFields: ["transactionRef", "amountMinor", "currency"],
      evidenceRequirements: [
        {
          minimumLevel: "OUTCOME_CONFIRMED",
          amountMinor: 12000,
          currency: "USD",
          transactionRef: "ACCT-1234",
          maxAgeSeconds: 3600,
          trustedIssuer: "managed-email"
        }
      ],
      expiresAt: nextWeek,
      executionMode: "ACCELERATED_DEMO"
    },
    boundary: {
      maxLogicalSends: 3,
      followUpIntervalSeconds: 86400,
      timingPolicyVersion: "accelerated-demo/v1",
      expiresAt: nextWeek
    },
    actionOrdinal: 1,
    dueAt: nextWeek,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastAttemptAt: now.toISOString()
  });

  // 3. Completed Run
  batch.set(db.collection("missionRuns").doc(runId2), {
    missionId: runId2,
    ownerId,
    state: "COMPLETED",
    version: 2,
    plan: {
      planId: `plan_${runId2}`,
      missionId: runId2,
      ownerId,
      version: 1,
      planHash: testHash,
      goal: "Replacement part shipped",
      allowedActions: ["SEND_FOLLOW_UP", "CHECK_STATUS"],
      allowedRecipient: "returns@hardware.test",
      channelType: "MANAGED_EMAIL",
      sharedFields: ["transactionRef"],
      evidenceRequirements: [
        {
          minimumLevel: "OUTCOME_CONFIRMED",
          transactionRef: "ORDER-999",
          maxAgeSeconds: 3600,
          trustedIssuer: "managed-email"
        }
      ],
      expiresAt: nextWeek,
      executionMode: "ACCELERATED_DEMO"
    },
    boundary: {
      maxLogicalSends: 3,
      followUpIntervalSeconds: 86400,
      timingPolicyVersion: "accelerated-demo/v1",
      expiresAt: nextWeek
    },
    actionOrdinal: 2,
    completedStatus: "OUTCOME_CONFIRMED",
    dueAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastAttemptAt: now.toISOString()
  });

  await batch.commit();
  console.log("Demo seed complete!");
}

seed().catch(console.error);
