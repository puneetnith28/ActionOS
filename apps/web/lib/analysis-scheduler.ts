import { CloudTasksClient } from "@google-cloud/tasks";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";

export function analysisScheduler(): TaskScheduler | undefined {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const workerUrl = process.env.DUEBACK_WORKER_URL;
  const analysisWorkerUrl = process.env.DUEBACK_ANALYSIS_WORKER_URL;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT;
  if (!projectId || !workerUrl || !analysisWorkerUrl || !serviceAccountEmail) return undefined;
  return new TaskScheduler(new CloudTasksClient(), {
    projectId,
    location: process.env.CLOUD_TASKS_LOCATION ?? "us-central1",
    queue: process.env.CLOUD_TASKS_QUEUE ?? "actionos-cases",
    workerUrl,
    analysisWorkerUrl,
    serviceAccountEmail,
    ...(process.env.DUEBACK_TASKS_OIDC_AUDIENCE
      ? { oidcAudience: process.env.DUEBACK_TASKS_OIDC_AUDIENCE }
      : {})
  });
}
