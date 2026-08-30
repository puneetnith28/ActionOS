# Tasks: Resolve Commercial Promises

> Historical implementation ledger. Decisions D-021–D-024 and
> `specs/004-consumer-case-inbox/tasks.md` are authoritative for release. Remaining human-study and
> compliance gates are carried forward in `docs/hackathon/compliance-checklist.md`; unchecked items
> here are not a second active backlog.

**Input**: Design documents in `specs/001-resolve-commercial-promises/`
**Tests**: Required by the project constitution for the happy path, false completion, authorization, duplicate delivery, retry, restart, invalid callbacks, and wrong-case evidence.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can proceed in parallel because it touches independent files.
- **[Story]**: Maps the task to a user story in `spec.md`.

## Phase 1: Setup

**Purpose**: Establish one pinned, reproducible TypeScript workspace without product behavior.

- [x] T001 Initialize the pnpm workspace and pin Node/pnpm versions in `package.json`, `pnpm-workspace.yaml`, and `.nvmrc`
- [x] T002 Create the planned app/package/test directory skeleton with package manifests under `apps/`, `packages/`, and `tests/`
- [x] T003 [P] Configure strict shared TypeScript settings in `tsconfig.base.json` and package-level `tsconfig.json` files
- [x] T004 [P] Configure ESLint, Prettier, Vitest, and root quality scripts in `eslint.config.mjs`, `.prettierrc.json`, `vitest.config.ts`, and `package.json`
- [x] T005 [P] Add secret-safe local configuration templates and ignore rules in `.env.example` and `.gitignore`
- [x] T006 [P] Add dependency-license and pre-existing-component disclosure scaffolding in `docs/compliance/dependencies.md`
- [x] T007 Add continuous quality checks for install, typecheck, lint, tests, and build in `.github/workflows/ci.yml`

## Phase 2: Foundational — Blocking Prerequisites

**Purpose**: Create the deterministic contracts and safety boundaries required by every story.

**⚠️ CRITICAL**: No user-story implementation begins before this phase passes.

- [x] T008 [P] Define versioned Zod schemas for commands, plans, evidence, actions, and events in `packages/contracts/src/index.ts`
- [x] T009 [P] Define evidence levels, case states, reason codes, and domain types in `packages/domain/src/types.ts`
- [x] T010 Write failing transition-table tests for legal, illegal, stop, expiry, reopen, and DONE transitions in `packages/domain/test/reducer.test.ts`
- [x] T011 Implement the pure version-checked case reducer in `packages/domain/src/reducer.ts`
- [x] T012 Write failing policy tests for plan-version approval, least privilege, expiry, and hostile-content non-authority in `packages/domain/test/policy.test.ts`
- [x] T013 Implement deterministic authorization and plan policy in `packages/domain/src/policy.ts`
- [x] T014 Write failing verifier tests for all evidence levels and mismatches in `packages/domain/test/verifier.test.ts`
- [x] T015 Implement deterministic evidence verification in `packages/domain/src/verifier.ts`
- [x] T016 [P] Implement stable case, artifact, action, event, and callback dedupe-key builders in `packages/domain/src/identity.ts`
- [x] T017 [P] Define structured, PII-redacted event and trace fields in `packages/observability/src/index.ts`
- [x] T018 Implement Firestore repositories with optimistic transactions and ordered append-only events in `packages/persistence/src/firestore.ts`
- [x] T019 [P] Create the Firestore indexes and local emulator configuration in `infra/firestore/firestore.indexes.json` and `firebase.json`
- [x] T020 Implement the closed action broker interface with approval and idempotency enforcement in `packages/runtime/src/action-broker.ts`
- [x] T021 Implement bounded Cloud Tasks scheduling, retry, and deduplication in `packages/runtime/src/task-scheduler.ts`
- [x] T022 Add foundational contract tests for reducer/persistence/broker invariants in `tests/contract/domain-invariants.test.ts`

