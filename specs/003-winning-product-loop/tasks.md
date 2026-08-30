# Tasks: Winning Product Loop

> Historical design ledger superseded as the active release backlog by D-022/D-023 and
> `specs/004-consumer-case-inbox/tasks.md`. Implemented slices were re-specified and verified in 004;
> rejected slices (notably automatic owner merge) were replaced by recorded decisions. These boxes
> are intentionally preserved as design provenance and must not be counted as 97 current tasks.

**Input**: Design documents from `specs/003-winning-product-loop/`

**Tests**: Required. Write the named tests first and observe the intended failure before implementation.

## Phase 1: Setup and Traceability

- [ ] T001 Add 003 feature test/release scripts to root `package.json` without changing pinned dependency versions
- [ ] T002 [P] Add 003 evaluation fixture IDs and license notes to `packages/test-fixtures/src/evaluation-corpus.ts` and `docs/compliance/dependencies.md`
- [ ] T003 [P] Create requirement-to-test traceability table for FR-001–FR-052 and SC-001–SC-012 in `specs/003-winning-product-loop/checklists/completion-audit.md`

## Phase 2: Foundational Safety Blocker

**Purpose**: Remove false-DONE behavior before enabling any new channel or result path.

- [ ] T004 Add failing refund/general/replacement missing-field and unexpected-sender cases to `packages/runtime/test/inbound-service.test.ts`
- [ ] T005 [P] Add hostile quoted-only, spoofed display-name, mismatched-thread and auto-reply cases to `tests/adversarial/email-evidence.test.ts`
- [ ] T006 Extend inbound interpretation and evidence contracts with optional subject, bill period, tracking and explicit provenance in `packages/contracts/src/index.ts`
- [ ] T007 Extend tool-less inbound extraction output without lifecycle authority in `packages/genkit-flows/src/interpret-inbound.ts`
- [ ] T008 Remove plan-value fallback and build explicit-only candidates plus separate authenticity assessment in `packages/runtime/src/inbound-service.ts`
- [ ] T009 Persist authenticity and missing-field reason codes without raw content in `packages/persistence/src/runtime-store.ts`
- [ ] T010 Verify deterministic refund/replacement/general evidence rejection in `packages/domain/test/verifier.test.ts`
- [ ] T011 Run and record Gate A false-DONE corpus interpretation in `docs/evaluation/results.md` and `specs/003-winning-product-loop/checklists/security-privacy.md`

**Checkpoint**: Missing inbound facts remain absent; Managed Email remains unavailable.

## Phase 3: User Story 1 — Complete an Accelerated Demo (P1)

**Goal**: All four visible examples execute the real sandbox protocol to a result during one session.

**Independent Test**: Production four-example matrix reaches result in under 90 seconds per case with one worker and zero retries.

- [ ] T012 [P] [US1] Add execution-mode/timing policy contract tests in `packages/contracts/test/execution-mode.test.ts`
- [ ] T013 [P] [US1] Add server-derived relative schedule and stale-policy tests in `packages/runtime/test/plan-service.test.ts`
- [ ] T014 [US1] Add `ExecutionModePolicy` schemas and canonical plan fields in `packages/contracts/src/index.ts`
- [ ] T015 [US1] Implement accelerated relative wake calculation and disclosure/version validation in `packages/runtime/src/plan-service.ts`
- [ ] T016 [US1] Add mode capability projection and fail-closed selection to `packages/runtime/src/channel-registry.ts`
- [ ] T017 [US1] Add accelerated acknowledgement/confirmation/retry scenario timing to `apps/merchant-sandbox/src/scenarios.ts`
- [ ] T018 [US1] Persist execution mode and timing labels in draft/run transitions in `packages/persistence/src/intake-store.ts` and `packages/persistence/src/runtime-store.ts`
- [ ] T019 [US1] Add explicit Demo/Pilot mode choice and one-time disclosure to `apps/web/components/plan-review.tsx`
- [ ] T020 [US1] Replace fixed example dates with mode-derived semantic examples in `apps/web/components/intake-form.tsx`
- [ ] T021 [US1] Extend `tests/e2e/deployed-example-matrix.spec.ts` from review-only to complete result assertions for all four examples
- [ ] T022 [US1] Add scoped synthetic case reset verification to `scripts/demo/reset.ts` and `tests/adversarial/reset-scope.test.ts`

