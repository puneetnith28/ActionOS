import type { FirestoreAnalysisStore } from "@dueback/persistence/analysis-store";
import type { IntakeService } from "@dueback/runtime/intake-service";
import type { PrivateArtifactStorage } from "./artifact-storage";
import {
  requireCloudTaskIdentity,
  type CloudTaskIdentityVerifier
} from "./cloud-task-identity";

export interface AnalysisWorkerDependencies {
  store: Pick<FirestoreAnalysisStore, "start" | "markReady" | "markAttemptFailed">;
  storage: Pick<PrivateArtifactStorage, "read" | "delete">;
  service(jobId: string): IntakeService;
  now(): string;
  identityVerifier?: CloudTaskIdentityVerifier;
}

export async function handleAnalysisWorker(
  request: Request,
  dependencies: AnalysisWorkerDependencies
): Promise<Response> {
  const unauthorized = await requireCloudTaskIdentity(request, dependencies.identityVerifier);
  if (unauthorized) return unauthorized;
  let jobId: string | undefined;
  try {
    const body = await request.json() as { jobId?: string };
    jobId = body.jobId;
    if (!jobId?.startsWith("analysis_")) {
      return Response.json({ error: "ANALYSIS_TASK_INVALID" }, { status: 400 });
    }
    const started = await dependencies.store.start(jobId, dependencies.now());
    if (started.status === "BUSY") {
      // Do not acknowledge a retry while an earlier lease is alive: the
      // original worker may have died, and Cloud Tasks must retry after the
      // lease expires instead of losing the job permanently.
      return Response.json({ status: "BUSY" }, { status: 503 });
    }
    if (started.status !== "STARTED") {
      return Response.json({ status: started.status });
    }
    const job = started.job;
    const bytes = await dependencies.storage.read(job.artifactPath);
    const content = job.mediaType === "text/plain"
      ? new TextDecoder().decode(bytes)
      : {
          dataUrl: `data:${job.mediaType};base64,${Buffer.from(bytes).toString("base64")}`,
          contentType: job.mediaType,
          ...(job.contextText ? { contextText: job.contextText } : {})
        };
    const result = await dependencies.service(jobId).intake({
      caseId: job.caseId,
      artifactId: job.artifactId,
      ownerId: job.ownerId,
      sourceChannel: job.sourceChannel,
      sha256: job.sha256,
      content
    }, job.createdAt);
    await dependencies.store.markReady(jobId, dependencies.now());
    await dependencies.storage.delete(job.artifactPath).catch(() => undefined);
    return Response.json({ status: "READY", caseId: result.draft.caseId, duplicate: result.duplicate });
  } catch (error) {
    const reason = error instanceof Error && /^[A-Z0-9_:,-]{1,120}$/.test(error.message)
      ? error.message
      : "ANALYSIS_FAILED";
    if (!jobId) return Response.json({ error: reason }, { status: 500 });
    const failed = await dependencies.store.markAttemptFailed(jobId, reason, dependencies.now());
    return Response.json(
      { error: failed.status === "FAILED" ? "ANALYSIS_RETRY_EXHAUSTED" : "ANALYSIS_RETRY_SCHEDULED" },
      { status: failed.status === "FAILED" ? 200 : 500 }
    );
  }
}
