import { CloudTasksClient } from "@google-cloud/tasks";
import { config } from "../../../../../lib/config";
import { FirestoreIntakeStore } from "@actionos/persistence/intake-store";
import { PlanService } from "@actionos/runtime/plan-service";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { authenticatedOwner, assertSameOrigin } from "../../../../../lib/authz";
import { firestore } from "../../../../../lib/firebase-admin";
import { handlePlanRequest } from "../../../../../lib/plan-controller";
import { publicCapabilities } from "@actionos/runtime/capability-registry";
import { stableHash } from "@actionos/domain";
import { durableCaseScheduler } from "../../../../../lib/durable-mission-scheduler";

export const runtime = "nodejs";
function planService() {
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
      config.urls.sandbox && config.secrets.merchantCallback
    ),
    managedEmailOutbound: Boolean(
      config.secrets.resendApiKey && config.email.from &&
      config.email.replyDomain &&
      config.email.allowedDomains
    ),
    managedEmailInbound: Boolean(
      config.secrets.resendApiKey && config.secrets.emailWebhookSigning &&
      config.email.replyDomain
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
    allowedRecipient: config.urls.sandboxRecipient,
    senderIdentity: "ActionOS controlled demo",
    replyRoute: "Signed callback",
    trustedIssuer: "merchant-sandbox"
  } as const;
  if (channelType === "MANAGED_EMAIL") {
    const recipient = process.env.COMPANY_EMAIL_DEFAULT_RECIPIENT ?? "recipient-required@actionos.invalid";
    const replyDomain = config.email.replyDomain;
    const senderIdentity = config.email.from;
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
