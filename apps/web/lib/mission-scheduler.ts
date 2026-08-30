import { CloudTasksClient } from "@google-cloud/tasks";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import type { DurableWakeScheduler } from "@actionos/runtime/wake-outbox";
import { durableCaseScheduler } from "./durable-mission-scheduler";

export function missionScheduler(): DurableWakeScheduler | undefined {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const workerUrl = process.env.ACTIONOS_WORKER_URL;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT;
  if (!projectId || !workerUrl || !serviceAccountEmail) return undefined;
  return durableCaseScheduler(new TaskScheduler(new CloudTasksClient(), {
    projectId,
    location: process.env.CLOUD_TASKS_LOCATION ?? "us-central1",
    queue: process.env.CLOUD_TASKS_QUEUE ?? "actionos-missions",
    workerUrl,
    serviceAccountEmail,
    ...(process.env.ACTIONOS_TASKS_OIDC_AUDIENCE
      ? { oidcAudience: process.env.ACTIONOS_TASKS_OIDC_AUDIENCE }
      : {})
  }));
}
