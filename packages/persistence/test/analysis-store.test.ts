import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { parseAnalysisDocument } from "../src/analysis-store";

describe("analysis persistence projection", () => {
  it("removes Firestore TTL metadata before strict contract validation", () => {
    expect(parseAnalysisDocument({
      jobId: "analysis_persisted123",
      caseId: "case_persisted123",
      ownerId: "owner_persisted123",
      artifactId: "artifact_persisted123",
      artifactPath: "analysis/owner/source",
      sourceChannel: "paste",
      mediaType: "text/plain",
      sha256: "sha256:" + "d".repeat(64),
      status: "QUEUED",
      stage: "EVIDENCE_SECURED",
      attemptCount: 0,
      createdAt: "2026-08-18T12:00:00.000Z",
      updatedAt: "2026-08-18T12:00:00.000Z",
      deleteAt: Timestamp.fromDate(new Date("2026-08-19T12:00:00.000Z"))
    })).not.toHaveProperty("deleteAt");
  });
});
