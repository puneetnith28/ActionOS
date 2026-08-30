# Feature Specification: Consumer Case Inbox

**Feature Branch**: `004-consumer-case-inbox`

**Created**: 2026-08-17

**Status**: Approved for planning

**Input**: Turn ActionOS into a recoverable consumer follow-up app: progressive identity, My
follow-ups inbox, channel-aware case detail, real email conversation, notifications for decisions
and results, and transparent judge evidence without adding unsupported channels.

## Product Promise

ActionOS is the place where a person leaves a company promise and returns only when a decision or
verified result exists. Email is the transport between ActionOS and the company; the app is the
recoverable source of truth, control and evidence.

The public promise for this iteration is deliberately narrow: **“Share a company promise once.
ActionOS follows that approved thread and brings you back only when it needs you or has proof.”**

## User Scenarios & Testing

### User Story 1 - Return to every follow-up (Priority: P1)

A person can explore anonymously, but before ActionOS contacts a real mailbox they preserve access
with a recoverable identity. On any supported device they open “My follow-ups” and see active,
attention-needed and completed cases without saving individual URLs.

**Why this priority**: A durable agent is not a consumer product if closing the browser or changing
devices strands its owner.

**Independent Test**: Create a draft anonymously, link it to a recoverable identity, activate it,
then sign in from a clean browser and open the same owned case; a different identity is denied.

**Acceptance Scenarios**:

1. **Given** an anonymous person has reviewed a real-email plan, **When** they activate it, **Then**
   ActionOS requires or offers recoverable sign-in before the external action and preserves the
   draft and corrections.
2. **Given** a signed-in owner has several cases, **When** they open “My follow-ups”, **Then** they see
   each company, promised outcome, human status, latest meaningful event and next step.
3. **Given** the owner opens a notification on another device, **When** they authenticate, **Then**
   the deep link opens the same case without granting access through the URL alone.
4. **Given** a non-owner requests a case or list, **When** authorization runs, **Then** no case facts
   are disclosed and the denial is auditable without personal content.

---

### User Story 2 - Understand what is happening now (Priority: P1)

A person opens one case and immediately understands what ActionOS sent, what the company replied,
why that reply did or did not satisfy the promise, what happens next and whether they need to act.

**Why this priority**: The current technical timeline proves architecture but does not answer the
consumer questions “what did they say?” and “what happens now?”.

**Independent Test**: Run one managed-email case through a weak acknowledgement and a sufficient
reply, verifying that the same page changes from “working” to “not done” to the exact supported
result without sandbox language.

**Acceptance Scenarios**:

1. **Given** a managed-email case, **When** the first message is sent, **Then** the detail identifies
   email as the active channel and shows a safe, readable summary of sender, recipient and message.
2. **Given** the company replies “request received”, **When** ActionOS evaluates it, **Then** the page
   says “Not resolved”, quotes only safe bounded evidence, names the missing proof and shows the next
   approved action.
3. **Given** sufficient authenticated evidence arrives, **When** deterministic verification passes,
   **Then** the page compares Promised versus Observed field by field and states the exact limitation
   (for example, company-confirmed refund is not bank settlement).
4. **Given** a sandbox case, **When** its page is opened, **Then** sandbox disclosure remains visible;
   managed-email cases never inherit sandbox labels or callback terminology.

---

### User Story 3 - Be brought back only when needed (Priority: P1)

A person may close the app. ActionOS sends a bounded, deduplicated notification when judgment is
needed, when the case reaches a supported result, or when execution cannot continue.

**Why this priority**: Background autonomy has no user value if an intervention silently waits in a
page the person is no longer watching.

**Independent Test**: Close the browser, force a `NEEDS_ATTENTION` transition, observe exactly one
notification attempt and use its authenticated deep link to make the narrow decision.

**Acceptance Scenarios**:

1. **Given** an active case enters `NEEDS_ATTENTION`, **When** the intervention is persisted, **Then**
   one notification record is created and one bounded delivery is attempted for that logical event.
2. **Given** a task or webhook is replayed, **When** the same notification is requested, **Then** no
   duplicate external notification is sent.
3. **Given** notification delivery is accepted, bounced or fails, **When** the owner views the case,
   **Then** transport status is distinguished from the case result and can be retried safely where
   allowed.
