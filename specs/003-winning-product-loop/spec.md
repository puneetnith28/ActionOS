# Feature Specification: Winning Product Loop

**Feature Branch**: `003-winning-product-loop`

**Created**: 2026-08-17

**Status**: Ready for planning

**Input**: Close the ten audited DueBack product and judging gaps with an editable review,
resumable analysis, accelerated complete demo, visible evidence console, safe controlled real email,
recoverable identity, truthful return path, live timeline, real-model evaluation, and submission gates.

## Product Decision

DueBack remains the product and `Proof of Done` remains the differentiator. This feature does not
add more nominal recipes or claim universal company access. It closes one understandable loop:

`share evidence → correct the contract → approve a reachable channel → leave → observe autonomous
work → reject weak evidence → accept sufficient evidence → return to an exact, limited result`.

The public product MUST distinguish two modes before activation:

- **Accelerated Demo** proves the complete protocol through a controlled counterparty in seconds.
- **Controlled Real Pilot** contacts only an explicitly authorized, allowlisted test mailbox after
  every outbound, inbound, identity, authenticity and false-completion gate passes.

The accelerated demo is a real deployed execution with compressed time, not a prerecorded or
hard-coded UI animation. The controlled pilot is not a claim that DueBack can contact any company.

## Ten Audited Workstreams

| # | Gap to close | Required product outcome |
| --- | --- | --- |
| 1 | Examples stop at future `SCHEDULED` states | Every visible demo example reaches an inspectable result during one session |
| 2 | Demo and real capability are mixed | The person chooses an honestly labeled execution mode before approval |
| 3 | Extracted facts cannot be corrected | All action-authorizing facts are editable and versioned |
| 4 | No real contact boundary is demonstrated | One allowlisted bidirectional email route passes explicit readiness gates |
| 5 | Review is a long technical console | Approval answers five consumer questions with progressive disclosure |
| 6 | Autonomy and Google Cloud are hidden | A user-safe timeline and judge evidence console expose real durable events |
| 7 | Intake blocks for 15–25 seconds | Analysis becomes durable, resumable and cancellable |
| 8 | Return path is fragile and browser-bound | Recoverable identity, case history and truthful notification state exist |
| 9 | Inbound email can manufacture matching evidence | Missing facts remain missing; authentication and deterministic proof are fail-closed |
| 10 | Gemini value and submission readiness are weak | Live-model evaluation and every mandatory submission artifact have evidence gates |

## User Scenarios & Testing

### User Story 1 - Complete an Accelerated Demo (Priority: P1)

A first-time visitor selects any visible example or supplies synthetic evidence, chooses
`Accelerated Demo`, approves a short plan, closes or backgrounds the page, and returns to a live
timeline showing one action, an insufficient acknowledgement, a bounded retry and sufficient
evidence. The result states exactly what was verified and what was not.

**Why this priority**: The current public examples end before the product produces value. A judge
must see the entire differentiating loop without waiting days or reading source code.

**Independent Test**: Run each visible example in a new production browser session with retries
disabled. Each must reach a terminal or actionable result in under 90 seconds and expose persisted
events proving that the UI did not fabricate progress.

**Acceptance Scenarios**:

1. **Given** any visible example, **When** Accelerated Demo is activated, **Then** its approved times
   are compressed and visibly labeled without changing the semantic order of events.
2. **Given** the page is closed after approval, **When** the controlled counterparty acknowledges
   and later confirms the outcome, **Then** durable work continues and reopening the owned case
   shows the complete timeline.
3. **Given** a `REQUEST_ACKNOWLEDGED` event, **When** it is verified, **Then** the case remains open
   and the missing proof is explained.
4. **Given** matching sufficient evidence, **When** deterministic verification accepts it, **Then**
   the case reaches only the supported evidence level and displays its limitation.
5. **Given** duplicate worker tasks or callbacks, **When** the demo completes, **Then** the timeline
   shows one logical action and one logical completion.

---

### User Story 2 - Correct What Gemini Understood (Priority: P1)