## Phase 4: User Story 2 — Correct What Gemini Understood (P1)

**Goal**: Every action-authorizing fact is editable with provenance, versioning and stale-approval denial.

**Independent Test**: Correct amount/date via keyboard, observe version change/live announcement and deny prior approval.

- [ ] T023 [P] [US2] Add full revision contract/race tests to `packages/runtime/test/plan-service.test.ts`
- [ ] T024 [P] [US2] Add keyboard, focus, live-status and stale-approval browser tests to `tests/e2e/editable-review.spec.ts`
- [ ] T025 [US2] Extend `PlanRevision` to company, result, item/subject, amount, currency, reference, dates, recipient and proof in `packages/runtime/src/plan-service.ts`
- [ ] T026 [US2] Extend plan API validation and safe conflict responses in `apps/web/app/api/cases/[caseId]/plan/route.ts`
- [ ] T027 [US2] Build reusable cited editable fact controls in `apps/web/components/editable-promise-contract.tsx`
- [ ] T028 [US2] Integrate editing, uncertainty summary, version feedback and focus restoration in `apps/web/components/plan-review.tsx`
- [ ] T029 [US2] Add responsive/zoom styles for editable facts to `apps/web/app/globals.css`
- [ ] T030 [US2] Add accessible correction announcements and error-copy coverage in `apps/web/test/plan-controller.test.ts` and `apps/web/test/error-copy.test.ts`

## Phase 5: User Story 3 — Approve in Plain Language (P1)

**Goal**: A compact five-decision approval view replaces the technical multi-viewport console.

**Independent Test**: At 390×844 the primary approval path is understandable and operable without expanding technical details.

- [ ] T031 [P] [US3] Add compact review semantic/accessibility assertions to `tests/e2e/compact-approval.spec.ts`
- [ ] T032 [US3] Refactor `apps/web/components/plan-review.tsx` into request, recipient, timing, data/limits and proof/return sections
- [ ] T033 [US3] Move inactive channels and technical contract metadata under progressive disclosure in `apps/web/components/plan-review.tsx`
- [ ] T034 [US3] Make preview busy/error/result states accessible and side-effect free in `apps/web/components/plan-review.tsx`
- [ ] T035 [US3] Replace technical consumer copy while retaining exact claim limitations in `apps/web/lib/error-copy.ts` and `apps/web/components/plan-review.tsx`
- [ ] T036 [US3] Add mobile/desktop visual snapshots and 200% reflow assertions to `tests/e2e/compact-approval.spec.ts`

## Phase 6: User Story 4 — Start Analysis and Leave (P1)

**Goal**: Intake returns an owned analyzing case immediately and Gemini processing survives refresh, retry and cancellation.

**Independent Test**: Gateway hang/fail/recover, duplicate task, refresh and cancel/late-result races keep one case and bounded calls.

