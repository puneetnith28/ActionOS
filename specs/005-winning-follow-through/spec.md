# Feature Specification: Winning Follow-through Loop

**Feature Branch**: `005-winning-follow-through`

**Created**: 2026-08-18

**Status**: Approved for implementation

**Input**: Reopen the release candidate after a real-account audit showed that ActionOS can reject
weak evidence but does not yet schedule the next logical follow-up, and that consumer projections
misstate counterparties, money and time.

## Product Promise

ActionOS does not merely send once and wait. After an approved contact it continues a bounded,
auditable chase until one of three honest outcomes exists: sufficient proof, one narrow decision for
the owner, or exhaustion of the approved action budget.

## Ten Product Truths

1. A weak acknowledgement schedules the next approved follow-up.
2. Silence also schedules the next approved follow-up.
3. Every logical send has a distinct idempotency key and stays inside the approved send budget.
4. A later follow-up explains what proof remains missing instead of blindly repeating the first text.
5. A company is named from the promise, never inferred from an email provider or demo endpoint.
6. Money is displayed as currency and major units, never raw minor units.
7. Proof levels and lifecycle states are translated into human language.
8. Activity and next-action times reflect persisted events; stale or past schedules are not presented
   as future work.
9. Loading and slow analysis preserve orientation and show meaningful progress.
10. Public copy and examples describe the channels and dates that are actually available today.

## User Stories

### US1 — ActionOS really continues the chase (P0)

As an owner, when a company is silent or only acknowledges my request, I want ActionOS to perform the
next approved follow-up without requiring me to remember the case.

**Acceptance scenarios**:

1. After a successful first send, a durable task exists for the next approved interval.
2. If no sufficient evidence arrives, that task sends exactly one new logical follow-up.
3. If an acknowledgement arrives before the wake time, the old task becomes stale and exactly one
   replacement task is scheduled from the new case version.
4. A sufficient reply before the wake time makes every queued follow-up stale.
5. Reaching `maxLogicalSends` creates one owner intervention and no additional external action.
6. Duplicate tasks or callbacks never create duplicate logical sends or notifications.

### US2 — Understand the case without decoding internals (P0)

As an owner, I want the inbox and case page to name the company, amount, result, activity and next
step correctly so I can trust what the agent is doing.

**Acceptance scenarios**:

1. Northstar Store remains Northstar Store in both Demo API and Managed Email cases.
2. USD 59 is rendered as `USD 59.00`; `5900` is never shown to a consumer.
3. `MERCHANT_CONFIRMED` and `REQUEST_ACKNOWLEDGED` are rendered as human phrases.
4. Inbox ordering and “Updated” use the latest persisted activity.
5. A past wake time is not shown as a future “Next check”.

### US3 — Feel responsive and current (P1)

As a first-time user or judge, I want every wait, example and capability statement to remain useful
and truthful on the day I open the app.

**Acceptance scenarios**:

1. A case page shows a meaningful skeleton with case orientation, not a mostly empty card.
2. Analysis exposes persisted stages, a bounded slow-state message and an actionable retry on failure.
3. Public examples derive dates relative to the current day and can execute immediately in demo mode.
4. Public copy says Managed Email is an explicit controlled pilot when healthy; it never says both
   “available” and “not enabled”.
5. The illustrative landing card is labeled as an example rather than a real live merchant case.

### US4 — Show agentic adaptation safely (P1)

As a judge, I want to see the system use an authenticated weak reply to adapt the next approved
action while keeping deterministic policy in control.

**Acceptance scenarios**:

1. Inbound Gemini interpretation remains tool-less and cannot authorize lifecycle transitions.
2. The next outbound summary states that the prior reply only acknowledged the request and names the
   missing proof fields.
3. The technical trace correlates each scheduled wake, logical send and evidence decision.
4. Consumer copy never claims bank settlement, arbitrary-company support or unlimited retries.

## Edge Cases

- Weak acknowledgement arrives concurrently with the scheduled wake.
- The same weak reply is delivered twice.
- A sufficient reply arrives after budget exhaustion or stop.
- A follow-up send fails after an earlier send succeeded.
- Legacy cases do not contain a persisted counterparty name.
- Currency is unknown or unsupported by `Intl.NumberFormat`.
- The stored wake time is malformed, equal to now, or already past.
- Email health changes between review and scheduled follow-up.

## Functional Requirements

- **FR-001**: Successful external action MUST persist and enqueue the next bounded logical wake when
  the plan still has send budget.
- **FR-002**: Insufficient non-conflicting evidence MUST atomically advance case version and persist a
  replacement next wake before scheduling it.
- **FR-003**: The runner MUST accept due `WAITING_EXTERNAL` work and increment `actionOrdinal` only
  after a successful logical send.
- **FR-004**: The runner MUST use `maxLogicalSends` from the approved plan and raise a deduplicated
  intervention when exhausted.
- **FR-005**: Scheduled tasks MUST be version-bound so late work fails stale after evidence, stop or
  completion.
- **FR-006**: Follow-up content after a weak acknowledgement MUST describe the missing proof without
  broadening recipient, fields, action or evidence authority.
- **FR-007**: The approved plan MUST persist an optional safe counterparty display name derived from
  the reviewed promise; legacy records MUST fall back to `Company`, never provider/domain branding.
- **FR-008**: Consumer projections MUST format monetary and evidence values for humans while keeping
  canonical minor units and enums in internal records.
- **FR-009**: Consumer activity MUST prefer `updatedAt`; next-check UI MUST only show a valid future
  wake for an active case.
- **FR-010**: Intake MUST persist a private bounded artifact and analysis job, return an owned case
  route before Gemini completes, and process extraction through a durable task with explicit retry,
  terminal failure and cleanup. Loading UI MUST reflect persisted stages rather than a cosmetic timer.
- **FR-011**: Example dates MUST be generated relative to current UTC time and tests MUST use a fixed
  injected clock.
- **FR-012**: Capability copy MUST be derived from the channel registry or use language that remains
  true whether Managed Email is healthy or unavailable.
- **FR-013**: Every new transition MUST have unit, integration and deployed-browser evidence with one
  worker and zero retries.

## Success Criteria

- **SC-001**: In a deterministic silence/ACK corpus, 100% of eligible cases schedule one next wake.
- **SC-002**: Duplicate external action rate remains 0 across task/evidence race tests.
- **SC-003**: No action occurs after proof, stop or action-budget exhaustion.
- **SC-004**: All consumer fixtures show correct company, currency-major amount, activity and human
  proof labels.
- **SC-005**: The deployed judge path shows ACK rejected, a subsequent bounded follow-up and eventual
  sufficient proof in under four minutes using clearly labeled accelerated timing.

## Out of Scope

- Arbitrary recipients or removal of the controlled-email allowlist.
- WhatsApp, Gmail inbox access, browser automation or web-form scraping.
- Bank settlement verification.
- Organization accounts, CRM analytics or a marketplace of agents.
- Claims based on synthetic personas as if they were human usability evidence.
