# Tasks: Multichannel Follow-Through

> Historical implementation ledger. Decisions D-021–D-024 and
> `specs/004-consumer-case-inbox/tasks.md` are authoritative for release. Remaining external-email,
> human-study and compliance gates are carried forward there; unchecked items here are not a second
> active backlog.

**Input**: Design documents from `specs/002-multichannel-follow-through/`

**Tests**: Required by FR-046–FR-049 and written before or with each implementation slice.

## Phase 1: Setup and Baseline

- [x] T001 Record the current deployed sandbox baseline and rollback revision in `docs/evaluation/reproducibility.md`
- [x] T002 [P] Add secret-safe channel configuration keys and comments to `.env.example`
- [x] T003 [P] Add provider and channel dependencies with exact versions to `package.json`, workspace package manifests and `pnpm-lock.yaml`
- [x] T004 Validate existing schema compatibility and migration strategy in `packages/contracts/test/contracts.test.ts`

## Phase 2: Foundational Channel Model

- [x] T005 Add ChannelType, capability, ConversationPlan, receipt, thread, delivery and inbound schemas in `packages/contracts/src/index.ts`
- [x] T006 [P] Add schema contract tests for valid, invalid and legacy plans in `packages/contracts/test/contracts.test.ts`
- [x] T007 Extend deterministic authorization to bind channel and message identity in `packages/domain/src/policy.ts`
- [x] T008 [P] Add channel/message authorization and mutation-denial tests in `packages/domain/test/policy.test.ts`
- [x] T009 Define capability-aware ChannelAdapter and ChannelRegistry contracts in `packages/runtime/src/channel-registry.ts`
- [x] T010 [P] Add registry availability, health and unsupported-channel tests in `packages/runtime/test/channel-registry.test.ts`
- [x] T011 Implement Firestore action-receipt, thread, provider-event and inbound stores in `packages/persistence/src/runtime-store.ts`
- [x] T012 [P] Extend Firestore rules, TTL configuration and emulator tests in `infra/firestore/firestore.rules`, `infra/cloud-run/deploy.sh`, and `tests/security/`
- [x] T013 Add redacted channel/inbound observability fields in `packages/observability/src/index.ts`
- [x] T014 [P] Add redaction tests for addresses, bodies, headers and tokens in `packages/observability/test/redaction.test.ts`

## Phase 3: User Story 1 — Approve a Real Conversation (P1)

**Independent Test**: Review and revise channel, recipient and message; verify unavailable channels
cannot activate and prior approval becomes stale.

- [x] T015 [P] [US1] Add plan-service tests for channel, recipient, message, cadence and approval invalidation in `packages/runtime/test/plan-service.test.ts`
- [x] T016 [P] [US1] Add plan API contract tests for supported and unavailable channels in `apps/web/test/plan-controller.test.ts`
- [x] T017 [US1] Extend intake and plan construction with channel/message defaults in `packages/runtime/src/intake-service.ts` and `packages/runtime/src/plan-service.ts`
- [x] T018 [US1] Expose truthful channel capabilities through `apps/web/app/api/channels/route.ts`
- [x] T019 [US1] Validate all plan revisions and capability health in `apps/web/lib/plan-controller.ts`
- [x] T020 [US1] Build the modern channel selector, recipient editor, exact message preview, cadence, limits and return-path UX in `apps/web/components/plan-review.tsx`
- [x] T021 [US1] Add anti-abuse confirmation and activation blocking in `apps/web/components/plan-review.tsx`
- [x] T022 [P] [US1] Add responsive, keyboard and screen-reader styles in `apps/web/app/globals.css`
- [x] T023 [US1] Add deterministic Playwright coverage for review/revision/approval in `tests/e2e/channel-plan.spec.ts`

## Phase 4: User Story 2 — Send One Authorized Email Reliably (P1)

**Independent Test**: Send once to a controlled mailbox through a fake provider, inject uncertainty
and duplicate tasks, and observe one receipt with no completion.