- [ ] T037 [P] [US4] Add AnalysisJob schemas/state-transition tests in `packages/contracts/test/analysis-job.test.ts`
- [ ] T038 [P] [US4] Add durable retry/dedupe/cancel race tests in `tests/integration/durable-analysis.test.ts` and `tests/adversarial/analysis-races.test.ts`
- [ ] T039 [US4] Add AnalysisJob and analysis event contracts in `packages/contracts/src/index.ts`
- [ ] T040 [US4] Implement Firestore transactional job/dedupe/lease/CAS store in `packages/persistence/src/analysis-store.ts`
- [ ] T041 [US4] Implement bounded analysis orchestration and late-result discard in `packages/runtime/src/analysis-service.ts`
- [ ] T042 [US4] Refactor `apps/web/lib/intake-controller.ts` to persist/enqueue and return 202 without invoking Gemini
- [ ] T043 [US4] Add OIDC-protected analysis worker at `apps/web/app/api/internal/tasks/analyze-case/route.ts`
- [ ] T044 [US4] Add owner-checked analysis GET/cancel/retry route at `apps/web/app/api/cases/[caseId]/analysis/route.ts`
- [ ] T045 [US4] Wire Cloud Tasks analysis target, IAM and bounded retry settings in `infra/cloud-run/deploy.sh` and `infra/cloud-tasks/queue.yaml`
- [ ] T046 [US4] Add Firestore TTL/index/rules coverage for analysis jobs in `infra/firestore/firestore.rules`, `infra/firestore/firestore.indexes.json` and `infra/cloud-run/deploy.sh`
- [ ] T047 [US4] Build persisted-stage analyzing page/component in `apps/web/app/cases/[caseId]/analyzing/page.tsx` and `apps/web/components/analysis-progress.tsx`
- [ ] T048 [US4] Change intake navigation, preserved input and actionable failure/cancel UI in `apps/web/components/intake-form.tsx`
- [ ] T049 [US4] Add browser delay/error/reload/double-submit tests to `tests/e2e/intake-resilience.spec.ts`

## Phase 7: User Story 5 — See the Agent Work (P1)

**Goal**: A persisted human timeline shows autonomy, rejection, retry, proof and controls.

**Independent Test**: Close/reopen an active case and observe the same ordered events, next action and exact result.

- [ ] T050 [P] [US5] Add CaseEvent schema/order/idempotency tests in `packages/contracts/test/case-events.test.ts`
- [ ] T051 [P] [US5] Add timeline projection and late-stop/dispute tests in `tests/integration/case-timeline.test.ts`
- [ ] T052 [US5] Implement transaction-safe event append/read store in `packages/persistence/src/case-event-store.ts`
- [ ] T053 [US5] Emit stable events from analysis, plan, runner, evidence, intervention and notification services in `packages/runtime/src/case-events.ts`
- [ ] T054 [US5] Add owner-checked timeline API at `apps/web/app/api/cases/[caseId]/timeline/route.ts`
- [ ] T055 [US5] Build live polling timeline, next-action and weak-proof explanations in `apps/web/components/case-timeline-live.tsx`
- [ ] T056 [US5] Integrate stop, dispute/reopen and exact limitation controls in `apps/web/components/case-result.tsx`
- [ ] T057 [US5] Add complete close/reopen timeline assertions to `tests/e2e/deployed-demo.spec.ts`

## Phase 8: User Story 6 — Recover Across Devices (P1)

**Goal**: Activation links the draft to recoverable Firebase identity and owned cases reopen cross-device.

**Independent Test**: Claim anonymous draft, authenticate in clean context, read owned case/history and deny another owner.

- [ ] T058 [P] [US6] Add identity-link/claim schemas and race tests in `packages/contracts/test/identity-link.test.ts`
- [ ] T059 [P] [US6] Add Firestore Emulator cross-owner/history/linking rules tests in `tests/firestore/identity-link.test.ts`
- [ ] T060 [US6] Implement stable owner identity and atomic case claim store in `packages/persistence/src/identity-store.ts`
- [ ] T061 [US6] Add owner claim/link service and activation gate in `packages/runtime/src/identity-service.ts` and `packages/runtime/src/plan-service.ts`
- [ ] T062 [US6] Extend Firebase client with anonymous-to-Google link/sign-in handling in `apps/web/lib/firebase-client.ts`
- [ ] T063 [US6] Add identity claim API and recoverability checks at `apps/web/app/api/cases/[caseId]/identity/route.ts`
- [ ] T064 [US6] Add bounded owned case history API at `apps/web/app/api/cases/route.ts`
- [ ] T065 [US6] Build activation sign-in and compact case history UI in `apps/web/components/recoverable-identity.tsx` and `apps/web/app/cases/page.tsx`
- [ ] T066 [US6] Add two-browser cross-device and denial paths to `tests/e2e/cross-device-return.spec.ts`
- [ ] T067 [US6] Make notification transport status truthful in `packages/runtime/src/notifications.ts` and `apps/web/components/case-result.tsx`

