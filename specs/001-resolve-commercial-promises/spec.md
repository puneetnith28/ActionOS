# Feature Specification: Resolve Commercial Promises

**Feature Branch**: `001-resolve-commercial-promises`

**Created**: 2026-08-15

**Status**: Ready for implementation

**Input**: User description: "Build ActionOS, a personal reverse CRM that keeps commercial promises
open until approved evidence proves the promised refund, credit, replacement, or correction."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Capture and Approve a Promise (Priority: P1)

A non-technical person shares an email, PDF, image, screenshot, or text containing a commercial
promise. ActionOS identifies the promise and presents a plain-language Resolution Plan before any
external action occurs.

**Why this priority**: Without accurate capture, understandable boundaries, and informed approval,
the user cannot safely delegate the case.

**Independent Test**: Share a synthetic refund approval, review the extracted promise and its source,
modify one boundary, and activate the case without any external action occurring beforehand.

**Acceptance Scenarios**:

1. **Given** a message promising a refund with a merchant, amount, currency, reference, and deadline,
   **When** the person submits it, **Then** ActionOS drafts those fields, cites their origin, and marks
   uncertain or missing fields.
2. **Given** a draft plan, **When** the person reviews it, **Then** they can see the intended result,
   recipient, action, shared data, limits, approval boundaries, completion evidence, and expiry.
3. **Given** an unapproved or changed plan, **When** execution would otherwise begin, **Then** no
   external action occurs until the current version is explicitly approved.

---

### User Story 2 - Follow Through Without False Completion (Priority: P1)

After approval, ActionOS waits through the promised period, performs an authorized follow-up when
needed, survives recoverable failures, and closes only when the approved evidence requirements are
satisfied.

**Why this priority**: This is the central customer outcome and the difference between ActionOS and a
drafting or reminder assistant.

**Independent Test**: Run a refund case through acknowledgement, recoverable failure, duplicate
delivery, and final merchant confirmation; verify one external request and no completion before
valid evidence.

**Acceptance Scenarios**:

1. **Given** an active case whose deadline has passed without sufficient evidence, **When** it is
   evaluated, **Then** ActionOS performs only the approved follow-up and keeps the case active.
2. **Given** a response stating only that an inquiry or request was received, **When** it is
   evaluated, **Then** the case does not become complete and the missing evidence is explained.
3. **Given** duplicate execution or incoming events, **When** they are processed, **Then** no external
   action or case transition is duplicated.
4. **Given** valid merchant confirmation matching the approved result, amount, currency, reference,
   case, and provenance requirements, **When** it is evaluated, **Then** the case becomes complete
   and the person receives inspectable proof.

---

### User Story 3 - Resolve Exceptions Without Losing Control (Priority: P2)

The person is contacted only when ActionOS needs a decision, is blocked, exhausts recovery, or finds
evidence that conflicts with the approved plan. The person can supply information, change limits,
stop, expire, delete, or reopen the case.

**Why this priority**: Long-running cases inevitably encounter ambiguity and failure; handling them
without hidden autonomy is necessary for trust.

**Independent Test**: Introduce a mismatched amount and an exhausted retry, resolve the exception,
then stop and reopen the case while confirming that every action remains visible.

**Acceptance Scenarios**:

1. **Given** evidence with the wrong amount, currency, reference, or case identity, **When** it is
   evaluated, **Then** it is rejected and the case requests only the information or decision needed.
2. **Given** an action outside approved limits, **When** it is proposed, **Then** it is denied without
   contacting the counterparty.
3. **Given** an active case, **When** the person stops it, **Then** no new external action occurs and
   the stopped state is visible.
4. **Given** a completed case that the person reports as unresolved, **When** they select `This is not
resolved`, **Then** the case reopens with the previous evidence preserved in its history.

---

### User Story 4 - Reuse the Resolution Model (Priority: P3)

The same case model supports a credit promised on a future bill and a replacement promised with
tracking, without changing the core meanings of approval, waiting, evidence, completion, or audit.

**Why this priority**: Limited portability demonstrates that ActionOS is a category rather than a
single scripted refund demo, without requiring three complete products.

**Independent Test**: Create one bill-credit case and one replacement case, verify their distinct
evidence requirements, and confirm that neither can bypass the common completion rules.

**Acceptance Scenarios**:

1. **Given** a promised future bill credit, **When** the next supplied bill lacks the credit, **Then**
   the case remains open and explains the unmet promise.