- [x] T024 [P] [US2] Expand provider transport tests for accepted, 429, 5xx, missing receipt and invalid recipient in `packages/channel-adapters/test/company-email.test.ts`
- [x] T025 [US2] Update managed-email adapter to consume the common ChannelAdapter and receipt contracts in `packages/channel-adapters/src/company-email.ts`
- [x] T026 [US2] Persist provider message/thread identity around the send in `packages/runtime/src/action-broker.ts` and `packages/persistence/src/runtime-store.ts`
- [x] T027 [US2] Reconcile in-flight/unknown sends without blind resend in `packages/runtime/src/case-runner.ts`
- [x] T028 [P] [US2] Add interruption-after-provider-acceptance and long-window replay tests in `tests/integration/email-outbound.test.ts`
- [x] T029 [US2] Route workers by approved channel through the registry in `apps/web/app/api/internal/tasks/run-case/route.ts`
- [x] T030 [US2] Enforce controlled recipient/domain/send budgets in `apps/web/lib/security-limits.ts`
- [x] T031 [P] [US2] Add budget, arbitrary-recipient and cross-owner denial tests in `apps/web/test/security-limits.test.ts` and `tests/adversarial/email-boundary.test.ts`
- [x] T032 [US2] Project scheduled/sending/accepted/delivered/bounced states into the case result in `apps/web/components/case-result.tsx`

## Phase 5: User Story 3 — Receive and Evaluate a Reply (P1)

**Independent Test**: Process signed acknowledgement and confirmation fixtures; reject invalid,
replayed, ambiguous and hostile events; never close from transport or model output alone.

- [x] T033 [P] [US3] Add provider webhook signature and payload fixtures in `packages/test-fixtures/src/email-events.ts`
- [x] T034 [P] [US3] Add webhook verification, replay and original-body contract tests in `tests/contract/email-webhook.test.ts`
- [x] T035 [US3] Implement provider webhook verification and event normalization in `packages/channel-adapters/src/email-webhook.ts`
- [x] T036 [US3] Implement reserve-and-enqueue webhook controller in `apps/web/lib/email-webhook-controller.ts`
- [x] T037 [US3] Add public provider webhook route in `apps/web/app/api/webhooks/email/route.ts`
- [x] T038 [US3] Add inbound processing Cloud Task scheduler and protected route in `packages/runtime/src/task-scheduler.ts` and `apps/web/app/api/internal/tasks/process-inbound/route.ts`
- [x] T039 [US3] Implement bounded provider content retrieval and sanitization in `packages/channel-adapters/src/inbound-email.ts`
- [x] T040 [P] [US3] Add MIME, size, attachment, timeout and exact-endpoint tests in `packages/channel-adapters/test/inbound-email.test.ts`
- [x] T041 [US3] Implement exact/ambiguous/unknown case-thread correlation in `packages/runtime/src/inbound-service.ts`
- [x] T042 [P] [US3] Add cross-case, deleted-case, unexpected-sender and out-of-order tests in `packages/runtime/test/inbound-service.test.ts`
- [x] T043 [US3] Implement tool-less typed inbound extraction in `packages/genkit-flows/src/extract-inbound.ts`
- [x] T044 [P] [US3] Add acknowledgement, auto-reply, changed-remedy, evidence and injection fixtures/tests in `packages/genkit-flows/test/extract-inbound.test.ts`
- [x] T045 [US3] Reconcile inbound candidates through deterministic evidence/intervention services in `packages/runtime/src/inbound-service.ts`
- [x] T046 [P] [US3] Add false-DONE and hostile inbound adversarial tests in `tests/adversarial/email-inbound.test.ts`

## Phase 6: User Story 4 — Return Only When It Matters (P2)

**Independent Test**: Close the browser, process an event, and receive one inspectable user update
whose delivery status does not affect case truth.

- [x] T047 [P] [US4] Extend notification schema/store with delivery states in `packages/contracts/src/index.ts` and `packages/persistence/src/runtime-store.ts`
- [x] T048 [US4] Deliver persisted notifications through the configured adapter in `packages/runtime/src/notifications.ts`
- [x] T049 [P] [US4] Add notification acceptance, bounce, suppression, duplicate and unavailable tests in `packages/channel-adapters/test/outbound-email.test.ts` and `packages/runtime/test/notifications.test.ts`
- [x] T050 [US4] Expose channel event projection and notification delivery in `apps/web/lib/result-controller.ts`
- [x] T051 [US4] Redesign follow-through state, next action and return status in `apps/web/components/case-result.tsx`
- [x] T052 [US4] Add stop/revoke/delete/late-event race tests in `tests/integration/email-case-control.test.ts`
- [ ] T053 [US4] Add deployed browser flow for tab closure and return notification in `tests/e2e/email-follow-through.spec.ts`

