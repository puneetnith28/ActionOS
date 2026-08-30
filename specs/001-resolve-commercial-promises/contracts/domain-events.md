# Domain Event Contract

All events share:

```json
{
  "event_id": "evt_opaque",
  "case_id": "case_opaque",
  "sequence": 7,
  "type": "EVIDENCE_REJECTED",
  "actor": "verifier",
  "occurred_at": "2026-08-15T18:00:00Z",
  "correlation_id": "run_opaque",
  "payload_hash": "sha256:...",
  "schema_version": 1,
  "data": {}
}
```

## Event types

| Event                     | Minimum data                        | Effect                       |
| ------------------------- | ----------------------------------- | ---------------------------- |
| `INTAKE_ACCEPTED`         | artifact ID, channel, dedupe key    | Starts a draft               |
| `INTAKE_DEDUPLICATED`     | original intake ID                  | No new case                  |
| `PROMISE_DRAFTED`         | promise ID, provenance summary      | Adds candidate promise       |
| `PLAN_CREATED`            | plan ID, version, hash              | Awaits review                |
| `PLAN_APPROVED`           | approval ID, plan version/hash      | Makes execution eligible     |
| `PLAN_SUPERSEDED`         | old/new version                     | Invalidates old approval     |
| `CASE_READY`              | next command                        | Eligible for dispatch        |
| `ACTION_AUTHORIZED`       | action ID, plan version             | Broker may dispatch          |
| `ACTION_DENIED`           | action ID, reason                   | No external call             |
| `ACTION_DISPATCHED`       | action ID, attempt                  | Records delivery             |
| `COUNTERPARTY_PENDING`    | receipt ID                          | Waits for evidence           |
| `RETRY_SCHEDULED`         | action ID, due time, attempt        | Delayed retry                |
| `RETRY_EXHAUSTED`         | action ID, reason                   | Needs attention              |
| `CALLBACK_RECEIVED`       | external event ID, signature status | Starts validation            |
| `CALLBACK_REJECTED`       | reason                              | No state change except audit |
| `EVIDENCE_ATTACHED`       | evidence ID, level                  | Candidate evidence           |
| `EVIDENCE_REJECTED`       | verification ID, reason codes       | Remains active               |
| `EVIDENCE_ACCEPTED`       | verification ID                     | Enables completion           |
| `CASE_COMPLETED`          | verification ID, claimed level      | Enters `DONE`                |
| `CASE_NEEDS_ATTENTION`    | reason, requested decision          | Awaits person                |
| `CASE_CANCELLED`          | actor, reason                       | Stops future actions         |
| `CASE_EXPIRED`            | policy reason                       | Stops future actions         |
| `CASE_REOPENED`           | prior completion event, reason      | Returns to attention         |
| `CASE_DELETION_REQUESTED` | actor                               | Revokes and begins erasure   |

## Ordering and replay

- `event_id` deduplicates incoming commands/events.
- `sequence` is assigned transactionally per case.
- Consumers MUST tolerate the same event more than once.
- A command supplies `expected_case_version`; a mismatch reloads and re-evaluates rather than
  overwriting.
- Late callbacks are retained for audit but cannot mutate terminal/cancelled cases without an
  explicit legal transition.
