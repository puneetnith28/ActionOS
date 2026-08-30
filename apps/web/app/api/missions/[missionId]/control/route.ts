import { CloudTasksClient } from "@google-cloud/tasks";
import { config } from "../../../../../lib/config";
import { FirestoreMissionControlStore } from "@actionos/persistence/retention";
import { MissionControlService } from "@actionos/runtime/mission-control";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { authenticatedOwner, assertSameOrigin } from "../../../../../lib/authz";
import { handleMissionControl } from "../../../../../lib/control-controller";
import { firestore } from "../../../../../lib/firebase-admin";
import { durableCaseScheduler } from "../../../../../lib/durable-mission-scheduler";

export const runtime = "nodejs";
type Context = { params: Promise<{ missionId: string }> };

function controlService() {
  const projectId = config.projectId;
  const workerUrl = config.tasks.workerUrl;
  const serviceAccountEmail = config.tasks.serviceAccount;
  const scheduler = durableCaseScheduler(new TaskScheduler(new CloudTasksClient(), {
    projectId,
    location: config.tasks.location,
    queue: config.tasks.queue,
    workerUrl,
    serviceAccountEmail,
    ...(config.tasks.oidcAudience
      ? { oidcAudience: config.tasks.oidcAudience }
      : {})
  }));
  return new MissionControlService(new FirestoreMissionControlStore(firestore), scheduler);
}

export async function POST(request: Request, context: Context) {
  assertSameOrigin(request);
  const { missionId } = await context.params;
  return handleMissionControl(request, missionId, {
    authenticate: authenticatedOwner,
    service: controlService(),
    now: () => new Date().toISOString()
  });
}