## Phase 7: User Story 5 — Reuse Across Channels (P3)

**Independent Test**: Execute the same authorized action envelope against sandbox, email fake and
partner fixture; compare common receipts, policy and lifecycle behavior.

- [x] T054 [P] [US5] Implement controlled partner-API fixture adapter in `packages/channel-adapters/src/partner-api.ts`
- [x] T055 [P] [US5] Add common adapter conformance suite in `packages/channel-adapters/test/channel-conformance.test.ts`
- [x] T056 [US5] Add partner fixture to channel registry as non-production in `packages/runtime/src/channel-registry.ts`
- [x] T057 [P] [US5] Document Gmail OAuth/scopes/token/watch acceptance decision in `specs/002-multichannel-follow-through/research.md`
- [x] T058 [US5] Implement Gmail adapter only if Gate D passes in `packages/channel-adapters/src/gmail.ts`; otherwise record a tested unavailable capability

## Phase 8: Production, Evaluation and Submission Evidence

- [x] T059 Add provider secrets, webhook URL, allowlist and sandbox rollback to `infra/cloud-run/deploy.sh` and `.env.example`
- [x] T060 [P] Add channel architecture and trust boundaries to `docs/architecture/actionos.md`
- [x] T061 [P] Update setup, honest limitations and provider operation in `README.md` and `specs/002-multichannel-follow-through/quickstart.md`
- [x] T062 Extend the evaluation corpus and reporting for email delivery/reply outcomes in `packages/test-fixtures/`, `scripts/evaluation/`, and `docs/evaluation/`
- [x] T063 Run typecheck, lint, all deterministic tests, production build and `git diff --check`
- [x] T064 Deploy sandbox-mode release, run public Playwright paths without retries, and record the revision in `docs/evaluation/reproducibility.md`
- [ ] T065 Run Gate A controlled outbound smoke and record redacted evidence in `docs/evaluation/reproducibility.md`
- [x] T066 Run Gate B/C controlled inbound and bidirectional smoke or record the exact unmet external prerequisite in `docs/evaluation/reproducibility.md` without claiming completion
- [x] T067 Update four-minute demo script, architecture evidence and Devpost checklist in `docs/submission/demo-script.md` and `docs/hackathon/compliance-checklist.md`
- [x] T068 Perform requirement-by-requirement completion audit against FR-001–FR-050 and SC-001–SC-012 in `specs/002-multichannel-follow-through/checklists/hackathon-readiness.md`
- [ ] T069 Run the published no-coaching usability protocol with consented participants and record denominators/failures in `docs/research/` without substituting synthetic agents

## Dependencies and Execution Order

- Phase 1 establishes rollback and configuration before mutation.
- Phase 2 blocks every user story.
- US1 blocks external execution because approval must bind the new fields.
- US2 blocks US3 because inbound correlation requires a persisted outbound thread.
- US3 blocks the bidirectional portion of US4.
- US5 begins only after Gates A–C are stable; Gmail remains conditional.
- Production evidence runs only after deterministic gates pass.

## Parallel Opportunities

- Schema tests, observability redaction and Firestore rules can proceed after T005 contracts stabilize.
- UI styling can proceed alongside plan-controller work once the response schema is fixed.
- Provider fixtures/tests and outbound runtime tests can proceed independently.
- Inbound adapter retrieval tests and Genkit fixture preparation can proceed after InboundEnvelope is fixed.
- Documentation and evaluation corpus work can proceed after Gate C behavior stabilizes.

## Implementation Strategy

Complete P1 vertically in four checkpoints: truthful approval, exactly-once outbound, authenticated
inbound, deterministic reply outcome. Keep the public service on sandbox until controlled external
smoke proves each preceding checkpoint. Add return notifications next. Treat partner/Gmail as
non-blocking proof only after the bidirectional product works.
