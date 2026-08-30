import { CloudTasksClient } from "@google-cloud/tasks";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { DurableWakeScheduler } from "@actionos/runtime/wake-outbox";
import { FirestoreWakeOutboxStore } from "@actionos/persistence/wake-outbox-store";
import { requireCloudTaskIdentity } from "../../../../../lib/cloud-task-identity";
import { firestore } from "../../../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireCloudTaskIdentity(request);
  if (unauthorized) return unauthorized;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const workerUrl = process.env.ACTIONOS_WORKER_URL;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT;
  if (!projectId || !workerUrl || !serviceAccountEmail) {
    return Response.json({ error: "RUNTIME_NOT_CONFIGURED" }, { status: 503 });
  }
  const outbox = new FirestoreWakeOutboxStore(firestore);
  const tasks = new TaskScheduler(new CloudTasksClient(), {
    projectId,
    location: process.env.CLOUD_TASKS_LOCATION ?? "us-central1",
    queue: process.env.CLOUD_TASKS_QUEUE ?? "actionos-missions",
    workerUrl,
    serviceAccountEmail,
    ...(process.env.ACTIONOS_TASKS_OIDC_AUDIENCE
      ? { oidcAudience: process.env.ACTIONOS_TASKS_OIDC_AUDIENCE }
      : {})
  });
  const result = await new DurableWakeScheduler(tasks, outbox, () => new Date().toISOString())
    .verifyOutcome(25);
  return Response.json(result, { status: result.failed > 0 ? 503 : 200 });
}
