import { CloudTasksClient } from "@google-cloud/tasks";
import { config } from "../../../../lib/config";
import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { firestore } from "../../../../lib/firebase-admin";
import { handleEmailWebhook } from "../../../../lib/email-webhook-controller";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const projectId = config.projectId;
  const baseUrl = config.urls.base;
  const serviceAccountEmail = config.tasks.serviceAccount;
  const secret = config.secrets.emailWebhookSigning;
  if (!secret) {
    return Response.json({ error: "EMAIL_WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }
  const scheduler = new TaskScheduler(new CloudTasksClient(), {
    projectId,
    location: config.tasks.location,
    queue: config.tasks.queue,
    workerUrl: `${baseUrl}/api/internal/tasks/run-mission`,
    inboundWorkerUrl: `${baseUrl}/api/internal/tasks/process-inbound`,
    serviceAccountEmail,
    ...(config.tasks.oidcAudience
      ? { oidcAudience: config.tasks.oidcAudience }
      : {})
  });
  return handleEmailWebhook(request, {
    secret,
    now: () => new Date().toISOString(),
    events: new FirestoreRuntimeStore(firestore),
    scheduler
  });
}
