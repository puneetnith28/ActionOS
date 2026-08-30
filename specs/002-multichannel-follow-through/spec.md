# Feature Specification: Multichannel Follow-Through

**Feature Branch**: `002-multichannel-follow-through`

**Created**: 2026-08-16

**Status**: Ready for planning

**Input**: User description: "Extend ActionOS from a controlled proof-of-done demo into a clear,
bidirectional follow-through product. Email is the first real channel, Gmail is optional, and web
forms, WhatsApp, partner APIs, and the controlled sandbox share one honest channel model."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Approve a Real Conversation (Priority: P1)

A person shares evidence of an unfinished outcome and reviews a conversation plan that shows who
ActionOS will contact, by which available channel, what it will say, what information it will share,
when it may follow up, what it will never do, what proof is required, and how the result returns.

**Why this priority**: The person cannot safely delegate follow-through unless the external action
and return path are concrete and understandable before approval.

**Independent Test**: Create a synthetic refund case, correct the support address, inspect the full
first message and limits, change the channel or recipient, and verify that approval is bound only to
the final visible version without sending anything early.

**Acceptance Scenarios**:

1. **Given** an extracted promise, **When** the person opens review, **Then** the active channel,
   exact recipient, sender identity, reply route, subject, message, shared fields, schedule, maximum
   follow-ups, escalation conditions, required proof, and return channel are visible.
2. **Given** a recipient that is missing, invalid, unverified for the pilot, or uncertain, **When**
   activation is attempted, **Then** activation remains blocked with an actionable correction.
3. **Given** a reviewed plan, **When** the person changes channel, recipient, message scope, schedule,
   or follow-up allowance, **Then** a new version and identity are created and prior approval is invalid.
4. **Given** channels that are not executable in the current deployment, **When** they are shown,
   **Then** they are visibly unavailable and cannot be selected or approved.

---

### User Story 2 - Send One Authorized Email Reliably (Priority: P1)

After approval and at the approved time, ActionOS sends one real transactional follow-up to an
authorized controlled recipient, records the transport result, and survives retry or restart
without sending a duplicate.

**Why this priority**: A real external action makes the product useful beyond a self-contained demo,
while idempotency and exact authorization demonstrate production discipline.

**Independent Test**: Approve a case to a controlled mailbox, inject a timeout after provider
acceptance, redeliver the worker task, and verify one logical message, one receipt, and a waiting case.

**Acceptance Scenarios**:

1. **Given** a current approved plan whose send time has arrived, **When** the worker executes,
   **Then** exactly the approved message is sent to the approved recipient through the approved channel.
2. **Given** a provider receipt, **When** it is persisted, **Then** the case shows provider acceptance
   or delivery as transport activity and remains unresolved.
3. **Given** duplicate tasks or an uncertain provider timeout, **When** execution resumes, **Then**
   local durable idempotency prevents another logical send.
4. **Given** a bounce, complaint, suppression, invalid address, or exhausted retry, **When** it is
   processed, **Then** future sends stop and the person receives one actionable intervention.

---

### User Story 3 - Receive and Evaluate a Reply (Priority: P1)

A reply sent to the case-specific address is authenticated, deduplicated, correlated to the correct
case, normalized as hostile external data, interpreted for candidate facts, and evaluated without
letting the model or transport declare completion.

**Why this priority**: Outbound-only email is another message sender. Bidirectional reply handling is
what allows ActionOS to continue the work and return only when something meaningful changes.

**Independent Test**: Reply from a controlled mailbox first with an acknowledgement and then with
matching confirmation; verify that the first reply keeps the case open and the second reaches only
the evidence level allowed by deterministic policy.

**Acceptance Scenarios**:

1. **Given** a signed provider event for the case reply address, **When** it arrives, **Then** it is
   acknowledged promptly, deduplicated, and processed asynchronously.
2. **Given** a reply with unknown case identity, invalid signature, stale timestamp, replayed event,
   unexpected sender, or ambiguous thread, **When** it is processed, **Then** it cannot affect a case
   and produces a redacted rejection or intervention as appropriate.
3. **Given** a reply stating only that the request was received, **When** it is evaluated, **Then**
   the case remains open and the missing evidence is visible.
4. **Given** a reply that proposes a different amount, remedy, recipient, fee, or permission,
   **When** it is evaluated, **Then** ActionOS requests a decision and does not accept or pursue it.
5. **Given** authenticated evidence matching the approved case and requirement, **When** the
   deterministic verifier accepts it, **Then** the case reaches the exact supported evidence level.

---

### User Story 4 - Return Only When It Matters (Priority: P2)

The person can leave the application while ActionOS waits, sends, receives, retries, and verifies.
They receive one deduplicated update when a decision is needed or evidence is accepted, and can
inspect or control the case without navigating a dashboard.

