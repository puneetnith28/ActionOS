import { CloudTasksClient } from "@google-cloud/tasks";
import { FirestoreCaseControlStore } from "@dueback/persistence/retention";
import { CaseControlService } from "@dueback/runtime/case-control";
import { TaskScheduler } from "@dueback/runtime/task-scheduler";
import { authenticatedOwner, assertSameOrigin } from "../../../../../lib/authz";
import { handleCaseControl } from "../../../../../lib/control-controller";
import { firestore } from "../../../../../lib/firebase-admin";
import { durableCaseScheduler } from "../../../../../lib/durable-case-scheduler";

export const runtime = "nodejs";
type Context = { params: Promise<{ caseId: string }> };

function controlService() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const workerUrl = process.env.DUEBACK_WORKER_URL;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT;
  const scheduler =
    projectId && workerUrl && serviceAccountEmail
      ? durableCaseScheduler(new TaskScheduler(new CloudTasksClient(), {
          projectId,
          location: process.env.CLOUD_TASKS_LOCATION ?? "us-central1",
          queue: process.env.CLOUD_TASKS_QUEUE ?? "dueback-cases",
          workerUrl,
          serviceAccountEmail,
          ...(process.env.DUEBACK_TASKS_OIDC_AUDIENCE
            ? { oidcAudience: process.env.DUEBACK_TASKS_OIDC_AUDIENCE }
            : {})
        }))
      : undefined;
  return new CaseControlService(new FirestoreCaseControlStore(firestore), scheduler);
}

export async function POST(request: Request, context: Context) {
  assertSameOrigin(request);
  const { caseId } = await context.params;
  return handleCaseControl(request, caseId, {
    authenticate: authenticatedOwner,
    service: controlService(),
    now: () => new Date().toISOString()
  });
}
