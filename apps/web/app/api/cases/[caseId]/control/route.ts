import { CloudTasksClient } from "@google-cloud/tasks";
import { FirestoreCaseControlStore } from "@actionos/persistence/retention";
import { CaseControlService } from "@actionos/runtime/case-control";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { authenticatedOwner, assertSameOrigin } from "../../../../../lib/authz";
import { handleCaseControl } from "../../../../../lib/control-controller";
import { firestore } from "../../../../../lib/firebase-admin";
import { durableCaseScheduler } from "../../../../../lib/durable-case-scheduler";

export const runtime = "nodejs";
type Context = { params: Promise<{ missionId: string }> };

function controlService() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const workerUrl = process.env.DUEBACK_WORKER_URL;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT;
  const scheduler =
    projectId && workerUrl && serviceAccountEmail
      ? durableCaseScheduler(new TaskScheduler(new CloudTasksClient(), {
          projectId,
          location: process.env.CLOUD_TASKS_LOCATION ?? "us-central1",
          queue: process.env.CLOUD_TASKS_QUEUE ?? "actionos-cases",
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
  const { missionId } = await context.params;
  return handleCaseControl(request, missionId, {
    authenticate: authenticatedOwner,
    service: controlService(),
    now: () => new Date().toISOString()
  });
}