4. **Given** a notification link is forwarded, **When** another person opens it, **Then** sign-in and
   ownership checks prevent control or disclosure.

---

### User Story 4 - Make a narrow intervention (Priority: P1)

When ActionOS needs judgment, the owner sees one concrete question with its consequence. They can
resume, stop, dispute a claimed result, or correct an authority-changing fact through a new approval.

**Why this priority**: A general chat or admin dashboard would hide the product’s safety advantage;
bounded decisions keep the agent useful and controllable.

**Independent Test**: Trigger evidence conflict, resolve the named field, verify a new plan version
and approval are required, and confirm the old approval cannot execute.

**Acceptance Scenarios**:

1. **Given** missing or conflicting proof, **When** the owner opens the case, **Then** one primary
   decision and its evidence are shown before technical detail.
2. **Given** the owner changes recipient, outcome, amount, deadline or proof requirement, **When**
   they continue, **Then** ActionOS creates a new plan version and requires explicit reapproval.
3. **Given** the owner stops the case, **When** a late task or reply arrives, **Then** it cannot resume
   external action or silently close the case.
4. **Given** ActionOS reports a supported result, **When** the owner selects “This is not resolved”,
   **Then** the case reopens with the dispute recorded and no automatic authority expansion.

---

### User Story 5 - See why this is an agent (Priority: P2)

A judge or curious owner can expand “How ActionOS ran” to inspect a redacted chain from Gemini
extraction through durable task, external transport, reply authentication, deterministic verifier,
notification and stored result.

**Why this priority**: The strongest architecture is currently invisible, making Gemini look like a
form filler and the real email pilot look simulated.

**Independent Test**: Trace one synthetic case with a single correlation identity across every real
persisted step while confirming that raw content, addresses and secrets are absent.

**Acceptance Scenarios**:

1. **Given** an owned synthetic case, **When** the technical drawer opens, **Then** it shows actual
   persisted stages and statuses, not decorative boxes or inferred events.
2. **Given** a non-synthetic case or non-owner, **When** technical evidence is requested, **Then**
   sensitive data is redacted or access is denied.
3. **Given** a weak acknowledgement followed by sufficient proof, **When** the judge inspects the
   chain, **Then** the rejected and accepted verification decisions are both visible with reason codes.

---

### User Story 6 - Export a safe case summary (Priority: P2)

An owner can copy or download a redacted summary for their records without sharing control of the
case or exposing opaque internal identifiers.

**Why this priority**: People often need to retain or escalate evidence, but arbitrary share links
would weaken the ownership boundary.

**Independent Test**: Export a completed case and confirm it contains the promise, safe conversation
summary, supported result and limitation, but no control token, raw artifact, secret or full address.

**Acceptance Scenarios**:

1. **Given** an owned case, **When** the owner exports it, **Then** the artifact is redacted,
   timestamped and clearly distinguishes company statements from ActionOS verification.
2. **Given** a recipient reads an exported artifact, **When** they try its identifiers against the
   app, **Then** they gain no case access or control.

### Edge Cases

- Anonymous identity already linked to a different recoverable account.
- Existing recoverable account owns earlier cases while the current anonymous browser owns a draft.
- Sign-in is cancelled or fails after corrections but before external action.
- Owner opens the same activation or intervention in two tabs or devices concurrently.
- Notification is accepted by the provider but later bounces or is complained about.
- Company reply has a valid provider webhook but wrong sender, thread or required facts.
- Company reply contains prompt injection, quoted history, attachments or excessive content.
- Managed email becomes unhealthy after approval but before send.
- Case is deleted, stopped or reopened while a task, reply or notification is in flight.
- Timeline contains old records created before channel-aware projections existed.
- Network is offline or polling fails; the last known state must remain visible with retry.
- Case list grows beyond the first page or contains no cases.

## Requirements

### Functional Requirements

#### Identity and ownership

- **FR-001**: The system MUST allow anonymous exploration and draft creation without claiming that
  anonymous browser identity is recoverable.
- **FR-002**: The system MUST require recoverable identity before the first real external action.
- **FR-003**: Linking a previously unused recoverable credential MUST preserve the anonymous UID,
  current draft, corrections and plan version. A credential already owned by another UID MUST fail
  closed without transfer or merge.
