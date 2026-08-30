import { CloudTasksClient } from "@google-cloud/tasks";
import { config } from "./config";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import type { DurableWakeScheduler } from "@actionos/runtime/wake-outbox";
import { durableCaseScheduler } from "./durable-mission-scheduler";

export function missionScheduler(): DurableWakeScheduler | undefined {
  let tasksConfig;
  try {
    tasksConfig = config.tasks;
  } catch (error) {
    return undefined;
  }
  return durableCaseScheduler(new TaskScheduler(new CloudTasksClient(), {
    projectId: config.projectId,
    location: tasksConfig.location,
    queue: tasksConfig.queue,
    workerUrl: tasksConfig.workerUrl,
    serviceAccountEmail: tasksConfig.serviceAccount,
    ...(tasksConfig.oidcAudience ? { oidcAudience: tasksConfig.oidcAudience } : {})
  }));
}
