# Tasks: Winning Follow-through Loop

## Phase 1 — Core autonomy (P0)

- [x] T001 Add silence, weak-ACK, duplicate, stale-proof and budget-exhaustion runtime tests
- [x] T002 Extend evidence persistence contract with atomic next-wake/version result
- [x] T003 Schedule the next logical wake after every eligible successful send
- [x] T004 Reschedule exactly once after insufficient non-conflicting evidence
- [x] T005 Run due `WAITING_EXTERNAL` work with version-bound idempotency and approved send budget
- [x] T006 Adapt later follow-up copy to the prior weak acknowledgement without widening authority
- [x] T007 Notify and intervene once when the approved logical-send budget is exhausted

## Phase 2 — Consumer truth (P0)

- [x] T008 Persist optional reviewed `counterpartyName` in new plans with legacy-safe fallback
- [x] T009 Render counterparty from the promise rather than recipient provider/domain
- [x] T010 Format money in major units and evidence levels as human phrases
- [x] T011 Use latest persisted activity and hide invalid/past next checks
- [x] T012 Add projection and browser regression tests for Northstar/USD 59/ACK states

## Phase 3 — Responsive current UX (P1)

- [x] T013 Add private artifact storage, lifecycle cleanup and transactional analysis-job persistence
- [x] T014 Make intake return an owned analyzing route and enqueue an OIDC Cloud Task before Gemini
- [x] T015 Add bounded analysis worker retries, status/retry API and re-openable analyzing page
- [x] T016 Replace empty case/inbox loaders with accessible orientation-preserving skeletons
- [x] T017 Generate example dates from an injected clock and keep accelerated demos immediately due
- [x] T018 Remove stale email capability copy and label the landing card as an example
- [x] T019 Reduce duplicate case-detail messaging while preserving the exact limitation
- [x] T020 Add mobile, keyboard, slow-load and reduced-motion browser coverage

## Phase 4 — Prize verification

- [x] T021 Run package/root tests, typecheck, lint, build, evaluation, emulator and diff checks
- [x] T022 Deploy and pin Firebase Hosting to the new Cloud Run revision
- [x] T023 Run sequential public silence/ACK/follow-up/proof, inbox and accessibility paths with
  one worker and zero retries
- [x] T024 Record redacted Cloud Task/action/evidence evidence and update final audit
- [x] T025 Re-audit the public product before reopening the video gate
