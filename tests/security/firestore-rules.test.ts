import { afterAll, beforeAll, describe, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "actionos-rules-test",
    firestore: {
      rules: await readFile("infra/firestore/firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080
    }
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "missionRuns/mission_owned"), { ownerId: "owner_a" });
    await setDoc(doc(context.firestore(), "missionRuns/mission_owned/events/event_1"), { missionId: "mission_owned" });
    await setDoc(doc(context.firestore(), "missionRuns/mission_owned/evidence/evidence_1"), { missionId: "mission_owned" });
    await setDoc(doc(context.firestore(), "missionDrafts/draft_1"), { ownerId: "owner_a" });
    await setDoc(doc(context.firestore(), "interventions/intervention_1"), { ownerId: "owner_a" });
    await setDoc(doc(context.firestore(), "notifications/notification_1"), { ownerId: "owner_a" });
    await setDoc(doc(context.firestore(), "providerEvents/provider_1"), { status: "FAILED" });
    await setDoc(doc(context.firestore(), "inboundEnvelopes/inbound_1"), { text: "private" });
    await setDoc(doc(context.firestore(), "messageThreads/thread_1"), { missionId: "mission_owned" });
  });
});

afterAll(async () => environment.cleanup());

describe("Firestore ownership and server-only channel records", () => {
  it("allows only the owner to read the mission and its event/evidence history", async () => {
    const owner = environment.authenticatedContext("owner_a").firestore();
    const attacker = environment.authenticatedContext("owner_b").firestore();
    await assertSucceeds(getDoc(doc(owner, "missionRuns/mission_owned")));
    await assertSucceeds(getDoc(doc(owner, "missionRuns/mission_owned/events/event_1")));
    await assertSucceeds(getDoc(doc(owner, "missionRuns/mission_owned/evidence/evidence_1")));
    await assertSucceeds(getDoc(doc(owner, "missionDrafts/draft_1")));
    await assertSucceeds(getDoc(doc(owner, "interventions/intervention_1")));
    await assertSucceeds(getDoc(doc(owner, "notifications/notification_1")));

    await assertFails(getDoc(doc(attacker, "missionRuns/mission_owned")));
    await assertFails(getDoc(doc(attacker, "missionRuns/mission_owned/events/event_1")));
    await assertFails(getDoc(doc(attacker, "missionRuns/mission_owned/evidence/evidence_1")));
    await assertFails(getDoc(doc(attacker, "missionDrafts/draft_1")));
    await assertFails(getDoc(doc(attacker, "interventions/intervention_1")));
    await assertFails(getDoc(doc(attacker, "notifications/notification_1")));
  });

  it.each(["providerEvents/provider_1", "inboundEnvelopes/inbound_1", "messageThreads/thread_1"])(
    "denies client reads and writes for server-only %s",
    async (path) => {
      const owner = environment.authenticatedContext("owner_a").firestore();
      await assertFails(getDoc(doc(owner, path)));
      await assertFails(setDoc(doc(owner, path), { compromised: true }));
    }
  );
});