**Why this priority**: The product saves attention only if the person does not have to monitor it.

**Independent Test**: Activate a case, close the page, process an insufficient reply followed by a
decision or completion event, and verify one notification with a deep link to the correct case.

**Acceptance Scenarios**:

1. **Given** an active case, **When** the page closes or the service redeploys, **Then** scheduled work
   and inbound processing continue from durable state.
2. **Given** repeated copies of the same decision or completion event, **When** notifications are
   generated, **Then** exactly one logical notification exists for that event.
3. **Given** a notification attempt that is delivered, bounced, suppressed, or unavailable,
   **When** the person opens the case, **Then** its exact delivery status and the in-app update remain visible.
4. **Given** a waiting case, **When** the person stops, revokes, deletes, or reopens it where allowed,
   **Then** subsequent behavior follows the current authority and the history remains truthful.

---

### User Story 5 - Reuse the Runtime Across Channels (Priority: P3)

The same approval, action, receipt, inbound, evidence, notification, and audit semantics can execute
against the controlled sandbox and one reduced partner-API adapter without creating channel-specific
case logic. Gmail can be added later through incremental consent without blocking the primary flow.

**Why this priority**: A bounded portability proof supports the global product story without trading
away the depth and reliability required for the hackathon.

**Independent Test**: Run equivalent synthetic action envelopes through sandbox, managed email, and
a reduced partner-API fixture; verify common policy, idempotency, receipts, and state outcomes.

**Acceptance Scenarios**:

1. **Given** two enabled adapters with different capabilities, **When** the user reviews them, **Then**
   only supported send, receive, threading, delivery, and authentication capabilities are claimed.
2. **Given** a channel change before approval, **When** execution begins, **Then** the selected adapter
   receives the same authorized action envelope and common policy applies.
3. **Given** Gmail is not configured or would require broader access than accepted, **When** channels
   are listed, **Then** Gmail remains unavailable without weakening the managed-email path.

### Edge Cases

- The extracted company name has no reliable support address.
- The person types their own address or an address belonging to an unrelated third party.
- The recipient is syntactically valid but not authorized for the pilot.
- The provider accepts a message and the worker fails before saving the receipt.
- A delivery webhook arrives before the send receipt is persisted.
- Delivery, bounce, complaint, suppression, and reply events arrive more than once or out of order.
- The reply address contains a malformed, truncated, unknown, deleted, or cross-owner case token.
- The reply is an out-of-office message, automated ticket acknowledgement, empty body, quoted-only
  response, attachment-only response, or a new thread.
- The sender display name matches the company but the address or authentication signals do not.
- The body, signature, quoted history, headers, QR, or attachment contains prompt injection.
- The reply confirms an outcome with a different amount, currency, reference, item, jurisdiction,
  date, fee, remedy, or evidence level.
- A reply arrives after stop, revocation, expiry, completion, reopen, or requested deletion.
- The case reaches its send, model-call, task-attempt, notification, recipient, or domain budget.
- The user changes the plan while a scheduled task is already in flight.
- A channel becomes unavailable after approval but before execution.
- Gmail consent is revoked or its push watch expires.
- A provider exposes only acceptance, not delivery or authenticated reply.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The review experience MUST show active contact channel, recipient, sender identity,
  reply route, subject, complete first message, shared data, first send time, follow-up cadence,
  maximum sends, escalation rule, completion evidence, expiry, and user return channel.
- **FR-002**: Only channels whose required configuration and health checks pass MAY be selectable;
  unavailable and future channels MUST be labeled and non-actionable.
- **FR-003**: Changing any action-authorizing field MUST create a new plan version and canonical
  identity and MUST invalidate any prior approval.
- **FR-004**: A recipient MUST be syntactically valid, explicitly confirmed, bound to the current
  plan, and authorized by the pilot policy before activation.
- **FR-005**: No discovery result, inbound content, model output, provider response, or adapter MAY
  add or change a channel, recipient, message scope, shared field, cadence, action, or evidence rule.
- **FR-006**: The product MUST prevent approval of a message or channel it cannot execute in the
  current deployment.
- **FR-007**: Managed email MUST send plain-text transactional follow-up from a verified sender to
  an authorized controlled recipient and use a case-specific reply address.
- **FR-008**: Every external send MUST pass the common deterministic authorization policy immediately
  before the provider call.
- **FR-009**: Every logical send MUST have a durable local idempotency identity independent of the
  provider's deduplication window.
- **FR-010**: The system MUST preserve enough state to reconcile an uncertain timeout after provider
  acceptance without blindly resending.
- **FR-011**: A provider receipt MUST record provider ID, channel, case, action identity, recipient
  fingerprint, acceptance time, observed delivery state, and correlation identity without exposing
  the raw recipient in public logs.
