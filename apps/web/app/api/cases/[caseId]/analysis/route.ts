import { FirestoreAnalysisStore } from "@dueback/persistence/analysis-store";
import { authenticatedOwner, assertSameOrigin } from "../../../../../lib/authz";
import { firestore } from "../../../../../lib/firebase-admin";
import { analysisScheduler } from "../../../../../lib/analysis-scheduler";
import { handleAnalysisRetry, handleAnalysisStatus } from "../../../../../lib/analysis-controller";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;
  return handleAnalysisStatus(request, caseId, {
    authenticate: authenticatedOwner,
    store: new FirestoreAnalysisStore(firestore)
  });
}

export async function POST(request: Request, context: { params: Promise<{ caseId: string }> }) {
  const tasks = analysisScheduler();
  if (!tasks) return Response.json({ error: "ANALYSIS_RUNTIME_NOT_CONFIGURED" }, { status: 503 });
  const { caseId } = await context.params;
  return handleAnalysisRetry(request, caseId, {
    authenticate: authenticatedOwner,
    assertOrigin: assertSameOrigin,
    store: new FirestoreAnalysisStore(firestore),
    schedule: (jobId, wakeAt) => tasks.scheduleAnalysis({ jobId, wakeAt }),
    now: () => new Date().toISOString()
  });
}