2. **Given** a promised replacement, **When** a valid tracking reference tied to the case appears,
   **Then** the configured merchant-confirmed evidence requirement can be satisfied.

### Edge Cases

- The input contains multiple promises, merchants, amounts, dates, or conflicting statements.
- A promise has no explicit deadline or uses relative language such as “next cycle”.
- The person submits the same source through two channels or repeats it later.
- The source contains instructions attempting to change permissions or trigger a tool.
- An approval link is expired, reused, or refers to an older plan version.
- The counterparty changes the amount, offers store credit, adds a fee, or proposes another remedy.
- A recoverable action fails repeatedly until its retry allowance is exhausted.
- A callback is unsigned, replayed, late, out of order, or belongs to another case.
- The service restarts after an action but before recording its response.
- A case expires while waiting, is stopped during execution, or is deleted during retention.
- Evidence is authentic to the counterparty but proves only acknowledgement or approval, not the
  completion level required by the plan.
- Input is in Spanish while the person's review and judging experience is in English.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST accept pasted text, JPEG, PNG, PDF, screenshot, and uploaded or pasted
  forwarded-message content and associate every accepted input with a single case or an explicit
  duplicate. This requirement covers message content, not an inbound SMTP transport.
- **FR-002**: The system MUST identify the promising party, promised result, affected amount or
  object, currency when relevant, reference, deadline or condition, and proposed completion evidence.
- **FR-003**: Every extracted critical field MUST retain its source and an uncertainty state.
- **FR-004**: Missing or contradictory critical fields MUST prevent activation until the person
  supplies or selects an exact value and its allowed boundary; acknowledgement of uncertainty alone
  MUST NOT authorize execution.
- **FR-005**: The system MUST present a plain-language Resolution Plan containing the result,
  recipient, allowed actions, shared data, limits, approvals, evidence requirements, and expiry.
- **FR-006**: The person MUST be able to simulate, approve, revise, reject, stop, revoke, delete, and
  reopen a case as permitted by its current state.
- **FR-007**: Approval MUST apply to one identifiable plan version and MUST become invalid after the
  plan changes or the approval expires.
- **FR-008**: No external action MUST occur without approval of the current plan version.
- **FR-009**: External content MUST NOT add recipients, actions, permissions, data, spending,
  acceptance conditions, or completion requirements.
- **FR-010**: The system MUST keep active cases through waiting periods, recoverable failures,
  restarts, and deployments without requiring the person to recreate the case.
- **FR-011**: The system MUST perform only actions authorized by the current approved plan.
- **FR-012**: Repeated intake, execution, and external events MUST NOT create duplicate cases,
  external actions, notifications, or state transitions.
- **FR-013**: Every case transition and external-action attempt MUST appear in an ordered history
  with actor, time, reason, and correlation to the case.
- **FR-014**: The system MUST distinguish promise recorded, request acknowledged, merchant
  committed, merchant confirmed, and funds settled as separate evidence levels.
- **FR-015**: Acknowledgement, drafting, message delivery, request approval, and tool success MUST
  NOT independently satisfy completion.
- **FR-016**: Completion MUST require an independent verification result for every evidence
  requirement approved in the plan.
- **FR-017**: Evidence MUST be rejected when its case, amount, currency, reference, evidence level,
  freshness, or provenance does not satisfy the plan.
- **FR-018**: The system MUST create exactly one inspectable notification per relevant event when
  approval or information is required, recovery is exhausted, a material conflict appears, or the
  case reaches merchant-confirmed completion. Notifications MUST use a stable deduplication key and
  deep-link to the case. The kill-test return channel is the case experience; outbound email is the
  first optional adapter after the deployed walking skeleton passes.
- **FR-019**: A completed case MUST show the exact result claimed, supporting evidence, time elapsed,
  actions performed, and limitations of the claim.
- **FR-020**: The primary experience MUST open directly on intake, review, exception, or case result;
  it MUST NOT require routine dashboard monitoring or begin with an empty chat.
- **FR-021**: The first complete case type MUST support a merchant-confirmed refund with amount,
  currency, reference, deadline, and verifiable counterparty confirmation.
- **FR-022**: A future-bill credit and a replacement-with-tracking case MUST use the same approval,
  state, action, evidence, and audit semantics as the refund case.
- **FR-023**: Controlled counterparties, historical replays, fixtures, and unimplemented channels
  MUST be labeled wherever a person or judge could otherwise mistake them for production services.
