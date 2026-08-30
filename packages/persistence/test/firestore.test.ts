import { describe, expect, it } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import type { MissionSnapshot } from "@actionos/domain";
import { FirestoreCaseRepository } from "../src/firestore";

describe("FirestoreCaseRepository", () => {
  it("creates and retrieves a case without changing its version", async () => {
    let stored: MissionSnapshot | undefined;
    const fakeFirestore = {
      collection: () => ({
        doc: () => ({
          create: (snapshot: MissionSnapshot) => {
            stored = snapshot;
            return Promise.resolve();
          },
          get: () =>
            Promise.resolve({
              exists: stored !== undefined,
              data: () => stored
            })
        })
      })
    } as unknown as Firestore;

    const repository = new FirestoreCaseRepository(fakeFirestore);
    const snapshot: MissionSnapshot = {
      missionId: "mission_12345678",
      ownerId: "person_12345678",
      state: "DRAFT",
      version: 0,
      planVersion: 1,
      planHash: "sha256:plan"
    };

    await repository.create(snapshot);
    await expect(repository.get(snapshot.missionId)).resolves.toEqual(snapshot);
  });
});