- **FR-004**: The system MUST support returning on another browser after authentication without a
  bearer case URL.
- **FR-005**: Every list, detail, intervention, export and technical-evidence read MUST enforce owner
  isolation server-side.
- **FR-006**: Conflicting identity-link attempts MUST fail closed without automatic ownership
  migration and explain that the person must sign in to the existing account and recreate/import the
  unexecuted draft.

#### My follow-ups

- **FR-007**: The global navigation MUST expose “My follow-ups” when identity is available and an
  understandable sign-in/access action otherwise.
- **FR-008**: The case inbox MUST group or filter cases into `Needs you`, `Working` and `Done` using
  human labels rather than lifecycle codes.
- **FR-009**: Each case card MUST show company, promised outcome, last meaningful activity, next
  step and whether owner action is required.
- **FR-010**: The case list MUST be owner-scoped, bounded, stably ordered and paginated.
- **FR-011**: Empty, loading, offline, partial-error and retry states MUST preserve orientation and
  never replace known-good data with an unhelpful generic error.

#### Case detail and conversation

- **FR-012**: The first viewport of case detail MUST answer: current state, what happened, what
  happens next and whether the owner must act.
- **FR-013**: The case projection MUST be channel-aware; managed email, controlled sandbox and future
  unavailable adapters MUST never share misleading labels.
- **FR-014**: Managed-email detail MUST present a bounded conversation summary with direction,
  timestamp, delivery/receipt status and safe content evidence.
- **FR-015**: The system MUST explain insufficient evidence in plain language and identify the exact
  missing or conflicting fields without filling them from the approved plan.
- **FR-016**: Completed detail MUST compare promised and observed fields and show the highest
  evidence level actually verified plus its explicit limitation.
- **FR-017**: Transport acceptance/delivery MUST remain separate from reply authenticity, evidence
  sufficiency and case completion.
- **FR-018**: Technical hashes, correlation IDs, provider IDs and reason codes MUST live behind
  progressive disclosure rather than dominate consumer views.
- **FR-019**: The case view MUST display last refresh time, retain last known state during network
  failure and offer a bounded retry.

#### Return and notification

- **FR-020**: `NEEDS_ATTENTION`, supported completion and terminal execution failure MUST each create
  a deduplicated notification record tied to the logical event.
- **FR-021**: A notification record MUST distinguish planned, attempted, provider-accepted,
  delivered where observable, bounced, suppressed and failed states.
- **FR-022**: Notification content MUST contain minimal information and an authenticated deep link;
  it MUST NOT embed raw documents, full evidence or case-control authority.
- **FR-023**: Notification retries MUST be bounded and idempotent, and suppression/bounce state MUST
  stop unsafe repeated sends.
- **FR-024**: Notification status and the destination in redacted form MUST be visible to the owner.

#### Intervention and control

- **FR-025**: Each intervention MUST present one narrow decision, the reason it is needed and the
  consequence of each available choice.
- **FR-026**: Stop, resume and dispute actions MUST be idempotent and safe under concurrent devices.
- **FR-027**: Any change that expands or changes external authority MUST create a new canonical plan
  version and require a new approval before execution.
- **FR-028**: Late events after stop, delete or superseding approval MUST be recorded safely but MUST
  NOT revive action or incorrectly complete the case.

#### Judge evidence and export

- **FR-029**: The technical evidence view MUST derive only from persisted records and label missing
  telemetry as missing rather than infer it.
- **FR-030**: Technical evidence MUST redact message content, full addresses, secrets and raw
  artifacts, and remain owner/synthetic-case gated.
- **FR-031**: A safe export MUST distinguish promise, company statement, ActionOS decision and claim
  limitation while granting no control or authenticated access.

#### Product truth and scope

- **FR-032**: Public UI, README, architecture, compliance and demo copy MUST describe the deployed
  channel capability consistently and cite evidence for real-email claims.
- **FR-033**: The product MUST call the active real-email path a controlled pilot and MUST NOT claim
  arbitrary-company, global, settlement, delivery or universal-channel support.
- **FR-034**: Gmail inbox access, WhatsApp, arbitrary web forms, bank access, public recipient
  discovery, enterprise analytics and unrestricted sharing MUST remain out of this feature.