- **FR-012**: Provider acceptance, send success, and delivery MUST remain transport events and MUST
  NOT satisfy completion evidence.
- **FR-013**: Bounce, complaint, suppression, invalid recipient, or permanent failure MUST prevent
  additional sends on that route and create at most one actionable intervention.
- **FR-014**: Retryable failures MUST use bounded backoff; exhausted recovery MUST transition to
  `NEEDS_ATTENTION` and MUST NOT retry indefinitely.
- **FR-015**: The system MUST accept signed provider webhooks for send status and inbound email and
  acknowledge them within the provider deadline before bounded asynchronous processing.
- **FR-016**: Every webhook MUST be verified over the original body with provider signature,
  timestamp tolerance, stable event identity, and replay rejection before normalization.
- **FR-017**: Incoming messages MUST be correlated using the case reply address plus provider/thread
  identifiers; ambiguous or conflicting correlation MUST NOT alter case state.
- **FR-018**: Inbound bodies, headers, quoted history, senders, links, and attachments MUST be treated
  as hostile data and MUST NOT receive credentials or tool authority.
- **FR-019**: Inbound content retrieval MUST use exact provider endpoints, bounded timeouts, media
  detection, and documented size, count, and type limits.
- **FR-020**: Gemini MAY extract candidate claims, evidence fields, reply type, and uncertainty from
  normalized inbound content but MUST NOT authorize actions or transition case lifecycle.
- **FR-021**: A deterministic verifier MUST distinguish delivery, acknowledgement, commitment,
  counterparty confirmation, and independently verified outcome.
- **FR-022**: Auto-replies, ticket creation, `request received`, and equivalent acknowledgements MUST
  keep the case open.
- **FR-023**: A changed amount, currency, reference, remedy, fee, deadline, recipient, or requested
  authority MUST create an intervention instead of implicit acceptance.
- **FR-024**: Evidence that is unauthenticated, stale, cross-case, unexpected-sender, ambiguous, or
  incomplete MUST NOT close a case.
- **FR-025**: The system MUST preserve the exact claim boundary and MUST NOT describe
  merchant-confirmed action as funds settled or physical delivery.
- **FR-026**: The case experience MUST expose human-readable states for scheduled, sending, provider
  accepted, delivered, waiting for reply, response insufficient, decision needed, retrying, stopped,
  expired, and evidence accepted.
- **FR-027**: The case MUST expose its next action and time, attempt allowance, active channel,
  recipient fingerprint or user-safe address, stop control, and user return channel.
- **FR-028**: Active work MUST continue after tab closure, process restart, and deployment.
- **FR-029**: The system MUST create one persistent deduplicated `NEEDS_ATTENTION` or
  `CASE_COMPLETED` notification and deep-link it to the owned case.
- **FR-030**: Notification delivery state MUST distinguish in-app record, provider accepted,
  delivered, bounced, suppressed, failed, and unavailable without overstating delivery.
- **FR-031**: Stop, revoke, expiry, and deletion MUST prevent future external sends; late inbound
  events MAY be recorded only according to retention policy and MUST NOT silently reactivate a case.
- **FR-032**: Reopen MUST preserve prior evidence and history and require new authority before any
  materially changed action.
- **FR-033**: All adapters MUST declare send, receive, threading, delivery-receipt, authenticated-
  reply, and user-OAuth capabilities plus current configuration health.
- **FR-034**: Sandbox, managed email, Gmail, partner API, future adapters, fixtures, and demo sinks
  MUST be visually and operationally distinguishable.
- **FR-035**: The sandbox and managed-email adapters MUST consume a common authorized action envelope
  and produce a common receipt contract.
- **FR-036**: One reduced partner-API fixture MUST prove reuse of common policy, idempotency, receipt,
  and lifecycle behavior without claiming a production integration.
- **FR-037**: Gmail MUST remain optional and unavailable until incremental consent, token revocation,
  refresh, scope, privacy, and push-renewal behavior are specified and tested.
- **FR-038**: Gmail integration SHOULD use a ActionOS-managed reply route when that avoids requesting
  broad mailbox-reading access.
- **FR-039**: Public testing MUST restrict external email to controlled authorized addresses and MUST
  prevent bulk sending or arbitrary public recipients.
- **FR-040**: Rate limits MUST apply per owner, case, recipient, domain, and channel, including no more
  than three logical follow-ups per case in the public pilot.
- **FR-041**: Logs and metrics MUST exclude raw email bodies, attachments, tokens, full addresses,
  and unnecessary personal data; stable fingerprints MAY be used for correlation.
- **FR-042**: Raw inbound content MUST follow the same bounded retention and requested-deletion policy
  as source artifacts; audit tombstones MUST remain non-personal.
