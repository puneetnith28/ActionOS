import { CloudTasksClient } from "@google-cloud/tasks";
import { config } from "../../../../../lib/config";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { DurableWakeScheduler } from "@actionos/runtime/wake-outbox";
import { FirestoreWakeOutboxStore } from "@actionos/persistence/wake-outbox-store";
import { requireCloudTaskIdentity } from "../../../../../lib/cloud-task-identity";
import { firestore } from "../../../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireCloudTaskIdentity(request);
  if (unauthorized) return unauthorized;
  const projectId = config.projectId;
  const workerUrl = config.tasks.workerUrl;
  const serviceAccountEmail = config.tasks.serviceAccount;
  const outbox = new FirestoreWakeOutboxStore(firestore);
  const tasks = new TaskScheduler(new CloudTasksClient(), {
    projectId,
    location: config.tasks.location,
    queue: config.tasks.queue,
    workerUrl,
    serviceAccountEmail,
    ...(config.tasks.oidcAudience
      ? { oidcAudience: config.tasks.oidcAudience }
      : {})
  });
  const result = await new DurableWakeScheduler(tasks, outbox, () => new Date().toISOString())
    .verifyOutcome(25);
  return Response.json(result, { status: result.failed > 0 ? 503 : 200 });
}