- **FR-024**: The system MUST NOT claim funds settlement without independent settlement evidence.
- **FR-025**: The person MUST be able to inspect what personal information will be processed or
  shared before approval and request deletion of their case and source artifacts.
- **FR-026**: Product-visible history and operational records MUST avoid exposing source document
  contents or personal information beyond what is necessary for the case.
- **FR-027**: The judging path MUST work in English and correctly process at least one Spanish
  promise without changing its financial meaning.
- **FR-028**: The evaluation package MUST include normal, ambiguous, overdue, duplicate, failed,
  mismatched, and hostile cases with expected outcomes.
- **FR-029**: Reported evaluation results MUST include failures and distinguish measured results
  from goals, assumptions, and synthetic scenarios.
- **FR-030**: The product MUST expose enough evidence for another person to reproduce and verify the
  primary resolution path without paid credentials or personal data.
- **FR-031**: A person MAY explore intake before authentication, but MUST authenticate before
  activation, reading persisted case data, approval, control, or deletion. Every protected command
  and read MUST verify that the authenticated owner matches the case owner; opaque IDs alone MUST
  NOT grant access.
- **FR-032**: Approval MUST bind the authenticated owner, case, plan version, canonical plan hash,
  and expiry. User commands and counterparty callbacks MUST use separate authentication boundaries;
  callback authenticity MUST include a signature, timestamp, nonce, and replay rejection.
- **FR-033**: Raw source artifacts MUST be deleted within 24 hours after processing. Structured case,
  evidence, and timeline data MUST expire within 30 days after completion or expiry. Requested
  deletion MUST make the case inaccessible immediately and remove personal data within 24 hours;
  any retained tombstone MUST contain only opaque IDs, hashes, time, and reason for at most 30 days.
- **FR-034**: Intake MUST allow only PDF, JPEG, PNG, and bounded text; reject active formats, URLs,
  archives, and HTML; detect media type from content; and enforce 10 MB per file, 20 PDF pages,
  20-megapixel images, 50,000 text characters, and three artifacts per case.
- **FR-035**: The public evaluation deployment MUST enforce at most 10 new cases per identity per
  day, four model calls per normal case, five task attempts, three logical external actions, and
  three notifications. Exhausting a case budget MUST produce `NEEDS_ATTENTION`, never unbounded
  retry or silent completion. The deployment MUST record model usage, latency, and estimated case
  cost without personal data.
- **FR-036**: Every model-visible source, extracted string, QR value, metadata value, tool result,
  and callback field MUST be treated as untrusted data. Model flows that inspect them MUST have no
  action credentials or lifecycle authority; instructions found within them MUST NOT alter the
  approved recipient, fields, limits, actions, or evidence policy.
- **FR-037**: Private artifact access MUST use owner-checked, expiring access valid for no more than
  10 minutes. The project MUST state whether backups exist and MUST NOT claim backup deletion or
  forensic erasure that is not implemented and observable.
- **FR-038**: Authentication, authorization, signature, replay, rate-limit, budget, and input-policy
  failures MUST produce a redacted reason and, when user action can resolve the problem, an
  inspectable intervention. They MUST NOT expose source content or trigger external action.
- **FR-039**: The adversarial evaluation MUST include expected deterministic outcomes for every
  implemented trust boundary: browser/owner, upload/model, task/broker, product/counterparty, and
  callback/verifier. Results MUST report attacks blocked, false completion, interventions, and any
  unexpected action.
- **FR-040**: The submission MUST consistently target `Taskmaster`, identify the entrant as an
  individual, and document the essential roles of Gemini 3.5+, Genkit, Cloud Run, Firestore, and
  Cloud Tasks. Source code, fixtures, templates, libraries, data, and assets MUST include origin,
  creation-period status where relevant, and compatible license or authorization.
- **FR-041**: The judging package MUST provide a deterministic, access-controlled demo seed/reset,
  an upload/paste fallback, visibly labeled accelerated time, and an under-four-minute script that
  shows approval, external action, insufficient evidence, retry/redelivery, signed evidence,
  exact-level completion, notification, timeline, Merchant Sandbox labeling, and Google Cloud
  evidence. It MUST NOT hide failures or reset another owner's case.
- **FR-042**: SC-001 and SC-002 MUST be measured with a published consent-safe protocol using the
  same synthetic task, no coaching, anonymized participant IDs, completion time, comprehension of
  allowed/prohibited actions and required evidence, errors, requested help, denominator, and all
  failures. Product-problem interviews MUST be reported separately from usability results.
