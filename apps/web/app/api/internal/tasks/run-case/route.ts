import { CloudTasksClient } from "@google-cloud/tasks";
import { MerchantSandboxAdapter } from "@actionos/channel-adapters/merchant-sandbox";
import { CompanyEmailActionAdapter } from "@actionos/channel-adapters/company-email";
import { PartnerApiFixtureAdapter } from "@actionos/channel-adapters/partner-api";
import {
  ChannelRegistry,
  publicChannelCapabilities,
  RoutingChannelAdapter
} from "@actionos/runtime/channel-registry";
import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { ActionBroker } from "@actionos/runtime/action-broker";
import { CaseRunner } from "@actionos/runtime/case-runner";
import { InterventionService } from "@actionos/runtime/interventions";
import { CaseNotificationService } from "@actionos/runtime/notifications";
import { TaskScheduler } from "@actionos/runtime/task-scheduler";
import { firestore } from "../../../../../lib/firebase-admin";
import { handleRunCaseTask } from "../../../../../lib/task-controller";
import {
  assertControlledRecipient,
  parseAllowedRecipientDomains
} from "../../../../../lib/security-limits";
import { notificationDelivery } from "../../../../../lib/notification-delivery";
import { durableCaseScheduler } from "../../../../../lib/durable-case-scheduler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const workerUrl = process.env.DUEBACK_WORKER_URL;
  const merchantUrl = process.env.MERCHANT_SANDBOX_URL;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT;
  const actionSecret = process.env.MERCHANT_CALLBACK_SECRET;
  const emailApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.COMPANY_EMAIL_FROM;
  const emailReplyDomain = process.env.COMPANY_EMAIL_REPLY_DOMAIN;
  const allowedRecipientDomains = parseAllowedRecipientDomains(
    process.env.COMPANY_EMAIL_ALLOWED_RECIPIENT_DOMAINS
  );
  const partnerEndpoint = process.env.PARTNER_FIXTURE_ENDPOINT;
  const partnerSecret = process.env.PARTNER_FIXTURE_SIGNING_SECRET;
  if (!projectId || !workerUrl || !serviceAccountEmail)
    return Response.json({ error: "RUNTIME_NOT_CONFIGURED" }, { status: 503 });
  const store = new FirestoreRuntimeStore(firestore);
  const scheduler = durableCaseScheduler(new TaskScheduler(new CloudTasksClient(), {
    projectId,
    location: process.env.CLOUD_TASKS_LOCATION ?? "us-central1",
    queue: process.env.CLOUD_TASKS_QUEUE ?? "actionos-cases",
    workerUrl,
    serviceAccountEmail,
    ...(process.env.DUEBACK_TASKS_OIDC_AUDIENCE
      ? { oidcAudience: process.env.DUEBACK_TASKS_OIDC_AUDIENCE }
      : {})
  }));
  const capabilities = publicChannelCapabilities({
    now: new Date().toISOString(),
    sandboxAvailable: Boolean(merchantUrl && actionSecret),
    managedEmailOutbound: Boolean(
      emailApiKey &&
      emailFrom &&
      emailReplyDomain &&
      allowedRecipientDomains.length > 0
    ),
    managedEmailInbound: Boolean(
      emailApiKey &&
      process.env.EMAIL_WEBHOOK_SIGNING_SECRET &&
      emailReplyDomain
    ),
    partnerFixtureAvailable: Boolean(partnerEndpoint && partnerSecret)
  });
  const sandboxCapability = capabilities.find((item) => item.channelType === "CONTROLLED_SANDBOX");
  const emailCapability = capabilities.find((item) => item.channelType === "MANAGED_EMAIL");
  const partnerCapability = capabilities.find((item) => item.channelType === "PARTNER_API");
  if (!sandboxCapability || !emailCapability || !partnerCapability)
    return Response.json({ error: "CONTACT_CHANNEL_NOT_CONFIGURED" }, { status: 503 });
  const registry = new ChannelRegistry([
    {
      capability: sandboxCapability,
      ...(merchantUrl && actionSecret
        ? { adapter: new MerchantSandboxAdapter({
            baseUrl: merchantUrl,
            scenario: process.env.MERCHANT_SCENARIO ?? "signed-completion",
            actionSecret
          }) }
        : {})
    },
    {
      capability: emailCapability,
      ...(emailApiKey && emailFrom && emailReplyDomain
        ? { adapter: {
            execute(proposal, idempotencyKey, context) {
              assertControlledRecipient(proposal.recipient, allowedRecipientDomains);
              return new CompanyEmailActionAdapter({
                apiKey: emailApiKey,
                from: emailFrom,
                replyDomain: emailReplyDomain
              }).execute(proposal, idempotencyKey, context);
            }
          } }
        : {})
    },
    {
      capability: partnerCapability,
      ...(partnerEndpoint && partnerSecret
        ? { adapter: new PartnerApiFixtureAdapter({
            endpoint: partnerEndpoint,
            signingSecret: partnerSecret
          }) }
        : {})
    }
  ]);
  const runner = new CaseRunner(
    store,
    new ActionBroker(store, new RoutingChannelAdapter(registry), store),
    scheduler,
    30,
    5,
    new InterventionService(store, store, notificationDelivery(store)),
    new CaseNotificationService(store, notificationDelivery(store))
  );
  return handleRunCaseTask(request, runner, () => new Date().toISOString());
}
