import { describe, expect, it } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import type { CaseSnapshot } from "@dueback/domain";
import { FirestoreCaseRepository } from "../src/firestore";

describe("FirestoreCaseRepository", () => {
  it("creates and retrieves a case without changing its version", async () => {
    let stored: CaseSnapshot | undefined;
    const fakeFirestore = {
      collection: () => ({
        doc: () => ({
          create: (snapshot: CaseSnapshot) => {
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
    const snapshot: CaseSnapshot = {
      caseId: "case_12345678",
      ownerId: "person_12345678",
      state: "DRAFT",
      version: 0,
      planVersion: 1,
      planHash: "sha256:plan"
    };

    await repository.create(snapshot);
    await expect(repository.get(snapshot.caseId)).resolves.toEqual(snapshot);
  });
});
