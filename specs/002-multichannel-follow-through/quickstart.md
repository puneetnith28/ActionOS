# Quickstart: Multichannel Follow-Through

## Deterministic verification without provider credentials

```bash
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Run adapter contracts and bidirectional fixtures:

```bash
pnpm --filter @actionos/channel-adapters test
pnpm --filter @actionos/runtime test
pnpm exec vitest run tests/contract tests/integration tests/adversarial
```

No test may require a real address, domain, token or secret unless it is explicitly marked external.

## Local sandbox route

Copy `.env.example` to an ignored local environment file. Leave
`COMPANY_CONTACT_MODE=sandbox`, run the sandbox and web services, create a synthetic case, inspect
the full conversation plan, approve it and observe acknowledgement rejection followed by exact
merchant confirmation.

## Controlled email smoke gate

Before switching modes, verify all of these out of band:

- sending domain/remitter verified;
- receiving/reply domain active;
- provider webhook signing secret stored in Secret Manager;
- exactly listed controlled recipient mailbox;
- inbound webhook registered to the deployed HTTPS endpoint;
- rollback command/configuration to `sandbox` prepared.

Set secrets through the deployment platform, never a committed file. Set non-secret mode/sender
configuration and deploy. Send only to the authorized controlled mailbox. Reply first with a fixture
acknowledgement, then a controlled sufficient confirmation. Record provider IDs, state transitions,
timing and failures with addresses redacted.

Required server configuration:

```text
COMPANY_CONTACT_MODE=email
COMPANY_EMAIL_FROM=ActionOS <followup@verified.example>
COMPANY_EMAIL_REPLY_DOMAIN=inbound.verified.example
COMPANY_EMAIL_ALLOWED_RECIPIENT_DOMAINS=controlled-mailbox.example
ACTIONOS_NOTIFICATION_FROM=ActionOS <updates@verified.example>
ACTIONOS_PUBLIC_BASE_URL=https://your-service.run.app
```

Required Secret Manager bindings:

```text
RESEND_API_KEY=actionos-resend-api-key:latest
EMAIL_WEBHOOK_SIGNING_SECRET=actionos-email-webhook-signing:latest
```

Register the provider webhook at
`https://your-service.run.app/api/webhooks/email` for inbound and delivery events. The signed
handler acknowledges after durable reservation/enqueue; `/api/internal/tasks/process-inbound` is an
OIDC-protected Cloud Tasks target and must never be registered publicly with the provider.

Rollback does not delete evidence. Update `COMPANY_CONTACT_MODE=sandbox`, remove the provider secret
bindings if desired, deploy, then verify `/api/channels` reports managed email unavailable and the
controlled sandbox available.

Raw inbound subject/body is retained for at most 24 hours in `inboundEnvelopes`; provider-event,
thread, action and notification metadata use the documented Firestore TTL policy. Requested case
deletion removes user-visible case records and leaves only a non-personal tombstone.

## Public browser verification

```bash
ACTIONOS_DEPLOYED_URL='https://your-service.run.app' \
  pnpm exec playwright test --workers=1 --retries=0
```

The public path must remain functional in sandbox mode if email smoke is not stable.