**Checkpoint**: Domain authority, false-DONE protection, persistence, and idempotency pass without a UI or model.

## Phase 3: User Story 1 — Capture and Approve a Promise (P1) 🎯 MVP Part 1

**Goal**: Upload a promise, receive a cited draft, review the complete authority boundary, and approve exactly one plan version.

**Independent Test**: Upload the synthetic refund fixture, correct one uncertain field, inspect every plan boundary, and approve it while proving no external request occurred before approval.

### Tests for User Story 1

- [x] T023 [P] [US1] Add schema fixtures for valid, Spanish, contradictory, duplicate, and hostile promise inputs in `packages/test-fixtures/src/promises.ts`
- [x] T024 [P] [US1] Write extraction contract tests for typed fields, provenance, uncertainty, and refusal to infer authority in `packages/genkit-flows/test/extract-promise.test.ts`
- [x] T025 [P] [US1] Write API contract tests for intake, draft revision, simulation, and version-bound approval in `tests/contract/intake-plan-api.test.ts`

### Implementation for User Story 1

- [x] T026 [US1] Implement the Gemini 3.5+ Genkit promise-extraction flow with schema validation and no tools in `packages/genkit-flows/src/extract-promise.ts`
- [x] T027 [US1] Implement content-detected PDF/JPEG/PNG/text validation, hashing, metadata removal, 10 MB/20-page/20-MP/50k-character/three-artifact limits, and private references in `packages/channel-adapters/src/upload.ts`
- [x] T028 [US1] Implement intake deduplication and draft creation service in `packages/runtime/src/intake-service.ts`
- [x] T029 [P] [US1] Build the mobile-first intake page and upload states in `apps/web/app/intake/page.tsx` and `apps/web/components/intake-form.tsx`
- [x] T030 [US1] Implement intake endpoints from the OpenAPI contract in `apps/web/app/api/intake/route.ts`
- [x] T031 [US1] Build the provenance-linked, plain-language plan review UI in `apps/web/app/cases/[caseId]/review/page.tsx`
- [x] T032 [US1] Implement simulate, revise, reject, and approve commands in `apps/web/app/api/cases/[caseId]/plan/route.ts`
- [x] T033 [US1] Add Firebase anonymous activation, case ownership, owner/version/hash-bound approval, expiry, stale-version rejection, and CSRF-safe mutations in `apps/web/lib/authz.ts`
- [x] T034 [US1] Add integration tests for pre-approval non-action, approval invalidation, expired/reused approval, and cross-owner read/control denial in `tests/integration/capture-approve.test.ts`

**Checkpoint**: The user can safely delegate one promise, but no autonomous follow-through is claimed yet.

## Phase 4: User Story 2 — Follow Through Without False Completion (P1) 🎯 MVP Part 2

**Goal**: Execute one authorized external follow-up, persist waiting/retry, reject insufficient evidence, and finish only with verified merchant confirmation.

**Independent Test**: Run acknowledgement, injected recoverable failure, duplicate delivery, signed completion, and restart; observe one logical request and one valid completion.

### Tests for User Story 2

- [x] T035 [P] [US2] Create deterministic merchant scenarios for acknowledgement, retry, mismatch, signed completion, replay, and latency in `apps/merchant-sandbox/src/scenarios.ts`
- [x] T036 [P] [US2] Write action-broker and merchant API contract tests including idempotency in `tests/contract/merchant-action.test.ts`
- [x] T037 [P] [US2] Write callback signature, freshness, replay, wrong-case, and wrong-reference tests in `tests/adversarial/callbacks.test.ts`
- [x] T038 [P] [US2] Write crash/restart and duplicate-task integration tests in `tests/integration/durable-follow-through.test.ts`

### Implementation for User Story 2

