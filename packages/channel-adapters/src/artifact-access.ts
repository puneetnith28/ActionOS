import { createHmac, timingSafeEqual } from "node:crypto";

export interface ArtifactGrant {
  readonly artifactId: string;
  readonly caseId: string;
  readonly ownerId: string;
  readonly expiresAt: string;
}

function encoded(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function issueArtifactGrant(
  input: Omit<ArtifactGrant, "expiresAt"> & { now: string; ttlSeconds?: number },
  secret: string
): string {
  const ttlSeconds = input.ttlSeconds ?? 600;
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 600) {
    throw new Error("ARTIFACT_GRANT_TTL_INVALID");
  }
  const grant: ArtifactGrant = {
    artifactId: input.artifactId,
    caseId: input.caseId,
    ownerId: input.ownerId,
    expiresAt: new Date(Date.parse(input.now) + ttlSeconds * 1000).toISOString()
  };
  const payload = encoded(JSON.stringify(grant));
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyArtifactGrant(input: {
  token: string;
  secret: string;
  ownerId: string;
  caseId: string;
  artifactId: string;
  now: string;
}): ArtifactGrant {
  const [payload, suppliedSignature, extra] = input.token.split(".");
  if (!payload || !suppliedSignature || extra) throw new Error("ARTIFACT_GRANT_INVALID");
  const expected = signature(payload, input.secret);
  const suppliedBytes = Buffer.from(suppliedSignature);
  const expectedBytes = Buffer.from(expected);
  if (
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  ) {
    throw new Error("ARTIFACT_GRANT_INVALID");
  }
  const grant = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ArtifactGrant;
  if (
    grant.ownerId !== input.ownerId ||
    grant.caseId !== input.caseId ||
    grant.artifactId !== input.artifactId
  ) {
    throw new Error("ARTIFACT_GRANT_SCOPE_MISMATCH");
  }
  if (Date.parse(grant.expiresAt) <= Date.parse(input.now))
    throw new Error("ARTIFACT_GRANT_EXPIRED");
  return grant;
}
