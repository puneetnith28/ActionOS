import type { MissionRunner } from "@actionos/runtime/mission-runner";
import {
  requireCloudTaskIdentity,
  type CloudTaskIdentityVerifier
} from "./cloud-task-identity";

export async function handleRunCaseTask(
  request: Request,
  runner: MissionRunner,
  now: () => string,
  identityVerifier?: CloudTaskIdentityVerifier
): Promise<Response> {
  const unauthorized = await requireCloudTaskIdentity(request, identityVerifier);
  if (unauthorized) return unauthorized;
  try {
    const body = (await request.json()) as {
      missionId?: string;
      expectedVersion?: number;
      correlationId?: string;
    };
    const expectedVersion = body.expectedVersion;
    if (!body.missionId || typeof expectedVersion !== "number" || !Number.isInteger(expectedVersion))
      return Response.json({ error: "INVALID_TASK" }, { status: 400 });
    const result = await runner.run({
        missionId: body.missionId,
        expectedVersion,
        now: now(),
        ...(body.correlationId ? { correlationId: body.correlationId } : {})
      });
    // A sub-second Cloud Tasks clock boundary or clock skew must never consume
    // the only durable wake. A retryable response preserves the same task until
    // the approved wake time has actually arrived.
    return Response.json(result, { status: result.status === "NOT_DUE" ? 503 : 200 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "TASK_FAILED" },
      { status: 500 }
    );
  }
}
