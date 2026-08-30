import { OAuth2Client } from "google-auth-library";

export interface CloudTaskIdentity {
  readonly taskName: string;
  readonly serviceAccountEmail: string;
}

export type CloudTaskIdentityVerifier = (request: Request) => Promise<CloudTaskIdentity>;

const googleOidc = new OAuth2Client();

export function assertExpectedCloudTaskClaims(
  payload: { email?: string; email_verified?: boolean } | undefined,
  expectedEmail: string
): string {
  const email = payload?.email?.toLowerCase();
  if (!payload || email !== expectedEmail.toLowerCase() || payload.email_verified !== true) {
    throw new Error("CLOUD_TASK_IDENTITY_INVALID");
  }
  return email;
}

export async function verifyCloudTaskIdentity(request: Request): Promise<CloudTaskIdentity> {
  const taskName = (
    request.headers.get("x-cloudtasks-taskname") ??
    request.headers.get("x-cloudscheduler-jobname")
  )?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.match(/^Bearer ([A-Za-z0-9._~-]+)$/)?.[1];
  const audience = process.env.DUEBACK_TASKS_OIDC_AUDIENCE?.trim();
  const expectedEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT?.trim().toLowerCase();

  if (!taskName || !token || !audience || !expectedEmail) {
    throw new Error("CLOUD_TASK_IDENTITY_REQUIRED");
  }

  const ticket = await googleOidc.verifyIdToken({ idToken: token, audience });
  const payload = ticket.getPayload();
  const email = assertExpectedCloudTaskClaims(payload, expectedEmail);

  return { taskName, serviceAccountEmail: email };
}

export async function requireCloudTaskIdentity(
  request: Request,
  verifier: CloudTaskIdentityVerifier = verifyCloudTaskIdentity
): Promise<Response | undefined> {
  try {
    await verifier(request);
    return undefined;
  } catch {
    return Response.json({ error: "CLOUD_TASK_IDENTITY_REQUIRED" }, { status: 401 });
  }
}
