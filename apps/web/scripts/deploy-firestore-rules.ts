import { readFile } from "node:fs/promises";
import { getApps, initializeApp } from "firebase-admin/app";
import { getSecurityRules } from "firebase-admin/security-rules";

async function main(): Promise<void> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT_REQUIRED");
  if (!getApps().length) initializeApp({ projectId });

  const source = await readFile(
    new URL("../../../infra/firestore/firestore.rules", import.meta.url)
  );
  const rules = getSecurityRules();
  const released = await rules.releaseFirestoreRulesetFromSource(source);
  const active = await rules.getFirestoreRuleset();
  const activeContent = active.source.find((file) => file.name === "firestore.rules")?.content;
  if (active.name !== released.name || activeContent !== source.toString("utf8")) {
    throw new Error("FIRESTORE_RULESET_VERIFICATION_FAILED");
  }
  process.stdout.write(`Released and verified Firestore ruleset ${released.name}\n`);
}

void main();