- [x] T039 [US2] Implement the separately runnable Merchant Sandbox API, signed callbacks, and request ledger in `apps/merchant-sandbox/src/server.ts`
- [x] T040 [US2] Build a judge-visible controlled-service status page and labeling in `apps/merchant-sandbox/src/status-page.ts`
- [x] T041 [US2] Implement the closed merchant adapter and receipt mapping in `packages/channel-adapters/src/merchant-sandbox.ts`
- [x] T042 [US2] Implement due-time evaluation and authorized follow-up orchestration in `packages/runtime/src/case-runner.ts`
- [x] T043 [US2] Implement the private Cloud Tasks worker endpoint in `apps/web/app/api/internal/tasks/run-case/route.ts`
- [x] T044 [US2] Implement callback authentication, dedupe, candidate extraction, and deterministic verification in `apps/web/app/api/callbacks/merchant/route.ts`
- [x] T045 [US2] Implement the Gemini evidence-reconciliation flow as a non-authoritative candidate producer in `packages/genkit-flows/src/reconcile-evidence.ts`
- [x] T046 [US2] Build waiting, retry, insufficient-evidence, and completion result views in `apps/web/app/cases/[caseId]/result/page.tsx`
- [x] T047 [US2] Build the ordered inspectable case timeline with claim limitations in `apps/web/components/case-timeline.tsx`
- [x] T048 [US2] Persist deduplicated intervention/completion notifications and add correlated IDs across product, worker, broker, verifier, and sandbox in `packages/runtime/src/notifications.ts` and `packages/observability/src/correlation.ts`
- [x] T049 [US2] Add the full refund walking-skeleton test including restart, exactly-once effects, and one completion notification in `tests/e2e/refund-walking-skeleton.spec.ts`
- [x] T050 [US2] Deploy both services and infrastructure to the development project using `infra/cloud-run/deploy.sh`, `infra/cloud-tasks/queue.yaml`, and `infra/firestore/firestore.rules`

**48-hour kill test**: Complete only the 15 observable results defined in `plan.md`, drawing the
smallest necessary subset from T001–T050. The task numbers are backlog order, not a requirement to
finish all fifty. Demonstrate upload → approval → delayed action → acknowledgement rejected →
retry/redelivery → signed evidence → `MERCHANT_CONFIRMED` proof and one notification on Cloud Run.
If this fails, freeze later phases and execute the documented pivot review.

## Phase 5: User Story 3 — Resolve Exceptions Without Losing Control (P2)

**Goal**: Ask for the smallest needed decision, deny out-of-scope action, and support stop, deletion, expiry, and reopen with history.

**Independent Test**: Reject mismatched evidence, exhaust retry, resolve the exception, stop future action, delete artifacts, and reopen a completed case without losing prior evidence.

- [x] T051 [P] [US3] Write exception, stop/revoke, expiry, deletion, and reopen integration tests in `tests/integration/case-control.test.ts`
- [x] T052 [P] [US3] Write cross-case isolation and artifact-link abuse tests in `tests/adversarial/isolation.test.ts`
- [x] T053 [US3] Implement intervention creation and minimal notification policy in `packages/runtime/src/interventions.ts`
- [x] T054 [US3] Build the exception decision surface in `apps/web/app/cases/[caseId]/exception/page.tsx`
- [x] T055 [US3] Implement stop, revoke, expire, delete, and reopen command endpoints in `apps/web/app/api/cases/[caseId]/control/route.ts`
- [x] T056 [US3] Implement artifact deletion and privacy-safe audit tombstones in `packages/persistence/src/retention.ts`
- [x] T057 [US3] Add end-to-end exception and reopen coverage in `tests/e2e/case-exception.spec.ts`

## Phase 6: User Story 4 — Reuse the Resolution Model (P3)

**Goal**: Prove portability with manifest-driven bill-credit and replacement examples without adding production integrations.

**Independent Test**: Evaluate one next-bill credit and one replacement-tracking fixture against the same plan, reducer, broker, verifier, and audit semantics.

