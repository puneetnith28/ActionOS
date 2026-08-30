import type { FirestoreAnalysisStore } from "@actionos/persistence/analysis-store";

export async function handleAnalysisStatus(
  request: Request,
  missionId: string,
  dependencies: {
    authenticate(request: Request): Promise<{ uid: string }>;
    store: Pick<FirestoreAnalysisStore, "getOwnedCase">;
  }
): Promise<Response> {
  const privateHeaders = { "Cache-Control": "private, no-store" };
  try {
    const owner = await dependencies.authenticate(request);
    const job = await dependencies.store.getOwnedCase(missionId, owner.uid);
    if (!job) return Response.json({ error: "MISSION_NOT_FOUND" }, { status: 404, headers: privateHeaders });
    return Response.json({
      missionId: job.missionId,
      status: job.status,
      stage: job.stage,
      attemptCount: job.attemptCount,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      ...(job.status === "FAILED" ? { error: job.lastError ?? "ANALYSIS_FAILED" } : {})
    }, { headers: privateHeaders });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ANALYSIS_STATUS_FAILED";
    const authenticationError = ["AUTHENTICATION_REQUIRED", "INVALID_ID_TOKEN"].includes(code);
    return Response.json(
      { error: authenticationError ? code : "ANALYSIS_STATUS_FAILED" },
      { status: authenticationError ? 401 : 500, headers: privateHeaders }
    );
  }
}

export async function handleAnalysisRetry(
  request: Request,
  missionId: string,
  dependencies: {
    authenticate(request: Request): Promise<{ uid: string }>;
    assertOrigin(request: Request): void;
    store: Pick<FirestoreAnalysisStore, "retryOwned">;
    schedule(jobId: string, wakeAt: string): Promise<unknown>;
    now(): string;
  }
): Promise<Response> {
  const privateHeaders = { "Cache-Control": "private, no-store" };
  try {
    dependencies.assertOrigin(request);
    const owner = await dependencies.authenticate(request);
    const now = dependencies.now();
    const job = await dependencies.store.retryOwned(missionId, owner.uid, now);
    if (job.status === "QUEUED") await dependencies.schedule(job.jobId, now);
    return Response.json({ status: job.status, stage: job.stage }, { headers: privateHeaders });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ANALYSIS_RETRY_FAILED";
    const authenticationError = ["AUTHENTICATION_REQUIRED", "INVALID_ID_TOKEN"].includes(code);
    const notFound = code === "ANALYSIS_JOB_NOT_FOUND";
    return Response.json(
      { error: authenticationError ? code : notFound ? "MISSION_NOT_FOUND" : "ANALYSIS_RETRY_FAILED" },
      { status: authenticationError ? 401 : notFound ? 404 : 500, headers: privateHeaders }
    );
  }
}
