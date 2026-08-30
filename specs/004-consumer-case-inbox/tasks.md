# Tasks: Consumer Case Inbox

**Input**: Design documents from `specs/004-consumer-case-inbox/`

**Tests**: Required. Add the named failing test before each implementation slice.

## Phase 1 — Traceability and Product Truth

- [x] T001 Create FR/SC-to-test traceability in `specs/004-consumer-case-inbox/checklists/completion-audit.md`
- [x] T002 [P] Add managed-email and sandbox projection fixtures in `packages/test-fixtures/src/case-projections.ts`
- [x] T003 [P] Add channel-copy failures to `apps/web/test/case-projection.test.ts`
- [x] T004 Implement server-side channel-aware projection in `apps/web/lib/case-projection.ts`
- [x] T005 Replace unconditional sandbox/callback copy in `apps/web/components/case-result.tsx` and `apps/web/components/case-timeline.tsx`
- [x] T006 Align live controlled-email claims in `README.md`, `docs/architecture/actionos.md`, `docs/hackathon/compliance-checklist.md` and `docs/submission/demo-script.md`

**Gate A**: managed-email UI contains zero sandbox-only labels; sandbox disclosure remains.

## Phase 2 — Foundational Ownership and Projection

- [x] T007 [P] Define identity-claim, case-summary, conversation, comparison and technical-step schemas in `packages/contracts/src/index.ts`
- [x] T008 [P] Add schema and redaction tests in `packages/contracts/test/consumer-case.test.ts`
- [x] T009 Add `updatedAt` invariant to case mutations in `packages/runtime/src/case-runner.ts` and persistence tests
- [x] T010 Define owner-history and fail-closed identity-collision policy in the existing case/Firebase boundaries (D-023 supersedes identity migration)
- [x] T011 Implement bounded owner query; intentionally omit transactional ownership merge under D-023
- [x] T012 Keep direct Firestore access deny-by-default and deploy indexes/TTL through the existing infrastructure gate
- [x] T013 Add cross-owner, cursor-tampering and fail-closed collision coverage; concurrent ownership claim is intentionally absent under D-023

## Phase 3 — User Story 1: Return to Every Follow-up (P1)

- [x] T014 [P] [US1] Add Firebase anonymous-to-Google link and collision unit tests in `apps/web/test/firebase-identity.test.ts`
- [x] T015 [P] [US1] Add case-list API contract tests in `apps/web/test/cases-controller.test.ts`
- [x] T016 [US1] Extend Firebase client with recoverable auth state and link/sign-in operations in `apps/web/lib/firebase-client.ts`
- [x] T017 [US1] Intentionally omit owner-claim route; Firebase UID-preserving link plus fail-closed existing-account collision is the accepted D-023 design
- [x] T018 [US1] Implement bounded owner list controller and route in `apps/web/lib/cases-controller.ts` and `apps/web/app/api/cases/route.ts`
- [x] T019 [US1] Build progressive activation identity component in `apps/web/components/recoverable-identity.tsx`
- [x] T020 [US1] Build mobile-first “My follow-ups” page in `apps/web/app/cases/page.tsx` and `apps/web/components/case-inbox.tsx`
- [x] T021 [US1] Add My follow-ups/sign-in state to `apps/web/components/app-header.tsx`
- [x] T022 [US1] Require recoverability before managed-email approval in `apps/web/components/plan-review.tsx` and `apps/web/lib/plan-controller.ts`
- [x] T023 [US1] Add two-browser recovery/denial E2E in `tests/e2e/cross-device-return.spec.ts` (real-identity execution remains a release claim gate)

**Gate B**: clean browser recovers the same case; a different owner receives no facts.

## Phase 4 — User Story 2: Understand the Case (P1)

- [x] T024 [P] [US2] Add safe conversation and Promised-vs-Observed projection tests in `apps/web/test/case-projection.test.ts`
- [x] T025 [P] [US2] Add legacy-record and network-failure browser fixtures in `tests/e2e/consumer-case-detail.spec.ts`
- [x] T026 [US2] Extend safe action/inbound read methods in `packages/persistence/src/runtime-store.ts`
- [x] T027 [US2] Implement consumer detail projection and redaction in `apps/web/lib/case-projection.ts`
- [x] T028 [US2] Add owner-checked detail route in `apps/web/app/api/cases/[caseId]/detail/route.ts`
- [x] T029 [US2] Build human case header and next-action component in `apps/web/components/case-status.tsx`
- [x] T030 [US2] Build readable bounded conversation in `apps/web/components/case-conversation.tsx`
- [x] T031 [US2] Build Promised-versus-Observed result in `apps/web/components/outcome-comparison.tsx`
- [x] T032 [US2] Refactor `apps/web/components/case-result.tsx` to use the consumer projection and progressive technical disclosure
- [x] T033 [US2] Preserve last-known state and add refresh/retry/last-updated behavior in `apps/web/components/case-result.tsx`
- [x] T034 [US2] Add responsive case-detail styles in `apps/web/app/globals.css`

