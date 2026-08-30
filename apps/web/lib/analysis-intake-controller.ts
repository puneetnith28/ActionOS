import { randomUUID } from "node:crypto";
import { analysisJobSchema } from "@dueback/contracts";
import { acceptUpload } from "@dueback/channel-adapters/upload";
import { stableHash } from "@dueback/domain";
import type { FirestoreAnalysisStore } from "@dueback/persistence/analysis-store";
import type { PrivateArtifactStorage } from "./artifact-storage";
import { redactedPublicError } from "./security-limits";

export interface AnalysisIntakeDependencies {
  authenticate(request: Request): Promise<{ uid: string }>;
  store: Pick<FirestoreAnalysisStore, "createOrGet" | "markTerminalFailure">;
  storage: Pick<PrivateArtifactStorage, "save">;
  consumeBudget(ownerId: string, now: string): Promise<void>;
  schedule(jobId: string, wakeAt: string): Promise<unknown>;
  now(): string;
}

export async function handleAnalysisIntake(
  request: Request,
  dependencies: AnalysisIntakeDependencies
): Promise<Response> {
  try {
    const owner = await dependencies.authenticate(request);
    const form = await request.formData();
    const text = form.get("text");
    const file = form.get("file");
    const receivedAt = dependencies.now();
    const contextText = typeof text === "string" ? text.trim() : "";
    const hasFile = file instanceof File && file.size > 0;
    const input = hasFile
      ? {
          declaredMediaType: file.type,
          bytes: new Uint8Array(await file.arrayBuffer()),
          receivedAt
        }
      : contextText
        ? {
            declaredMediaType: "text/plain",
            bytes: new TextEncoder().encode(contextText),
            receivedAt
          }
        : undefined;
    if (!input) return Response.json({ error: "PROMISE_SOURCE_REQUIRED" }, { status: 400 });
    const accepted = acceptUpload(input);
    const sourceIdentity = contextText && hasFile
      ? stableHash({ file: accepted.sha256, contextText })
      : `sha256:${accepted.sha256}`;
    const artifactId = contextText && hasFile
      ? `artifact_${sourceIdentity.slice(7, 31)}`
      : accepted.artifactId;
    const ownerPath = stableHash({ namespace: "dueback/artifact-owner/v1", ownerId: owner.uid })
      .slice(7, 31);
    const artifactPath = `analysis/${ownerPath}/${sourceIdentity.slice(7)}`;
    const job = analysisJobSchema.parse({
      jobId: `analysis_${randomUUID()}`,
      caseId: `case_${randomUUID()}`,
      ownerId: owner.uid,
      artifactId,
      artifactPath,
      sourceChannel: hasFile ? "upload" : "paste",
      mediaType: accepted.mediaType,
      sha256: sourceIdentity,
      ...(contextText && hasFile ? { contextText } : {}),
      status: "QUEUED",
      stage: "EVIDENCE_SECURED",
      attemptCount: 0,
      createdAt: receivedAt,
      updatedAt: receivedAt
    });
    const persisted = await dependencies.store.createOrGet(job);
    if (!persisted.duplicate) {
      try {
        await dependencies.consumeBudget(owner.uid, receivedAt);
      } catch (error) {
        await dependencies.store.markTerminalFailure(
          persisted.job.jobId,
          error instanceof Error ? error.message : "CASE_BUDGET_EXHAUSTED",
          receivedAt
        );
        throw error;
      }
    }
    if (persisted.job.status !== "READY") {
      await dependencies.storage.save({
        path: persisted.job.artifactPath,
        contentType: accepted.mediaType,
        bytes: accepted.sanitizedBytes
      });
    }
    if (persisted.job.status !== "READY") {
      await dependencies.schedule(persisted.job.jobId, receivedAt);
    }
    return Response.json({
      caseId: persisted.job.caseId,
      status: persisted.job.status,
      duplicate: persisted.duplicate
    }, { status: persisted.job.status === "READY" || persisted.duplicate ? 200 : 202 });
  } catch (cause) {
    const error = redactedPublicError(cause);
    const candidateStatus = "status" in Object(cause)
      ? (cause as { status?: unknown }).status
      : undefined;
    const status = typeof candidateStatus === "number" && candidateStatus >= 400 && candidateStatus <= 599
      ? candidateStatus
      : 422;
    return Response.json({ error }, { status });
  }
}