The person reviews a compact, editable contract containing company, desired outcome, reference,
amount or item, promised date, follow-up time, contact target and completion proof. Every field links
to its source citation or identifies itself as user-supplied. Changing a field updates the plan
version and invalidates older approval.

**Why this priority**: Delegation is unsafe and frustrating when the product says “correct
anything” but shows read-only facts.

**Independent Test**: Inject a contradictory amount and an incorrect date, correct both using only
keyboard controls, verify a new version and hash, and prove that the previous version cannot be
approved or executed.

**Acceptance Scenarios**:

1. **Given** a clear extraction, **When** review opens, **Then** every action-authorizing field has
   an obvious edit action without opening technical details.
2. **Given** uncertain, missing or contradictory evidence, **When** review opens, **Then** only the
   fields needing attention are emphasized and activation remains blocked.
3. **Given** a correction, **When** it is saved, **Then** the field is marked user-confirmed, the
   plan version changes and a live region announces the update without losing focus.
4. **Given** an approved version, **When** an authorizing field changes, **Then** the old approval is
   unusable and the person must approve the new visible version.

---

### User Story 3 - Approve in Plain Language (Priority: P1)

The person approves a short decision summary answering: what will DueBack ask for, whom will it
contact, when may it act, what may it share, and what exact evidence will bring the result back.
Channel internals, hashes, headers and architecture remain available under progressive disclosure.

**Why this priority**: The current review is several viewports long and makes a consumer parse
implementation details before receiving value.

**Independent Test**: At a 390×844 viewport, a person can inspect the five decision blocks, preview
the first action, understand demo versus pilot, authorize and activate without needing technical
accordions or horizontal scrolling.

**Acceptance Scenarios**:

1. **Given** one executable channel, **When** review opens, **Then** unavailable future channels do
   not compete visually with the active choice.
2. **Given** Accelerated Demo, **When** approval is requested, **Then** the controlled recipient and
   “no real company” limitation are stated once, close to the mode choice.
3. **Given** Controlled Real Pilot, **When** approval is requested, **Then** exact sender, recipient,
   reply route, message, data, cadence and authenticity limitations are visible.
4. **Given** any plan, **When** `Preview first action` is selected, **Then** no external action occurs
   and the inserted preview is announced accessibly.

---

### User Story 4 - Start Analysis and Leave (Priority: P1)

Submitting evidence creates an owned `ANALYZING` case immediately. Analysis runs durably, reports
persisted stages, survives refresh or deployment, and ends in review, actionable failure or safe
cancellation without losing the submitted evidence contract.

**Why this priority**: A long synchronous request feels frozen and hides the Taskmaster architecture.

**Independent Test**: Make the model gateway hang, fail once and recover, refresh during analysis,
and redeliver the processing task. The same case must resume without duplicate model work beyond
the approved budget and without losing its input metadata.

**Acceptance Scenarios**:

1. **Given** valid text or file evidence, **When** it is submitted, **Then** an owned case URL and
   persisted `EVIDENCE_SECURED` state return within two seconds under normal service conditions.
2. **Given** analysis is running, **When** the page refreshes or closes, **Then** reopening the case
   shows the real last persisted stage and continues polling or streaming bounded updates.
3. **Given** a retryable model failure, **When** the task retries, **Then** the case records the
   attempt and reaches review without creating a second case.
4. **Given** timeout, budget exhaustion, invalid schema or non-retryable input, **When** processing
   stops, **Then** the UI explains the safe next action and preserves recoverable inputs.
5. **Given** cancellation before execution, **When** cancellation wins the state transition, **Then**
   no later model result or task may reactivate the case.

---

### User Story 5 - See the Agent Work and Return Only When Needed (Priority: P1)

After activation, the case page becomes a concise live timeline. It shows scheduled work, action
attempts, transport receipts, insufficient evidence, retries, decisions and accepted proof. The
person can stop the case, supply new evidence, dispute completion or intervene.

**Why this priority**: The architecture is strong but invisible; the product currently provides no
immediate emotional or operational reward after approval.