**Gate C**: weak ACK visibly stays open; sufficient explicit evidence closes with exact limitation.

## Phase 5 — User Story 3: Durable Return (P1)

- [x] T035 [P] [US3] Add attention/completion/failure notification transition tests in `packages/runtime/test/notifications.test.ts`
- [x] T036 [P] [US3] Add concurrent replay/bounce/suppression tests in `tests/integration/attention-notification.test.ts`
- [x] T037 [US3] Extend truthful notification lifecycle contracts in `packages/runtime/src/notifications.ts`
- [x] T038 [US3] Connect intervention persistence to bounded delivery in `packages/runtime/src/interventions.ts` and all construction sites
- [x] T039 [US3] Emit terminal-failure notifications from `packages/runtime/src/case-runner.ts`
- [x] T040 [US3] Persist destination redaction, attempts and provider transitions in `packages/persistence/src/runtime-store.ts`
- [x] T041 [US3] Add owner notification retry controller/route in `apps/web/lib/notification-controller.ts` and `apps/web/app/api/cases/[caseId]/notifications/retry/route.ts`
- [x] T042 [US3] Render accepted/delivered/bounced/suppressed truth and retry action in `apps/web/components/case-result.tsx`
- [x] T043 [US3] Prove closed-tab attention return in `tests/e2e/consumer-case-inbox.spec.ts`

**Gate D**: replayed attention creates one logical notification and at most one provider send.

## Phase 6 — User Story 4: Narrow Intervention (P1)

- [x] T044 [P] [US4] Add concurrent stop/resume/dispute/reapproval tests in `tests/integration/case-control.test.ts`
- [x] T045 [US4] Extend intervention DTO with one decision and consequences in `packages/runtime/src/interventions.ts`
- [x] T046 [US4] Implement authority-changing correction through plan revision in `packages/runtime/src/case-control.ts`
- [x] T047 [US4] Extend case control API with expected version and idempotency key in `apps/web/lib/control-controller.ts`
- [x] T048 [US4] Refactor exception screen into one bounded decision in `apps/web/components/case-exception.tsx`
- [x] T049 [US4] Add stale approval and late-event adversarial tests in `tests/adversarial/case-control-races.test.ts`

## Phase 7 — User Story 5: Judge Evidence (P2)

- [x] T050 [P] [US5] Add redaction/eligibility contract tests in `tests/contract/technical-run.test.ts`
- [x] T051 [P] [US5] Add non-owner/non-synthetic denial tests in `tests/adversarial/technical-run-access.test.ts`
- [x] T052 [US5] Implement persisted allowlist projection in `packages/runtime/src/technical-run.ts`
- [x] T053 [US5] Add required safe read methods in `packages/persistence/src/runtime-store.ts`
- [x] T054 [US5] Add owner/synthetic-gated route in `apps/web/app/api/cases/[caseId]/technical-run/route.ts`
- [x] T055 [US5] Build “How ActionOS ran” drawer in `apps/web/components/technical-run.tsx`

## Phase 8 — User Story 6: Safe Export (P2)

- [x] T056 [P] [US6] Add export redaction/no-capability tests in `tests/contract/case-export.test.ts`
- [x] T057 [US6] Implement static export projection in `apps/web/lib/case-export.ts`
- [x] T058 [US6] Add owner-checked export route in `apps/web/app/api/cases/[caseId]/export/route.ts`
- [x] T059 [US6] Add copy/download control in `apps/web/components/case-result.tsx`

## Phase 9 — Release Validation

- [x] T060 Add keyboard/live-region/reduced-motion/200%-reflow tests in `tests/e2e/accessibility.spec.ts`
- [x] T061 Run full deterministic gates from `specs/004-consumer-case-inbox/quickstart.md`
- [x] T062 Deploy and run controlled-email continuous journey with workers 1/retries 0
- [x] T063 Record deployed revisions, redacted provider evidence and failures in `docs/evaluation/reproducibility.md`
- [ ] T064 Rehearse and record the four-minute inbox-return story in `docs/submission/demo-script.md`
- [x] T065 Validate every FR/SC and readiness claim in `specs/004-consumer-case-inbox/checklists/completion-audit.md`
- [x] T066 Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm evaluate` and `git diff --check`

## Dependency Order

```text
Product Truth → Ownership/Projection → US1 Inbox
                                   ├→ US2 Detail → US4 Intervention
                                   └→ US3 Durable Return
US2 → US5 Judge Evidence → US6 Export
All P1 gates → Release Validation
```

## Solo-Founder Strategy

Execute sequentially by kill gate. Stop feature expansion whenever A–D fails. US5 and US6 are bonus
only after the recoverable controlled-email path is deployed. No new channel or recipe enters this
task list before the continuous inbox-return demo passes.
