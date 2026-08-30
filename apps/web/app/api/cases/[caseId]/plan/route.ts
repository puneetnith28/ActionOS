import { CloudTasksClient } from "@google-cloud/tasks";
import { FirestoreIntakeStore } from "@actionos/persistence/intake-store";
import { PlanService } from "@actionos/runtime/plan-service";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { authenticatedOwner, assertSameOrigin } from "../../../../../lib/authz";
import { firestore } from "../../../../../lib/firebase-admin";
import { handlePlanRequest } from "../../../../../lib/plan-controller";
import { publicCapabilities } from "@actionos/runtime/capability-registry";
import { stableHash } from "@actionos/domain";
import { durableCaseScheduler } from "../../../../../lib/durable-case-scheduler";

export const runtime = "nodejs";
function planService() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const workerUrl = process.env.DUEBACK_WORKER_URL;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT;
  const scheduler =
    projectId && workerUrl && serviceAccountEmail
      ? durableCaseScheduler(new TaskScheduler(new CloudTasksClient(), {
          projectId,
          location: process.env.CLOUD_TASKS_LOCATION ?? "us-central1",
          queue: process.env.CLOUD_TASKS_QUEUE ?? "actionos-missions",
          workerUrl,
          serviceAccountEmail,
          ...(process.env.DUEBACK_TASKS_OIDC_AUDIENCE
            ? { oidcAudience: process.env.DUEBACK_TASKS_OIDC_AUDIENCE }
            : {})
        }))
      : undefined;
  return new PlanService(new FirestoreIntakeStore(firestore), scheduler);
}

function isRecoverableOwner(owner: { firebase?: { sign_in_provider?: string } }): boolean {
  const provider = owner.firebase?.sign_in_provider;
  return Boolean(provider && provider !== "anonymous");
}

function isChannelAvailable(channelType: string | undefined): boolean {
  if (!channelType) return false;
  const capabilities = publicCapabilities({
    now: new Date().toISOString(),
    sandboxAvailable: Boolean(
      process.env.MERCHANT_SANDBOX_URL && process.env.MERCHANT_CALLBACK_SECRET
    ),
    managedEmailOutbound: Boolean(
      process.env.RESEND_API_KEY && process.env.COMPANY_EMAIL_FROM &&
      process.env.COMPANY_EMAIL_REPLY_DOMAIN &&
      process.env.COMPANY_EMAIL_ALLOWED_RECIPIENT_DOMAINS
    ),
    managedEmailInbound: Boolean(
      process.env.RESEND_API_KEY && process.env.EMAIL_WEBHOOK_SIGNING_SECRET &&
      process.env.COMPANY_EMAIL_REPLY_DOMAIN
    ),
    partnerFixtureAvailable: Boolean(
      process.env.PARTNER_FIXTURE_ENDPOINT && process.env.PARTNER_FIXTURE_SIGNING_SECRET
    )
  });
  return capabilities.some((item) =>
    item.channelType === channelType && item.status === "AVAILABLE" && item.canSend
  );
}

function resolveChannel(channelType: string) {
  if (channelType === "CONTROLLED_SANDBOX") return {
    channelType,
    allowedRecipient: process.env.MERCHANT_SANDBOX_RECIPIENT ?? "merchant@controlled.actionos.test",
    senderIdentity: "ActionOS controlled demo",
    replyRoute: "Signed callback",
    trustedIssuer: "merchant-sandbox"
  } as const;
  if (channelType === "MANAGED_EMAIL") {
    const recipient = process.env.COMPANY_EMAIL_DEFAULT_RECIPIENT ?? "recipient-required@actionos.invalid";
    const replyDomain = process.env.COMPANY_EMAIL_REPLY_DOMAIN;
    const senderIdentity = process.env.COMPANY_EMAIL_FROM;
    if (!replyDomain || !senderIdentity) return undefined;
    return {
      channelType,
      allowedRecipient: recipient,
      senderIdentity,
      replyRoute: `case-specific@${replyDomain}`,
      trustedIssuer: `managed-email:${stableHash({ namespace: "actionos/recipient/v1", recipient: recipient.toLowerCase() }).slice(7, 31)}`
    } as const;
  }
  return undefined;
}
type Context = { params: Promise<{ missionId: string }> };

export async function GET(request: Request, context: Context) {
  const { missionId } = await context.params;
  return handlePlanRequest(request, missionId, {
    authenticate: authenticatedOwner,
    service: planService(),
    now: () => new Date().toISOString(),
    isChannelAvailable,
    resolveChannel,
    isRecoverableOwner
  });
}

export async function POST(request: Request, context: Context) {
  assertSameOrigin(request);
  const { missionId } = await context.params;
  return handlePlanRequest(request, missionId, {
    authenticate: authenticatedOwner,
    service: planService(),
    now: () => new Date().toISOString(),
    isChannelAvailable,
    resolveChannel,
    isRecoverableOwner
  });
}
