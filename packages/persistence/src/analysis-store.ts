import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { analysisJobSchema, type AnalysisJob } from "@actionos/contracts";
import { stableHash } from "@actionos/domain";
import { firestoreDeleteAt } from "./expiry";

export type AnalysisStartResult =
  | { status: "STARTED"; job: AnalysisJob }
  | { status: "BUSY" | "READY" | "FAILED"; job: AnalysisJob };

export function parseAnalysisDocument(data: FirebaseFirestore.DocumentData | undefined): AnalysisJob {
  if (!data) throw new Error("ANALYSIS_JOB_NOT_FOUND");
  // `deleteAt` is Firestore-only TTL metadata and deliberately not part of the
  // domain contract exposed to workers or owners.
  const { deleteAt: _deleteAt, ...job } = data;
  void _deleteAt;
  return analysisJobSchema.parse(job);
}

export class FirestoreAnalysisStore {
  constructor(private readonly db: Firestore) {}

  async createOrGet(job: AnalysisJob): Promise<{ job: AnalysisJob; duplicate: boolean }> {
    const jobRef = this.db.collection("analysisJobs").doc(job.jobId);
    const dedupeRef = this.db.collection("analysisDedupe").doc(stableHash({
      namespace: "actionos/analysis-dedupe/v1",
      ownerId: job.ownerId,
      sha256: job.sha256
    }).slice(7));
    return this.db.runTransaction(async (transaction) => {
      const dedupe = await transaction.get(dedupeRef);
      if (dedupe.exists && dedupe.get("ownerId") === job.ownerId) {
        const existingRef = this.db.collection("analysisJobs").doc(String(dedupe.get("jobId")));
        const existing = await transaction.get(existingRef);
        if (existing.exists) {
          return { job: parseAnalysisDocument(existing.data()), duplicate: true };
        }
      }
      const deleteAt = firestoreDeleteAt(
        new Date(Date.parse(job.createdAt) + 24 * 60 * 60 * 1000).toISOString()
      );
      transaction.create(jobRef, { ...job, deleteAt });
      transaction.set(dedupeRef, {
        ownerId: job.ownerId,
        jobId: job.jobId,
        missionId: job.missionId,
        createdAt: job.createdAt,
        deleteAt
      });
      return { job, duplicate: false };
    });
  }

  async get(jobId: string): Promise<AnalysisJob | undefined> {
    const snapshot = await this.db.collection("analysisJobs").doc(jobId).get();
    return snapshot.exists ? parseAnalysisDocument(snapshot.data()) : undefined;
  }

  async getOwnedCase(missionId: string, ownerId: string): Promise<AnalysisJob | undefined> {
    const snapshot = await this.db.collection("analysisJobs")
      .where("missionId", "==", missionId)
      .limit(1)
      .get();
    const document = snapshot.docs[0];
    if (!document) return undefined;
    const job = parseAnalysisDocument(document.data());
    return job.ownerId === ownerId ? job : undefined;
  }

  async listByOwner(ownerId: string, limit: number): Promise<readonly AnalysisJob[]> {
    const snapshot = await this.db.collection("analysisJobs")
      .where("ownerId", "==", ownerId)
      .limit(Math.min(Math.max(limit, 1), 50))
      .get();
    return snapshot.docs.map((document) => parseAnalysisDocument(document.data()));
  }

  async start(jobId: string, now: string): Promise<AnalysisStartResult> {
    const reference = this.db.collection("analysisJobs").doc(jobId);
    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("ANALYSIS_JOB_NOT_FOUND");
      const current = parseAnalysisDocument(snapshot.data());
      if (current.status === "READY") return { status: "READY", job: current };
      if (current.status === "FAILED") return { status: "FAILED", job: current };
      if (
        current.status === "ANALYZING" &&
        current.leaseUntil &&
        Date.parse(current.leaseUntil) > Date.parse(now)
      ) {
        return { status: "BUSY", job: current };
      }
      if (current.attemptCount >= 3) {
        const failed = analysisJobSchema.parse({
          ...current,
          status: "FAILED",
          stage: "FAILED",
          updatedAt: now,
          lastError: "ANALYSIS_RETRY_EXHAUSTED"
        });
        transaction.set(reference, { ...failed, leaseUntil: FieldValue.delete() }, { merge: true });
        return { status: "FAILED", job: failed };
      }
      const next = analysisJobSchema.parse({
        ...current,
        status: "ANALYZING",
        stage: "GEMINI_EXTRACTION",
        attemptCount: current.attemptCount + 1,
        updatedAt: now,
        leaseUntil: new Date(Date.parse(now) + 90_000).toISOString(),
        lastError: undefined
      });
      transaction.set(reference, { ...next, lastError: FieldValue.delete() }, { merge: true });
      return { status: "STARTED", job: next };
    });
  }

  async markValidating(jobId: string, now: string): Promise<void> {
    await this.db.collection("analysisJobs").doc(jobId).set({
      stage: "VALIDATING",
      updatedAt: now
    }, { merge: true });
  }

  async markReady(jobId: string, now: string): Promise<void> {
    await this.db.collection("analysisJobs").doc(jobId).set({
      status: "READY",
      stage: "REVIEW_READY",
      updatedAt: now,
      leaseUntil: FieldValue.delete(),
      lastError: FieldValue.delete()
    }, { merge: true });
  }

  async markAttemptFailed(jobId: string, reason: string, now: string): Promise<AnalysisJob> {
    const reference = this.db.collection("analysisJobs").doc(jobId);
    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error("ANALYSIS_JOB_NOT_FOUND");
      const current = parseAnalysisDocument(snapshot.data());
      const terminal = current.attemptCount >= 3;
      const next = analysisJobSchema.parse({
        ...current,
        status: terminal ? "FAILED" : "QUEUED",
        stage: terminal ? "FAILED" : "EVIDENCE_SECURED",
        updatedAt: now,
        lastError: reason.slice(0, 120),
        leaseUntil: undefined
      });
      transaction.set(reference, { ...next, leaseUntil: FieldValue.delete() }, { merge: true });
      return next;
    });
  }

  async markTerminalFailure(jobId: string, reason: string, now: string): Promise<void> {
    await this.db.collection("analysisJobs").doc(jobId).set({
      status: "FAILED",
      stage: "FAILED",
      updatedAt: now,
      lastError: reason.slice(0, 120),
      leaseUntil: FieldValue.delete()
    }, { merge: true });
  }

  async retryOwned(missionId: string, ownerId: string, now: string): Promise<AnalysisJob> {
    const existing = await this.getOwnedCase(missionId, ownerId);
    if (!existing) throw new Error("ANALYSIS_JOB_NOT_FOUND");
    if (existing.status !== "FAILED") return existing;
    const next = analysisJobSchema.parse({
      ...existing,
      status: "QUEUED",
      stage: "EVIDENCE_SECURED",
      attemptCount: 0,
      updatedAt: now,
      leaseUntil: undefined,
      lastError: undefined
    });
    await this.db.collection("analysisJobs").doc(existing.jobId).set({
      ...next,
      leaseUntil: FieldValue.delete(),
      lastError: FieldValue.delete()
    }, { merge: true });
    return next;
  }
}