- **FR-043**: The 48-hour decision gate MUST pass the 15 observable results in `plan.md`. Failure to
  deploy external action, durable resume/redelivery, deterministic evidence rejection, or exact
  completion MUST freeze email, secondary promise types, bonus integrations, and polish until a
  documented channel or wedge pivot is accepted.
- **FR-044**: Before final submission, the repository MUST include reproducible setup/deployment,
  current architecture and trust boundaries, hosted judge access, repository access, an English
  video or English subtitles, declared limitations, and free availability through the judging
  period. Credentials supplied by a judge MUST NOT be required.

### Key Entities

- **Person**: The individual who submits a promise, owns its Resolution Plan, grants authority, and
  receives decisions or proof.
- **Source Artifact**: A message, document, image, screenshot, or text containing the promise or
  later evidence, with provenance and retention status.
- **Commercial Promise**: The party, expected result, amount or object, timing condition, reference,
  and confidence extracted from source artifacts.
- **Resolution Plan**: A versioned agreement defining the result, actions, limits, approvals,
  evidence requirements, notification conditions, and expiry.
- **Case**: The durable lifecycle of one approved commercial promise and its current state.
- **Action Record**: An authorized external operation and its unique execution identity, attempts,
  outcome, and receipt.
- **Evidence Record**: A claim and supporting artifact linked to one case, its provenance, evidence
  level, verification result, and rejection reason when applicable.
- **Case Event**: An ordered, append-only account of a transition, action, decision, or verification.
- **Counterparty Adapter**: A real or controlled boundary that accepts authorized actions and emits
  receipts or evidence without controlling the case lifecycle.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least 6 of 8 non-technical evaluators can explain the proposed action, prohibited
  actions, and completion evidence after reviewing a plan without assistance.
- **SC-002**: At least 6 of 8 non-technical evaluators can review and activate a valid plan in under
  three minutes.
- **SC-003**: In the published evaluation corpus, no acknowledgement-only, wrong-case, wrong-amount,
  wrong-currency, wrong-reference, expired, or unsigned evidence is declared complete.
- **SC-004**: Replaying the same intake, action delivery, and completion event produces exactly one
  case, one external action, and one completion transition.
- **SC-005**: Every recoverable-failure scenario either completes after retry or reaches a visible
  intervention state without losing its prior history.
- **SC-006**: Every attempted action outside an approved plan is blocked and recorded without
  contacting the counterparty.
- **SC-007**: A process restart during each non-terminal stage preserves the case and permits the
  expected next action without manual reconstruction.
- **SC-008**: The primary refund story, including insufficient evidence, retry or redelivery, valid
  evidence, proof, and operational trace, can be demonstrated in under four minutes.
- **SC-009**: The same reviewer can distinguish `merchant confirmed` from `funds settled` in every
  completed demonstration case.
- **SC-010**: The complete judging path uses synthetic personal data, visibly labels controlled
  services, and can be reproduced without paid credentials supplied by the judge.
- **SC-011**: One Spanish-language promise is captured with the same merchant, amount, currency,
  deadline, and evidence meaning as its English reference case.
- **SC-012**: Published results report false completion, verified completion, duplicate action,
  unauthorized action, recovery, human intervention, elapsed time, and case cost without omitting
  failed scenarios.
- **SC-013**: Cross-owner access, stale or reused approval, unsigned or replayed callback, oversized
  input, unsupported input, and exhausted-budget scenarios are rejected with an inspectable reason
  and without an external action.

## Assumptions

- The MVP proves merchant-confirmed resolution, not independent banking settlement.
- The primary counterparty is a controlled, separately observable service and is always labeled as
  such; it does not represent integration with a real retailer.
- A person explicitly shares each source artifact; broad inbox access and financial-account access
  are outside scope.
- The initial product supports one person per case and one counterparty; family collaboration and
  organizational workflows are deferred.
- Country-specific legal conclusions, formal disputes, chargebacks, purchases, cancellations, and
  destructive actions are outside scope.
- The product may accelerate waiting time for a labeled demo while preserving the same transitions
  and evidence rules.
- The product vision is share-first, while the MVP transport is upload/paste-first. Inbound email,
  SMTP configuration, broad inbox access, WhatsApp, and share-sheet integration are outside the
  kill test and may begin only after the deployed walking skeleton passes.
- Firebase anonymous authentication is acceptable for the judge path when it creates real isolated
  ownership; identity upgrade and email-link sign-in are deferred.
- Performance and scale claims beyond the reproducible evaluation corpus are outside scope.