## Phase 9: User Story 10 — Submit a Reproducible Entry (P1)

**Goal**: External eliminatory gates and claims fail closed before submission.

**Independent Test**: Release audit rejects placeholders/missing evidence and passes only with explicit verifiable references/manual confirmations.

- [ ] T068 [P] [US10] Create typed release manifest schema and fixtures in `scripts/release/release-manifest.ts` and `scripts/release/release-manifest.example.json`
- [ ] T069 [US10] Implement placeholder, URL, duration, language, revision and claim-evidence validation in `scripts/release/check.ts`
- [ ] T070 [US10] Add `release:check` command to root `package.json` and contract tests in `tests/contract/release-readiness.test.ts`
- [ ] T071 [US10] Update final continuous story and timing checkpoints in `docs/submission/demo-script.md`
- [ ] T072 [US10] Align README, architecture and Devpost copy claims in `README.md`, `docs/architecture/actionos.md` and `docs/submission/devpost-copy.md`
- [ ] T073 [US10] Record judge repo, eligibility, video and deployed revision gates without fabricated verification in `docs/hackathon/compliance-checklist.md`

## Phase 10: User Story 7 — Controlled Real Conversation (P2, Optional)

**Goal**: Demonstrate one fail-closed bidirectional email flow between controlled mailboxes only.

**Independent Test**: Incomplete controlled reply stays open; explicit complete reply reaches exact evidence level; unauthorized sender/recipient is denied.

- [ ] T074 [P] [US7] Add persisted EmailReadiness schemas/tests in `packages/contracts/test/email-readiness.test.ts`
- [ ] T075 [P] [US7] Add controlled smoke, missing-field and cross-sender integration paths in `tests/integration/controlled-email-smoke.test.ts`
- [ ] T076 [US7] Implement deployment/config fingerprinted readiness store in `packages/persistence/src/email-readiness-store.ts`
- [ ] T077 [US7] Require fresh persisted readiness in `packages/runtime/src/channel-registry.ts` and `apps/web/app/api/channels/route.ts`
- [ ] T078 [US7] Persist provider/sender/thread authenticity separately in `apps/web/lib/email-webhook-controller.ts` and `packages/runtime/src/inbound-service.ts`
- [ ] T079 [US7] Add operator-only readiness record route at `apps/web/app/api/internal/email/readiness/route.ts`
- [ ] T080 [US7] Add deploy/rollback smoke instructions and Secret Manager wiring to `infra/cloud-run/deploy.sh` and `specs/003-winning-product-loop/quickstart.md`

## Phase 11: User Story 8 — Inspect Winning Evidence (P2)

**Goal**: Judges trace the synthetic case through real redacted persisted records.

**Independent Test**: One correlation identity shows Gemini→task→policy→receipt→weak rejection→proof with no raw content/secrets.

- [ ] T081 [P] [US8] Add console projection allowlist/redaction contract tests in `tests/contract/evidence-console.test.ts`
- [ ] T082 [P] [US8] Add cross-owner, non-synthetic and judge-mode denial tests in `tests/adversarial/evidence-console-access.test.ts`
- [ ] T083 [US8] Implement owner/synthetic-gated projection service in `packages/runtime/src/evidence-console.ts`
- [ ] T084 [US8] Add required safe model/task/action/evidence read methods to `packages/persistence/src/runtime-store.ts`
- [ ] T085 [US8] Add Evidence Console route at `apps/web/app/api/cases/[caseId]/evidence-console/route.ts`
- [ ] T086 [US8] Build concise expandable console in `apps/web/components/evidence-console.tsx`
- [ ] T087 [US8] Add deployed console correlation/redaction assertions to `tests/e2e/deployed-demo.spec.ts`

