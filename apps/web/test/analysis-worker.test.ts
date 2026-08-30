import { describe, expect, it, vi } from "vitest";
import type { AnalysisJob } from "@dueback/contracts";
import { handleAnalysisWorker } from "../lib/analysis-worker";

const job: AnalysisJob = {
  jobId: "analysis_worker123",
  caseId: "case_worker123",
  ownerId: "owner_worker123",
  artifactId: "artifact_worker123",
  artifactPath: "analysis/owner/source",
  sourceChannel: "paste",
  mediaType: "text/plain",
  sha256: "sha256:" + "b".repeat(64),
  status: "ANALYZING",
  stage: "GEMINI_EXTRACTION",
  attemptCount: 1,
  createdAt: "2026-08-18T12:00:00.000Z",
  updatedAt: "2026-08-18T12:00:01.000Z"
};

const verified = vi.fn().mockResolvedValue({
  taskName: "analysis-task",
  serviceAccountEmail: "dueback-tasks@example.test"
});

function taskRequest() {
  return new Request("https://dueback.test/internal", {
    method: "POST",
    headers: { "x-cloudtasks-taskname": "analysis-task" },
    body: JSON.stringify({ jobId: job.jobId })
  });
}

describe("analysis worker", () => {
  it("requires Cloud Tasks identity", async () => {
    const response = await handleAnalysisWorker(new Request("https://dueback.test/internal"), {
      identityVerifier: vi.fn().mockRejectedValue(new Error("missing identity"))
    } as never);
    expect(response.status).toBe(401);
  });

  it("does not acknowledge a live lease so a crashed delivery can recover", async () => {
    const markAttemptFailed = vi.fn().mockResolvedValue({ ...job, status: "QUEUED" });
    const response = await handleAnalysisWorker(taskRequest(), {
      store: {
        start: () => Promise.resolve({ status: "BUSY" as const, job }),
        markReady: vi.fn(),
        markAttemptFailed
      },
      storage: { read: vi.fn(), delete: vi.fn() },
      service: vi.fn(),
      now: () => "2026-08-18T12:00:02.000Z",
      identityVerifier: verified
    });
    expect(response.status).toBe(503);
  });

  it("creates the review and deletes the raw artifact after success", async () => {
    const markReady = vi.fn();
    const remove = vi.fn().mockResolvedValue(undefined);
    const markAttemptFailed = vi.fn().mockResolvedValue({ ...job, status: "QUEUED" });
    const intake = vi.fn().mockResolvedValue({ draft: { caseId: job.caseId }, duplicate: false });
    const response = await handleAnalysisWorker(taskRequest(), {
      store: {
        start: () => Promise.resolve({ status: "STARTED" as const, job }),
        markReady,
        markAttemptFailed
      },
      storage: {
        read: () => Promise.resolve(new TextEncoder().encode("A bounded company promise")),
        delete: remove
      },
      service: () => ({ intake } as never),
      now: () => "2026-08-18T12:00:02.000Z",
      identityVerifier: verified
    });
    expect(response.status).toBe(200);
    expect(markAttemptFailed).not.toHaveBeenCalled();
    expect(intake).toHaveBeenCalledWith(expect.objectContaining({ caseId: job.caseId }), job.createdAt);
    expect(markReady).toHaveBeenCalledWith(job.jobId, "2026-08-18T12:00:02.000Z");
    expect(remove).toHaveBeenCalledWith(job.artifactPath);
  });
});