- **FR-043**: Secrets and OAuth tokens MUST be stored outside source control with least-privilege
  service access and MUST never be exposed to browser code or model calls.
- **FR-044**: The product MUST provide a visible anti-abuse disclosure and require the person to
  confirm a legitimate relationship and authorization to contact the recipient.
- **FR-045**: The system MUST NOT automate legal threats, chargebacks, public posts, purchases,
  payments, remedy changes, CAPTCHA bypass, arbitrary browsing, or unofficial messaging accounts.
- **FR-046**: Deterministic tests MUST cover authorization, recipient changes, send/retry uncertainty,
  duplicate and reordered webhooks, bounce/suppression, reply correlation, hostile content,
  insufficient evidence, changed remedy, stop/revoke/delete races, and cross-owner isolation.
- **FR-047**: External smoke tests MUST use controlled mailboxes and publish counts, timing, provider
  state, and failures without addresses or credentials.
- **FR-048**: The judging path MUST remain runnable without paid judge credentials and MUST preserve
  the complete sandbox route if real email is unavailable or unstable.
- **FR-049**: The under-four-minute demo MUST visibly show extraction, conversation approval,
  durable execution, an insufficient response, failure/recovery without duplication, exact evidence
  acceptance, notification, timeline, Google Cloud execution, and honest channel labeling.
- **FR-050**: Documentation MUST include channel configuration, webhook setup, secret provisioning,
  retention, abuse constraints, reproduction, provider limitations, and rollback to sandbox mode.

### Key Entities

- **Channel Configuration**: Enabled adapter, capabilities, health, sender/reply identity, provider,
  environment, and policy limits without secret values.
- **Conversation Plan**: Versioned approved channel, recipient, sender, reply route, message, shared
  fields, timing, follow-up allowance, escalation, evidence, expiry, and plan identity.
- **Action Envelope**: One policy-checked request to a channel adapter.
- **Action Receipt**: Provider-accepted external effect with exact transport-level claim.
- **Message Thread**: Case-scoped correlation between outbound message and inbound replies.
- **Inbound Envelope**: Verified provider event and normalized hostile message metadata/content.
- **Delivery Event**: Accepted, delivered, bounced, complained, suppressed, or failed transport state.
- **Evidence Candidate**: Model-extracted or adapter-derived claims awaiting deterministic verification.
- **Intervention**: One bounded user decision or correction required to continue.
- **Notification Record**: Deduplicated user return event and its delivery state.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A first-time participant can identify channel, recipient, outgoing message, prohibited
  actions, required proof, and return path from review without external explanation.
- **SC-002**: Every tested change to an action-authorizing field invalidates the prior approval.
- **SC-003**: The controlled external-email corpus records zero sends before approval and zero sends
  to a recipient different from the current approved plan.
- **SC-004**: Duplicate task delivery, retry, and simulated post-acceptance interruption produce zero
  duplicate logical sends in the published test corpus.
- **SC-005**: Every accepted provider event is processed or placed in a visible failure/dead-letter
  state; no event is silently discarded in the test corpus.
- **SC-006**: Invalid-signature, replayed, stale, cross-case, and ambiguous inbound events produce
  zero unauthorized state transitions.
- **SC-007**: Delivery receipts and acknowledgement-only replies produce zero false completion in the
  versioned evaluation corpus.
- **SC-008**: A controlled bidirectional case continues after browser closure and reaches its exact
  verified evidence level without manual server intervention.
- **SC-009**: Repeated decision/completion events produce one logical notification per case event.
- **SC-010**: The full judging story completes in under four minutes using a deployed, visibly
  labeled and reproducible path.
- **SC-011**: At least one managed-email smoke case and one sandbox case publish provider/action IDs,
  timing, retry count, outcome, and failures with no addresses, secrets, or raw content.
- **SC-012**: All implemented channels report truthful capabilities, and no unavailable channel can
  be activated in deterministic browser tests.

## Assumptions

- The initial external-email pilot uses a provider-managed sending/receiving domain and mailboxes
  controlled by the participant; arbitrary public recipients remain disabled.
- Managed email uses a maximum of three logical follow-ups per case with bounded backoff.
- Email body generation is deterministic from approved structured fields; Gemini does not freely
  compose or change the approved message after activation.
- Ambiguous or insufficiently authenticated replies require human review and cannot reach `DONE`.
- The second reduced portability adapter is a partner-API fixture because it is safer and more
  reproducible than arbitrary form automation.
- Gmail is optional and will be skipped if OAuth review, token handling, or mailbox access threatens
  delivery quality or the competition deadline.
- The current sandbox remains the primary deterministic judging path until managed email passes all
  outbound, inbound, security, and bidirectional gates.
