import { describe, expect, it } from "vitest";
import {
  capabilityIdempotencyKey,
  artifactDedupeKey,
  callbackDedupeKey,
  missionDedupeKey,
  eventDedupeKey,
  stableHash
} from "../src/identity";

describe("stable identities", () => {
  it("hashes objects independently of key order", () => {
    expect(stableHash({ b: 2, a: 1 })).toBe(stableHash({ a: 1, b: 2 }));
  });

  it("keeps retries on one logical action key", () => {
    const input = { missionId: "mission_1", planVersion: 1, actionType: "SEND_FOLLOW_UP", ordinal: 1 };
    expect(capabilityIdempotencyKey(input)).toBe(capabilityIdempotencyKey(input));
  });

  it("separates external events by source identity", () => {
    expect(eventDedupeKey({ source: "merchant", externalId: "1", missionId: "mission_1" })).not.toBe(
      eventDedupeKey({ source: "merchant", externalId: "2", missionId: "mission_1" })
    );
  });

  it("namespaces case, artifact, and callback identities", () => {
    const caseKey = missionDedupeKey({
      ownerId: "person_1",
      sourceChannel: "upload",
      sourceIdentity: "source_1"
    });
    const artifactKey = artifactDedupeKey({
      ownerId: "person_1",
      contentSha256: "abc"
    });
    const callbackKey = callbackDedupeKey({
      issuer: "merchant",
      nonce: "nonce_1",
      missionId: "mission_1"
    });
    expect(new Set([caseKey, artifactKey, callbackKey])).toHaveLength(3);
  });
});
