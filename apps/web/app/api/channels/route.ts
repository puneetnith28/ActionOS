import { publicChannelCapabilities } from "@actionos/runtime/channel-registry";

export const runtime = "nodejs";

export function GET() {
  const managedEmailOutbound = Boolean(
    process.env.RESEND_API_KEY &&
    process.env.COMPANY_EMAIL_FROM &&
    process.env.COMPANY_EMAIL_REPLY_DOMAIN &&
    process.env.COMPANY_EMAIL_ALLOWED_RECIPIENT_DOMAINS
  );
  const managedEmailInbound = Boolean(
    process.env.RESEND_API_KEY &&
    process.env.EMAIL_WEBHOOK_SIGNING_SECRET &&
    process.env.COMPANY_EMAIL_REPLY_DOMAIN
  );
  return Response.json(publicChannelCapabilities({
    now: new Date().toISOString(),
    sandboxAvailable: Boolean(
      process.env.MERCHANT_SANDBOX_URL && process.env.MERCHANT_CALLBACK_SECRET
    ),
    managedEmailOutbound,
    managedEmailInbound,
    partnerFixtureAvailable: Boolean(
      process.env.PARTNER_FIXTURE_ENDPOINT && process.env.PARTNER_FIXTURE_SIGNING_SECRET
    )
  }));
}