- [x] T058 [P] [US4] Define bill-credit and replacement manifests in `packages/test-fixtures/src/promise-manifests.ts`
- [x] T059 [P] [US4] Add expected evaluation cases for bill-credit and replacement evidence in `packages/test-fixtures/src/evaluation-corpus.ts`
- [x] T060 [US4] Extend schema-driven plan and verifier predicates without new lifecycle branches in `packages/domain/src/promise-types.ts`
- [x] T061 [US4] Add portability tests proving common authority and completion semantics in `tests/integration/promise-portability.test.ts`

## Phase 7: Evaluation, Hardening, and Submission

**Purpose**: Produce honest measured evidence and a reproducible judge experience after the walking skeleton passes.

- [x] T062 [P] Implement the complete versioned 24-case corpus and expected outcomes in `packages/test-fixtures/src/evaluation-corpus.ts`
- [x] T063 [P] Add prompt-injection, malformed-file, unauthorized-action, duplicate, and denial-budget tests in `tests/adversarial/hostile-inputs.test.ts`
- [x] T064 Implement a Genkit evaluation runner that reports every case, failure, latency, model version, and cost basis in `scripts/evaluation/run.ts`
- [x] T065 Add bounded uploads, retries, case budgets, rate limits, and redacted errors in `apps/web/lib/security-limits.ts`
- [x] T066 Add deployed mobile Playwright verification and judge-safe demo reset in `tests/e2e/deployed-demo.spec.ts` and `scripts/demo/reset.ts`
- [x] T067 [P] Create the current architecture diagram with trust boundaries in `docs/architecture/actionos.md`
- [x] T068 [P] Update reproducible setup, deployment, controlled-service labels, limitations, and disclosures in `README.md`
- [x] T069 [P] Add the four-minute English demo script and evidence shot list in `docs/submission/demo-script.md`
- [x] T070 Record measured corpus results without invented metrics in `docs/evaluation/results.md`
- [x] T071 Run every command in `specs/001-resolve-commercial-promises/quickstart.md` and record deviations in `docs/evaluation/reproducibility.md`
- [ ] T072 Complete the official compliance checklist using only linked evidence in `docs/hackathon/compliance-checklist.md`
- [x] T073 Add one idempotent outbound email adapter for `NEEDS_ATTENTION` and `CASE_COMPLETED`, only after the kill test passes, in `packages/channel-adapters/src/outbound-email.ts`
- [x] T074 [P] Publish the consent-safe eight-person problem and usability study protocol in `docs/research/user-study-protocol.md`
- [ ] T075 Run the eight-person unassisted study and store anonymized timing, comprehension, errors, and failures in `docs/research/user-study-results.csv`
- [ ] T076 Report denominators and observed SC-001/SC-002 outcomes without invented claims in `docs/research/user-study-report.md`

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 is the mandatory critical path.
- US1 and US2 together form the only MVP and the 48-hour kill test.
- US3 begins only after the kill test passes.
- US4 is a portability proof and may run after the core schemas stabilize; it must not delay deployment.
- Evaluation, documentation, and submission evidence follow the deployed core, although fixtures and test cases may be prepared in parallel.

## Parallel Opportunities

- In Phase 1, T003–T006 touch independent configuration/docs files.
- In Phase 2, schemas/types/observability/Firestore configuration can start in parallel; reducer, policy, and verifier each follow their own failing tests.
- US1 fixtures and API/extraction tests can be written in parallel before implementation.
- US2 sandbox scenarios, broker contracts, adversarial callbacks, and durability tests are parallel test seams.
- US3 and US4 remain sequential priorities for a solo developer even where individual tasks carry `[P]`.

## Implementation Strategy

1. Finish deterministic contracts before model or UI work.
2. Complete US1 without external effects.
3. Complete US2 on deployed Cloud Run and run the kill test.
4. If the kill test passes, harden US3, add the two US4 manifests, and publish measured evaluation.
5. If it fails, preserve the reducer/verifier and document whether the blocking channel or product wedge must pivot before further work.
