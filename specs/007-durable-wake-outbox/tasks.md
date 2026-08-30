# Tasks — Feature 007

- [x] T001 Define stable `WakeIntent` and bounded outbox store contracts.
- [x] T002 Persist wake intent atomically with activation, runtime and evidence transitions.
- [x] T003 Persist the `RESUME` wake with the idempotent control transition.
- [x] T004 Add immediate idempotent dispatch and status projection.
- [x] T005 Add OIDC-protected bounded wake reconciliation route.
- [x] T006 Provision a once-per-minute Cloud Scheduler reconciliation job.
- [x] T007 Add chaos tests for enqueue failure, stale-task recovery and idempotent `RESUME`.
- [x] T008 Deploy with wake-intent TTL and dedicated scheduler job.
- [x] T009 Run deployed chaos evidence and prove zero duplicate external actions.
- [x] T010 Rerun the complete public judge path.
