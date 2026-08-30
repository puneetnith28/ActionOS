import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { stableHash } from "../../packages/domain/src/identity.ts";

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const missionId = process.env.ACTIONOS_DEMO_MISSION_ID;
const ownerId = process.env.ACTIONOS_DEMO_OWNER_ID;
const confirmation = process.env.CONFIRM_DEMO_RESET;
if (!projectId || !missionId || !ownerId) {
  throw new Error(
    "GOOGLE_CLOUD_PROJECT, ACTIONOS_DEMO_MISSION_ID, and ACTIONOS_DEMO_OWNER_ID are required"
  );
}
if (confirmation !== stableHash({ projectId, missionId, ownerId })) {
  throw new Error("CONFIRM_DEMO_RESET must equal the exact scoped reset hash");
}
if (!getApps().length) initializeApp({ projectId });
const db = getFirestore();
const [draft, run] = await Promise.all([
  db.collection("missionDrafts").doc(missionId).get(),
  db.collection("missionRuns").doc(missionId).get()
]);
const observedOwner = String(run.get("ownerId") ?? draft.get("ownerId") ?? "");
if (!observedOwner) throw new Error("DEMO_MISSION_NOT_FOUND");
if (observedOwner !== ownerId) throw new Error("DEMO_OWNER_MISMATCH");

const notifications = await db.collection("notifications").where("missionId", "==", missionId).get();
const interventions = await db.collection("interventions").where("missionId", "==", missionId).get();
const batch = db.batch();
for (const document of [...notifications.docs, ...interventions.docs]) batch.delete(document.ref);
batch.delete(draft.ref);
batch.delete(run.ref);
await batch.commit();
await db.recursiveDelete(run.ref);
process.stdout.write(`Reset only ${missionId} for owner hash ${stableHash(ownerId).slice(0, 20)}\n`);
