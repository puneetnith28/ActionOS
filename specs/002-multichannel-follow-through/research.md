# Research and Decisions: Multichannel Follow-Through

## R-001 — Managed email before connected Gmail

**Decision**: Use the existing Resend-compatible transport for the first controlled managed-email
path. Keep Gmail as an optional user-owned sender adapter.

**Rationale**: Managed email avoids asking every user for mailbox access and provides provider
receipts, inbound webhooks and case-specific addresses. Gmail sending requires OAuth; `gmail.send`
is sensitive, while reading or modifying mailbox content introduces broader restricted scopes and
verification risk. The hackathon already has essential Google technology in the reasoning and
durability path, so replacing transport solely for branding would reduce readiness.

**Alternatives rejected**: Gmail-only P0; unrestricted SMTP; pretending Cloud Run is an email
service; provider marketplace breadth.

## R-002 — Provider-managed inbound domain for P0

**Decision**: Receive replies at `case+<opaque-route>@<managed-domain>` and route signed inbound
events to ActionOS. Use a dedicated subdomain when a custom domain is adopted.

**Rationale**: It creates a direct thread without reading a user's inbox. Opaque routing prevents a
raw case ID from acting as authorization; ownership remains server-side.

**Alternatives rejected**: Gmail-wide inbox watch for every user; inbound forwarding with no
signature; parsing mail sent to a personal mailbox.

## R-003 — Webhook reserve then asynchronous processing

**Decision**: Verify the original request body, reserve a stable provider event ID, return success,
and enqueue retrieval/normalization through Cloud Tasks.

**Rationale**: Providers retry slow/non-successful webhooks. Model and attachment processing cannot
fit safely inside the acknowledgement deadline. Reservation plus dedupe handles redelivery.

## R-004 — Local durable idempotency remains authoritative

**Decision**: Keep the existing action ledger as the durable logical-send authority and pass its key
to providers when supported.

**Rationale**: Provider idempotency windows are bounded and cannot cover long-lived retry, replay or
provider migration. A timeout after provider acceptance requires reconciliation, not blind resend.

## R-005 — Transport projection, not lifecycle-state explosion

**Decision**: Keep lifecycle states stable and derive `scheduled/sending/accepted/delivered/bounced/
reply-received` from typed channel events and the latest transport projection.

**Rationale**: Delivery and lifecycle are orthogonal. A delivered email can coexist with
`WAITING_EXTERNAL`; a bounce creates `NEEDS_ATTENTION`. This minimizes migration risk.

## R-006 — Authentication signals do not prove business outcome

**Decision**: Provider signature authenticates the event source; email authentication and sender
matching are evidence signals; deterministic case/evidence policy still controls completion.

**Rationale**: A valid provider webhook does not prove the sender's business authority, and a reply
does not prove funds settlement. Ambiguity escalates to the person.

## R-007 — Deterministic message generation

**Decision**: Generate the first follow-up from approved structured fields and a versioned template.
Gemini may suggest language before approval but cannot mutate an activated message.

**Rationale**: The user can review exactly what will leave the system; replay produces identical
content; hostile inbound text cannot influence future sends.

## R-008 — Partner API is the single portability proof

**Decision**: Implement a reduced controlled partner-API adapter after bidirectional email gates.

**Rationale**: It demonstrates the channel contract without browser automation, CAPTCHA, unclear
terms or a second production dependency. Web form and WhatsApp remain design-level capabilities.

## R-009 — Notification source of truth

**Decision**: Persist NotificationRecord first; delivery adapters update delivery status but cannot
change case completion.

**Rationale**: The case remains inspectable when email delivery is unavailable, bounced or disabled.

## R-010 — Gmail acceptance gate

Gmail proceeds only if all are true: incremental consent is usable in the public deployment; token
encryption/revocation/refresh are complete; requested scopes avoid broad reading or have an accepted
verification plan; push watch renewal is durable; and the work does not threaten demo/submission.
Otherwise the adapter remains specified and unavailable.

**Gate result (2026-08-16)**: rejected for the hackathon MVP. No consent-screen verification,
encrypted token lifecycle, revocation flow or durable Gmail watch-renewal evidence exists. The
capability endpoint therefore reports `GMAIL_CONNECTED/FUTURE` with no send or receive authority.
This is a tested unavailable capability, not a claimed integration. Managed email remains the
bounded production-shaped path because it needs neither mailbox-wide access nor restricted inbox
scopes.

## R-011 — Provider HTTP boundary without an additional SDK

**Decision**: Use the platform `fetch` implementation against the provider's exact HTTPS endpoints
and pin no provider SDK. The only new behavior is implemented behind ActionOS-owned typed adapters.

**Rationale**: Node, framework and Google dependencies are already exactly pinned in the committed
workspace manifests and lockfile. Adding a convenience SDK would increase supply-chain surface
without improving webhook authenticity, idempotency or bounded retrieval. Tests assert exact URLs,
headers and response contracts. Any future SDK addition must use an exact version and committed
lockfile change.
