import { CloudTasksClient } from "@google-cloud/tasks";
import { config } from "./config";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";

export function analysisScheduler(): TaskScheduler | undefined {
  let tasksConfig;
  try {
    tasksConfig = config.tasks;
  } catch (error) {
    return undefined;
  }
  return new TaskScheduler(new CloudTasksClient(), {
    projectId: config.projectId,
    location: tasksConfig.location,
    queue: tasksConfig.queue,
    workerUrl: tasksConfig.workerUrl,
    analysisWorkerUrl: tasksConfig.analysisWorkerUrl,
    serviceAccountEmail: tasksConfig.serviceAccount,
    ...(tasksConfig.oidcAudience ? { oidcAudience: tasksConfig.oidcAudience } : {})
  });
}
