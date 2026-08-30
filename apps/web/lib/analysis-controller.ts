import type { FirestoreAnalysisStore } from "@dueback/persistence/analysis-store";

export async function handleAnalysisStatus(
  request: Request,
  caseId: string,
  dependencies: {
    authenticate(request: Request): Promise<{ uid: string }>;
    store: Pick<FirestoreAnalysisStore, "getOwnedCase">;
  }
): Promise<Response> {
  const privateHeaders = { "Cache-Control": "private, no-store" };
  try {
    const owner = await dependencies.authenticate(request);
    const job = await dependencies.store.getOwnedCase(caseId, owner.uid);
    if (!job) return Response.json({ error: "CASE_NOT_FOUND" }, { status: 404, headers: privateHeaders });
    return Response.json({
      caseId: job.caseId,
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
  caseId: string,
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
    const job = await dependencies.store.retryOwned(caseId, owner.uid, now);
    if (job.status === "QUEUED") await dependencies.schedule(job.jobId, now);
    return Response.json({ status: job.status, stage: job.stage }, { headers: privateHeaders });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ANALYSIS_RETRY_FAILED";
    const authenticationError = ["AUTHENTICATION_REQUIRED", "INVALID_ID_TOKEN"].includes(code);
    const notFound = code === "ANALYSIS_JOB_NOT_FOUND";
    return Response.json(
      { error: authenticationError ? code : notFound ? "CASE_NOT_FOUND" : "ANALYSIS_RETRY_FAILED" },
      { status: authenticationError ? 401 : notFound ? 404 : 500, headers: privateHeaders }
    );
  }
}
