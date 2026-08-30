import { CloudTasksClient } from "@google-cloud/tasks";
import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { firestore } from "../../../../lib/firebase-admin";
import { handleEmailWebhook } from "../../../../lib/email-webhook-controller";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const baseUrl = process.env.APP_BASE_URL;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT;
  const secret = process.env.EMAIL_WEBHOOK_SIGNING_SECRET;
  if (!projectId || !baseUrl || !serviceAccountEmail || !secret) {
    return Response.json({ error: "EMAIL_WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }
  const scheduler = new TaskScheduler(new CloudTasksClient(), {
    projectId,
    location: process.env.CLOUD_TASKS_LOCATION ?? "us-central1",
    queue: process.env.CLOUD_TASKS_QUEUE ?? "actionos-missions",
    workerUrl: `${baseUrl}/api/internal/tasks/run-mission`,
    inboundWorkerUrl: `${baseUrl}/api/internal/tasks/process-inbound`,
    serviceAccountEmail,
    ...(process.env.DUEBACK_TASKS_OIDC_AUDIENCE
      ? { oidcAudience: process.env.DUEBACK_TASKS_OIDC_AUDIENCE }
      : {})
  });
  return handleEmailWebhook(request, {
    secret,
    now: () => new Date().toISOString(),
    events: new FirestoreRuntimeStore(firestore),
    scheduler
  });
}
