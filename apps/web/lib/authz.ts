import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase-admin";

export class AuthorizationError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403
  ) {
    super(message);
  }
}

export async function authenticatedOwner(request: Request): Promise<DecodedIdToken> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new AuthorizationError("AUTHENTICATION_REQUIRED", 401);
  }
  try {
    return await adminAuth.verifyIdToken(authorization.slice(7), true);
  } catch {
    throw new AuthorizationError("INVALID_ID_TOKEN", 401);
  }
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_BASE_URL;
  if (origin && expected && origin !== expected) {
    throw new AuthorizationError("CROSS_ORIGIN_MUTATION_DENIED", 403);
  }
}

export function assertOwner(ownerUid: string, caseOwnerUid: string): void {
  if (ownerUid !== caseOwnerUid) throw new AuthorizationError("CASE_OWNERSHIP_REQUIRED", 403);
}