## Phase 12: User Story 9 — Make Gemini Measurable (P2)

**Goal**: Publish honest live-model extraction/provenance/uncertainty evidence with all failures.

**Independent Test**: Opt-in runner executes the versioned synthetic corpus once with zero retries and writes complete JSON/report artifacts.

- [ ] T088 [P] [US9] Add multi-source contradiction, Spanish, image/PDF and hostile live fixtures in `packages/test-fixtures/src/live-model-corpus.ts`
- [ ] T089 [US9] Preserve cross-source citations/contradictions and minimal clarification in `packages/genkit-flows/src/extract-promise.ts`
- [ ] T090 [US9] Implement zero-retry live evaluation runner and immutable JSON output in `scripts/evaluation/live-model.ts`
- [ ] T091 [US9] Add `evaluate:live` command and output schema contract test in root `package.json` and `tests/contract/live-evaluation.test.ts`
- [ ] T092 [US9] Generate an interpretation template separating targets/results and deterministic/live calls in `docs/evaluation/live-model-results.md`

## Phase 13: Final Cross-Cutting Validation

- [ ] T093 Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm evaluate`, `pnpm release:check` and `git diff --check`
- [ ] T094 Run accessibility, keyboard, reduced-motion and 200% reflow matrix across intake/analyzing/review/timeline/result in `tests/e2e/accessibility.spec.ts`
- [ ] T095 Run sequential deployed suite with one worker/retries zero and record revision, build ID, durations and failures in `docs/evaluation/reproducibility.md`
- [ ] T096 Validate every security/privacy and hackathon readiness checkbox with an evidence link in `specs/003-winning-product-loop/checklists/security-privacy.md` and `specs/003-winning-product-loop/checklists/hackathon-readiness.md`
- [ ] T097 Freeze submission revision, record final architecture evidence and preserve sandbox fallback in `docs/evaluation/spec-completion-audit.md`

## Dependencies and Execution Order

```text
Setup
  → Foundational Safety (hard blocker)
  → US1 Accelerated Demo
      → US2 Editable Review
      → US3 Compact Approval
      → US4 Durable Analysis
          → US5 Live Timeline
          → US6 Recoverable Return
  → US10 Submission gates can progress alongside P1 work
  → US8 Evidence Console
  → US9 Live Gemini evaluation
  → US7 Controlled Email only after Safety; optional and never blocks sandbox
  → Final Validation
```

The order above is optimized for a solo participant and demo risk. US7 is numbered from the product
spec but scheduled after submission-critical P1 stories because it is an optional external gate.

## Parallel Opportunities

- Test fixtures in T002/T005, contract tests marked `[P]`, and release manifest work may proceed in
  files isolated from runtime changes.
- Within each story, contract/browser tests can be authored before the implementation task they gate.
- US10 documentation/release validation may progress while US4–US6 implementation is underway.
- US8 console UI can begin after its projection contract stabilizes; it must not invent missing data.
- US7 controlled-provider setup is operationally parallel but code enablement waits for T004–T011.

## Implementation Strategy

1. Finish T001–T011 and deploy the safety fix.
2. Finish US1 and stop for the 4/4 complete production kill test.
3. Finish US2–US6 sequentially, deploying after each independent story checkpoint.
4. Keep US10 gates current; do not leave submission work to the final day.
5. Add US8/US9 for judge clarity.
6. Attempt US7 only if deterministic public path and submission gates remain green.
7. Execute T093–T097 and freeze.

## Format Validation

Every implementation line uses `- [ ] T### [P?] [US?] description with exact path`. Setup,
foundational and cross-cutting tasks intentionally omit story labels; story tasks include them.