**Independent Test**: Activate an overdue accelerated case, observe updates without refresh, close
the page, then reopen from case history and verify the same ordered event ledger and controls.

**Acceptance Scenarios**:

1. **Given** an active case, **When** any persisted event arrives, **Then** the user timeline updates
   with human language, time, state and consequence.
2. **Given** a weak reply, **When** it is rejected, **Then** the timeline states why and what DueBack
   will do next rather than exposing only a reason code.
3. **Given** a terminal result, **When** it is displayed, **Then** `what was verified`, `what was not
   verified`, evidence source and `This is not resolved` control are visible.
4. **Given** the person stops or disputes a case, **When** a late task or callback arrives, **Then**
   it cannot silently resume external action or restore `DONE`.

---

### User Story 6 - Recover the Case Across Devices (Priority: P1)

A person may explore anonymously, but must establish a recoverable identity before activating work
or configuring notifications. The person can open a small case history and follow a deep link from
a truthful notification on another device.

**Why this priority**: “Close the tab and we will bring you back” is not credible when ownership is
bound only to one anonymous browser.

**Independent Test**: Create a draft anonymously, link it to an approved recoverable identity,
activate it, open the result link in a clean browser, authenticate and access exactly the owned case.

**Acceptance Scenarios**:

1. **Given** an anonymous draft, **When** the person activates, **Then** authentication is requested
   only after value is shown and ownership is atomically linked without duplicating the case.
2. **Given** another browser, **When** the owner authenticates, **Then** owned active and recent cases
   are available while cross-owner identifiers remain inaccessible.
3. **Given** notification delivery is unavailable, **When** a case changes, **Then** the in-app
   notification still exists and the UI does not claim an email was sent.
4. **Given** a notification is accepted, delivered, bounced or suppressed, **When** status changes,
   **Then** its exact transport state is visible and never controls case completion.

---

### User Story 7 - Prove One Controlled Real Conversation Safely (Priority: P2)

A judge can inspect an optional Controlled Real Pilot between verified, allowlisted mailboxes. The
same approved envelope crosses a real email provider, a real reply returns through the configured
inbound route, and only facts explicitly present in authenticated content become evidence candidates.

**Why this priority**: A real transport boundary removes the perception that all value is circular,
but it must not compromise the deterministic sandbox or enable arbitrary outreach.

**Independent Test**: Send from a verified DueBack sender to one controlled mailbox, reply first
without the amount/reference and then with complete matching evidence, and verify that only the
second reply can satisfy the requirement.

**Acceptance Scenarios**:

1. **Given** any readiness gate is false, **When** channels are queried, **Then** Managed Email is
   unavailable and cannot be approved.
2. **Given** a recipient outside the explicit allowlist, **When** it is entered, **Then** the plan
   remains blocked before any provider call.
3. **Given** a signed provider webhook, **When** content is processed, **Then** provider authenticity,
   expected sender/thread and message facts are evaluated separately.
4. **Given** amount, currency, reference, subject, bill period or tracking is absent from the reply,
   **When** a candidate is built, **Then** each absent field remains absent and verification fails
   closed; expected plan values MUST NOT be copied into evidence.
5. **Given** provider authentication but an unexpected counterparty sender, **When** a reply arrives,
   **Then** it cannot satisfy proof and produces a reviewable intervention.
6. **Given** replacement evidence, **When** tracking or subject is missing, **Then** the case remains
   open even when the message says “completed”.

---

### User Story 8 - Inspect Winning Evidence (Priority: P2)

Judge mode exposes a read-only, redacted Evidence Console for the current synthetic case. It links
user-visible events to Gemini usage, durable tasks, action authorization, idempotency, receipts,
verification and Cloud deployment without revealing secrets or raw personal content.

**Why this priority**: The best architecture currently exists only in the repository. Judges must
understand it during a four-minute unedited video.

**Independent Test**: Complete the accelerated refund path and use the console to trace one
correlation identity from intake through final proof, including one rejected acknowledgement and
one deduplicated delivery.

**Acceptance Scenarios**:

