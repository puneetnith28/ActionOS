import { FirestoreAnalysisStore } from "@actionos/persistence/analysis-store";
import { authenticatedOwner, assertSameOrigin } from "../../../../../lib/authz";
import { firestore } from "../../../../../lib/firebase-admin";
import { analysisScheduler } from "../../../../../lib/analysis-scheduler";
import { handleAnalysisRetry, handleAnalysisStatus } from "../../../../../lib/analysis-controller";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await context.params;
  return handleAnalysisStatus(request, missionId, {
    authenticate: authenticatedOwner,
    store: new FirestoreAnalysisStore(firestore)
  });
}

export async function POST(request: Request, context: { params: Promise<{ missionId: string }> }) {
  const tasks = analysisScheduler();
  if (!tasks) return Response.json({ error: "ANALYSIS_RUNTIME_NOT_CONFIGURED" }, { status: 503 });
  const { missionId } = await context.params;
  return handleAnalysisRetry(request, missionId, {
    authenticate: authenticatedOwner,
    assertOrigin: assertSameOrigin,
    store: new FirestoreAnalysisStore(firestore),
    schedule: (jobId, wakeAt) => tasks.scheduleAnalysis({ jobId, wakeAt }),
    now: () => new Date().toISOString()
  });
}
