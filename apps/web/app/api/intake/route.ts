import { FirestoreAnalysisStore } from "@actionos/persistence/analysis-store";
import { authenticatedOwner, assertSameOrigin } from "../../../lib/authz";
import { firestore, artifactBucket } from "../../../lib/firebase-admin";
import { consumeNewMissionBudget } from "../../../lib/security-limits";
import { PrivateArtifactStorage } from "../../../lib/artifact-storage";
import { handleAnalysisIntake } from "../../../lib/analysis-intake-controller";
import { analysisScheduler } from "../../../lib/analysis-scheduler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  assertSameOrigin(request);
  const tasks = analysisScheduler();
  if (!tasks) return Response.json({ error: "ANALYSIS_RUNTIME_NOT_CONFIGURED" }, { status: 503 });
  return handleAnalysisIntake(request, {
    authenticate: authenticatedOwner,
    store: new FirestoreAnalysisStore(firestore),
    storage: new PrivateArtifactStorage(artifactBucket()),
    consumeBudget: (ownerId, now) => consumeNewMissionBudget(firestore, ownerId, now),
    schedule: (jobId, wakeAt) => tasks.scheduleAnalysis({ jobId, wakeAt }),
    now: () => new Date().toISOString()
  });
}