1. **Given** a synthetic demo case, **When** Evidence Console opens, **Then** it shows model name,
   latency, usage, case/task/action/event identifiers, policy decision, receipt and verifier result.
2. **Given** raw text, addresses, tokens, signatures or full prompts, **When** console data is built,
   **Then** those values are absent or safely redacted.
3. **Given** an event shown in the console, **When** its details are expanded, **Then** it cites a
   persisted record and does not fabricate a progress stage.
4. **Given** judge mode is disabled or the case is not an owned synthetic demo, **When** console is
   requested, **Then** access is denied.

---

### User Story 9 - Make Gemini Indispensable and Measurable (Priority: P2)

Gemini compares multiple supplied sources, preserves exact citations, surfaces contradictions,
classifies uncertainty and proposes the smallest clarification. It never authorizes tools or owns
completion. A versioned live-model evaluation reports field accuracy, provenance, uncertainty,
latency, cost and failures separately from deterministic fixtures.

**Why this priority**: Current judging can interpret Gemini as replaceable form filling.

**Independent Test**: Run a published synthetic corpus containing clear, Spanish, contradictory,
missing-field, image, PDF and hostile cases against the configured live model and produce a dated
machine-readable report without retrying failures into green results.

**Acceptance Scenarios**:

1. **Given** text and image sources disagree, **When** Gemini extracts them, **Then** both citations
   and a contradictory state are visible; no arbitrary winner is selected.
2. **Given** one necessary field is missing, **When** clarification is generated, **Then** the UI
   asks only for that field and does not invent it.
3. **Given** hostile instructions in source content, **When** Gemini processes it, **Then** extracted
   data cannot expand plan authority or invoke a tool.
4. **Given** a live evaluation run, **When** results are published, **Then** model/version/config,
   date, corpus version, denominators, latency, token usage, estimated cost and every failure remain.

---

### User Story 10 - Submit a Reproducible Entry (Priority: P1)

The participant can complete a release checklist that refuses unsupported claims and links every
mandatory submission item to inspectable evidence.

**Why this priority**: A technically strong product cannot be judged if repository, video,
eligibility or Devpost gates remain incomplete.

**Independent Test**: Run the release audit against the final commit and verify that it fails until
eligibility confirmation, judge repository access, public video, English accessibility, deployed
URL, architecture, Google Cloud evidence and Devpost fields are supplied.

**Acceptance Scenarios**:

1. **Given** a missing mandatory artifact, **When** release readiness is checked, **Then** submission
   remains visibly blocked and no placeholder is treated as evidence.
2. **Given** the video script, **When** rehearsed against production, **Then** one continuous run
   completes in at most four minutes and shows problem, Gemini, approval, autonomous action,
   rejected evidence, retry/dedupe, accepted proof and Google Cloud records.
3. **Given** any claim about email, users or metrics, **When** submission copy is audited, **Then** it
   is included only if the corresponding gate has verifiable evidence.

## Edge Cases

- Two tabs submit identical evidence before either receives the case URL.
- The artifact is secured but task enqueue fails, or enqueue succeeds before the response fails.
- A model attempt completes after the case was cancelled, deleted or superseded.
- A correction races with approval or a scheduled task using the old plan version.
- The demo clock is accelerated but an event contains wall-clock time from another service.
- The controlled counterparty is unavailable, returns malformed evidence or never sends the second event.
- A user selects Real Pilot and its health changes between review and execution.
- Authentication linking succeeds but notification setup fails, or vice versa.
- A deep link opens in a browser with a different anonymous identity before sign-in.
- An inbound message quotes expected values from the previous thread without asserting completion.
- A valid provider webhook contains a spoofed display name, unexpected From, forwarded content or failed authentication result.
- An email reply confirms a refund but omits reference, amount or currency.
- A replacement reply supplies a tracking-like string for a different product.
- A callback is validly signed but belongs to another case, owner, plan version or expired demo run.
- Evidence Console records are missing, delayed, duplicated, redacted incorrectly or cross-tenant.
- Model evaluation hits quota, timeout, schema failure or content safety rejection.
- Notification is accepted by a provider but never delivered, bounces after completion or is opened cross-device.
- The participant has not confirmed sanctions/conflicts or repository/video access before release.