- **FR-035**: All consumer screens MUST be keyboard operable, preserve focus after mutations, announce
  meaningful state changes without per-second live-region noise, reflow at 200%, and respect reduced motion.

### Key Entities

- **Recoverable Identity**: Authenticated owner that can reopen cases across devices; linked from an
  anonymous session without weakening ownership.
- **Case Summary**: Owner-scoped projection for the inbox: human status, company, outcome, last
  activity, next step and attention flag.
- **Conversation Entry**: Redacted projection of an outbound action or inbound company reply, its
  transport/authenticity status and evidence interpretation.
- **Notification Delivery**: One logical return event with idempotency identity, destination hash,
  transport lifecycle and deep-link target.
- **Intervention Decision**: A bounded owner choice raised from a specific reason and case version.
- **Outcome Comparison**: Promised versus observed fields, evidence level, provenance and limitation.
- **Technical Run Projection**: Redacted ordered view of real model, task, action, evidence and
  notification records for an owned synthetic case.
- **Case Export**: Static redacted summary that contains no access or control capability.

## Success Criteria

Targets below are acceptance targets, not achieved metrics until the named tests or human study run.

### Measurable Outcomes

- **SC-001**: An owner can recover an existing case in a clean browser in under 60 seconds without
  copying a case identifier.
- **SC-002**: In deterministic browser tests, 100% of non-owner list/detail/control/export requests
  disclose no case facts.
- **SC-003**: A person can identify status, next step and whether they must act from a case card in
  under 10 seconds in the future human usability study; synthetic audits cannot satisfy this target.
- **SC-004**: 100% of `NEEDS_ATTENTION`, completion and terminal-failure events in the test matrix
  create exactly one logical notification record despite task/webhook replay.
- **SC-005**: Zero weak acknowledgements in the published adversarial corpus are shown as resolved.
- **SC-006**: Every managed-email case screen contains zero sandbox-only labels, and every sandbox
  screen retains its disclosure.
- **SC-007**: Every completed test case exposes Promised versus Observed, evidence level and a claim
  limitation; missing evidence never appears copied from the plan.
- **SC-008**: The deployed demo can close the browser, ingest a controlled real email reply, reject
  weak proof, notify the owner and reopen the same case through “My follow-ups”.
- **SC-009**: The judge view traces one synthetic case across model, durable task, action, reply,
  verifier and notification using actual persisted records with zero raw secrets or full addresses.
- **SC-010**: Keyboard, screen-reader announcements, reduced-motion and 200% reflow tests pass on
  inbox, detail, intervention and identity flows with no critical automated accessibility violation.
- **SC-011**: The complete deterministic suite observes zero duplicate external actions and zero
  duplicate notifications under concurrent activation, task replay and webhook replay.
- **SC-012**: README, product, compliance checklist, architecture and four-minute demo agree on which
  channels are live, controlled, simulated or future, with no unsupported production claim.

## Assumptions

- The first recoverable method will use the project’s existing Firebase Authentication boundary;
  the technical plan selects the safest low-friction provider and linking flow.
- Anonymous mode remains sufficient for accelerated sandbox judging, but real email requires a
  recoverable owner.
- The controlled pilot keeps recipient domains/mailboxes allowlisted; this feature does not open
  ActionOS as an arbitrary outbound-email platform.
- Resend remains the managed email transport because its real controlled path already passed send,
  signed webhook and inbound false-DONE gates. Google technology remains central to model,
  orchestration, durable execution, state and identity.
- Existing cases remain readable through a backward-compatible projection even when older events
  lack newly introduced display fields.
- English remains the judging interface; content may include the already tested Spanish promise.
- Human usability targets stay explicitly unverified until real consented sessions occur.

## Out of Scope

- Enterprise dashboards, organizations, teams or role administration.
- General-purpose email client, arbitrary chat or autonomous negotiation.
- Gmail inbox scopes, WhatsApp Business, SMS, push notifications or native mobile apps.
- Arbitrary web browsing, CAPTCHA solving, scraping or public company-contact discovery.
- Bank settlement verification, package delivery confirmation or legal escalation.
- Public read links that can reveal live case data; revocable sharing may be specified later.
