import { createHash } from "node:crypto";

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stable(record[key])}`)
    .join(",")}}`;
}

export function stableHash(value: unknown): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(stable(value)).digest("hex")}`;
}

export function capabilityIdempotencyKey(input: {
  readonly missionId: string;
  readonly planVersion: number;
  readonly actionType: string;
  readonly ordinal: number;
}): `sha256:${string}` {
  return stableHash({ namespace: "dueback/capability/v1", ...input });
}

export function eventDedupeKey(input: {
  readonly source: string;
  readonly externalId: string;
  readonly missionId: string;
}): `sha256:${string}` {
  return stableHash({ namespace: "dueback/event/v1", ...input });
}

export function missionDedupeKey(input: {
  readonly ownerId: string;
  readonly sourceChannel: string;
  readonly sourceIdentity: string;
}): `sha256:${string}` {
  return stableHash({ namespace: "dueback/case/v1", ...input });
}

export function artifactDedupeKey(input: {
  readonly ownerId: string;
  readonly contentSha256: string;
}): `sha256:${string}` {
  return stableHash({ namespace: "dueback/artifact/v1", ...input });
}

export function callbackDedupeKey(input: {
  readonly issuer: string;
  readonly nonce: string;
  readonly missionId: string;
}): `sha256:${string}` {
  return stableHash({ namespace: "dueback/callback/v1", ...input });
}