## Requirements

### Functional Requirements

#### Mode and Complete Demo

- **FR-001**: The product MUST present `Accelerated Demo` and `Controlled Real Pilot` as distinct
  execution modes before activation and MUST describe their actual external effects.
- **FR-002**: Accelerated time MUST be explicitly labeled in review, timeline, Evidence Console and video.
- **FR-003**: Every visible example MUST support a complete accelerated journey to an inspectable
  terminal or actionable state during one judging session.
- **FR-004**: Demo acceleration MUST alter scheduling only; it MUST NOT bypass approval, policy,
  action transport, persistence, callback authentication, verification or deduplication.
- **FR-005**: The demo MUST be resettable only for an exact synthetic case through a scoped,
  authenticated and recoverable operation.

#### Editable Review and Approval UX

- **FR-006**: Company, outcome, amount/currency or item, reference, promised date, follow-up time,
  recipient and evidence requirement MUST be editable before activation.
- **FR-007**: Each extracted fact MUST expose source provenance and uncertainty; each correction MUST
  expose that it was supplied by the person.
- **FR-008**: Every action-authorizing correction MUST create a new canonical plan version and
  invalidate prior approval.
- **FR-009**: Review MUST prioritize five plain-language decisions: request, recipient/channel,
  timing, shared data/limits and completion proof/return path.
- **FR-010**: Unavailable and future channels MUST NOT appear as selectable peers of an available
  channel; their roadmap status MAY appear under progressive disclosure.
- **FR-011**: Technical identifiers, headers, hashes and adapter internals MUST be collapsed by default.
- **FR-012**: All edit, preview, approval, error and status changes MUST be keyboard-operable,
  focus-managed and announced without per-second live-region updates.

#### Durable Intake

- **FR-013**: Intake MUST create and return an owned `ANALYZING` case before invoking Gemini.
- **FR-014**: Artifact validation, case creation, processing reservation and task enqueue MUST have
  explicit recovery for every partial-failure ordering.
- **FR-015**: Analysis stages MUST derive from persisted events and MUST include at least evidence
  secured, extraction running, deterministic validation, review ready, recoverable failure and cancelled.
- **FR-016**: Analysis MUST survive refresh, tab closure, process restart and deployment.
- **FR-017**: Model calls MUST have per-attempt deadlines, retry only eligible failures, reserve
  budget before execution and preserve observed usage/latency/error state.
- **FR-018**: Duplicate intake or processing delivery MUST NOT create duplicate cases or unbounded
  model calls for the same reserved work.
- **FR-019**: The person MUST be able to cancel analysis; later task or model completion MUST fail
  closed against the current version/state.
- **FR-020**: Errors MUST preserve recoverable user input and explain retry, correction, size/type
  change or support action as applicable.

#### Live Case and Return Path

- **FR-021**: The case page MUST project persisted events into a human-readable live timeline with
  next action, timing, attempts, result and available controls.
- **FR-022**: The timeline MUST distinguish scheduling, authorization, transport, acknowledgement,
  commitment, sufficient proof, retry, intervention and terminal result.
- **FR-023**: Weak evidence MUST show why it failed and the next bounded behavior.
- **FR-024**: Terminal result copy MUST state exact verified level and limitations and MUST offer
  dispute/reopen where safe.
- **FR-025**: Explore MAY remain anonymous, but activation and notification configuration MUST use
  a recoverable owner identity.
- **FR-026**: Identity linking MUST preserve ownership atomically and prevent duplicate/cross-owner cases.
- **FR-027**: An authenticated person MUST have a minimal owned-case history and cross-device deep-link recovery.
- **FR-028**: Notification records MUST exist independently of delivery and expose accepted,
  delivered, bounced, suppressed, failed or unavailable states truthfully.
- **FR-029**: Stop, revoke, delete and dispute MUST prevent late events from silently resuming work
  or restoring a disputed terminal claim.

#### Controlled Real Email and False-DONE Safety

- **FR-030**: Managed Email MUST remain unavailable unless verified sender, exact reply domain,
  inbound webhook, controlled recipient allowlist, secret access and deployed smoke health all pass.
- **FR-031**: Public/pilot email MUST reject arbitrary recipients and bulk outreach and MUST enforce
  owner, case, recipient, domain and send budgets.
- **FR-032**: Provider webhook authentication MUST prove provider delivery only; counterparty
  sender/thread authenticity and evidence sufficiency MUST be evaluated separately.
- **FR-033**: Evidence candidates MUST contain only facts explicitly supported by the normalized
  inbound message and permitted authenticated metadata.
- **FR-034**: Missing evidence fields MUST remain absent. The system MUST NOT copy expected plan
  values into an evidence candidate.
- **FR-035**: Refund evidence missing amount, currency or reference MUST fail deterministic verification.
- **FR-036**: Replacement evidence missing subject or tracking MUST fail deterministic verification.
- **FR-037**: Unexpected sender, ambiguous thread, forwarded assertion, quoted-only content,
  auto-reply or authentication failure MUST NOT close a case.
- **FR-038**: A model interpretation MUST NOT mark authenticity, authorize action or transition lifecycle.
- **FR-039**: Bounce, complaint, suppression and permanent failure MUST stop future sends on that route.
- **FR-040**: The sandbox MUST remain the deterministic fallback and MUST never be described as a real company.

#### Evidence Console and Gemini Evaluation

- **FR-041**: Judge mode MUST expose a read-only redacted Evidence Console for owned synthetic demo cases.
- **FR-042**: The console MUST correlate persisted Gemini, task, policy, action, receipt, callback,
  verification and notification records without exposing raw secrets or personal content.
- **FR-043**: UI progress MUST NOT appear in the console unless backed by a persisted event or record.
- **FR-044**: Gemini MUST preserve citations and uncertainty across multiple supplied sources and
  surface contradictions rather than silently choosing one.
- **FR-045**: Gemini MAY propose the smallest clarification but MUST remain tool-less at extraction
  boundaries and unable to authorize or finish a case.
- **FR-046**: A separate live-model evaluation MUST publish corpus/model/config/date, denominators,
  field/provenance/uncertainty results, latency, usage, estimated cost and failures.
- **FR-047**: Deterministic corpus results MUST remain clearly separate from live-model results.

#### Submission and Honest Claims

- **FR-048**: Release readiness MUST fail while eligibility confirmation, judge repository access,
  public video, English accessibility, deployed URL, architecture evidence or Devpost fields are missing.
- **FR-049**: The final production rehearsal MUST execute with retries disabled and record failures
  rather than hiding them through reruns.
- **FR-050**: The demo script MUST fit one continuous four-minute run and show an actual Gemini call,
  durable work, one weak-proof rejection, retry/dedupe, accepted proof and Google Cloud evidence.
- **FR-051**: Submission claims about email, human testing, global support, delivery, settlement or
  model metrics MUST be gated by corresponding evidence and exact limitations.
- **FR-052**: Repository, docs and video MUST identify sandbox, controlled pilot, fixtures, synthetic
  data and unimplemented capability consistently.

### Key Entities

- **ExecutionMode**: `ACCELERATED_DEMO` or `CONTROLLED_REAL_PILOT`, with capability, timing policy,
  counterparty boundary and disclosure version.
- **AnalysisJob**: Durable intake processing identity with case, artifact grants, stage, attempt,
  model reservation, deadline, result/error and cancellation state.
- **EditablePromiseContract**: Versioned user-facing facts, citations, uncertainty, corrections,
  contact target and evidence requirements.
- **CaseOwner**: Recoverable authenticated identity and any atomically linked anonymous draft identity.
- **CaseEvent**: Append-only lifecycle fact used to project timeline and evidence console.
- **NotificationRecord**: User-return intent and exact transport status independent of case completion.
- **EmailReadiness**: Fail-closed capability gate covering sender, reply route, inbound, allowlist,
  secrets and smoke health.
- **InboundEvidenceCandidate**: Explicit message-supported facts plus separate provider, sender and
  thread authentication assessments.
- **EvidenceConsoleProjection**: Redacted read-only correlation of persisted records for one owned
  synthetic case.
- **LiveModelEvaluationRun**: Versioned corpus/model/config with per-case outputs, failures, latency,
  usage and cost observations.
- **ReleaseGate**: Mandatory submission claim or artifact, evidence reference, status and blocker.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All four visible examples complete their production accelerated journey from button
  click to inspectable result with 4/4 passes, one worker and zero retries.
- **SC-002**: The accelerated primary judge path completes in at most 90 seconds of wall-clock time
  and the narrated continuous video completes in at most four minutes.
- **SC-003**: A valid intake returns an owned `ANALYZING` case URL within two seconds in at least 19
  of 20 controlled production measurements; observed exceptions are reported.
- **SC-004**: Refresh, tab closure and one injected retryable failure preserve one case and produce
  one reviewable plan in every deterministic resilience scenario.
- **SC-005**: The plan-version suite observes zero executions authorized by a stale approval across
  correction, approval and worker race cases.
- **SC-006**: The adversarial email corpus observes zero accepted evidence candidates whose required
  matching field was absent from the inbound content.
- **SC-007**: Duplicate task and callback tests observe zero duplicate logical external actions and
  zero duplicate logical completion notifications.
- **SC-008**: The public demo observes one insufficient acknowledgement rejected and one sufficient
  proof accepted with inspectable persisted reason codes.
- **SC-009**: Cross-device ownership tests permit every owned case and deny every cross-owner case in
  the published deterministic matrix.
- **SC-010**: Automated accessibility checks report zero serious/critical violations on intake,
  analyzing, review, active timeline and result; keyboard tests complete the primary path.
- **SC-011**: The live-model report includes every attempted case and publishes failures, model
  identity, corpus version, date, latency, usage and cost without claiming deterministic fixtures as calls.
- **SC-012**: Release readiness reports every mandatory hackathon and Devpost gate complete with a
  verifiable reference before final submission; placeholders do not pass.

Targets are not results. No success criterion may be reported as achieved until its referenced
execution artifact exists.

## Assumptions

- The submission remains in Taskmaster and continues to target Individual/Hobbyist.
- The controlled sandbox remains available even if real-email gates cannot be completed safely.
- Only controlled test mailboxes are authorized during the hackathon; arbitrary companies remain out of scope.
- Firebase/Google identity can provide recoverable ownership without requiring a paid account.
- English remains the judging UI; Spanish source understanding is evaluated but full localization is P2 after the winning loop.
- The four current visible examples remain the public demo matrix, but their schedules become
  mode-derived instead of depending on fixed future calendar dates.
- Existing runtime boundaries—model extraction, deterministic policy/verifier, adapters,
  persistence and workers—are extended rather than rewritten.

## Non-Goals

- Contact discovery for arbitrary companies.
- Public arbitrary-recipient email, WhatsApp, Gmail inbox access, web-form automation or browsing.
- Bank settlement verification, delivery verification, legal escalation, chargebacks or payments.
- A universal workflow builder, marketplace, pricing system or multi-tenant enterprise console.
- Claiming worldwide availability, production email, real users or human-study metrics without evidence.
- Adding more recipes before the complete refund/replacement/document demo loop passes.

## Dependencies and Release Order

1. **Safety blocker**: remove expected-value evidence fallback and add adversarial proof tests.
2. **Winning demo blocker**: accelerated mode plus complete examples and live timeline.
3. **Consumer blocker**: editable compact review and durable analyzing state.
4. **Return blocker**: recoverable identity, case history and truthful notifications.
5. **Judge clarity**: Evidence Console and live-model evaluation.
6. **Optional credibility**: Controlled Real Pilot only after every email readiness gate passes.
7. **Submission**: repository, video, English accessibility, Google Cloud evidence and Devpost gates.

No workstream may enable Managed Email before item 1 passes. No new recipe or cosmetic redesign may
preempt items 1–4.
