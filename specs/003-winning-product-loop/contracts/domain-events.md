# Domain Events: Winning Product Loop

Events use the current case envelope plus `sequence`, `schemaVersion`, safe display copy,
`sourceCollection/sourceRecordId` and a payload hash. They are persisted read/audit projections;
authoritative state remains in draft/run/action/evidence records.

| Event | Actor | Required safe evidence |
| --- | --- | --- |
| `EVIDENCE_SECURED` | SYSTEM | artifact ID/hash prefix and accepted media type |
| `ANALYSIS_QUEUED` | SYSTEM | job/version and task identity |
| `ANALYSIS_STARTED` | SYSTEM | attempt, lease and model config identity |
| `ANALYSIS_RETRY_SCHEDULED` | SYSTEM | safe failure class and retry time |
| `ANALYSIS_CANCELLED` | PERSON | job version and cancellation reason |
| `ANALYSIS_LATE_RESULT_DISCARDED` | SYSTEM | stale job/version reason |
| `REVIEW_READY` | SYSTEM | current plan version/hash prefix and blocker count |
| `PROMISE_CONTRACT_REVISED` | PERSON | changed field names and old/new plan version |
| `EXECUTION_MODE_SELECTED` | PERSON | mode and timing policy version |
| `RECOVERABLE_IDENTITY_LINKED` | PERSON | provider class, never provider token/email |
| `PLAN_APPROVED` | PERSON | version/hash prefix, mode, channel and expiry |
| `ACTION_SCHEDULED` | SYSTEM | relative/real timing label and task identity |
| `ACTION_AUTHORIZED` | SYSTEM | action ordinal, policy version and reason codes |
| `ACTION_PROVIDER_ACCEPTED` | ADAPTER | receipt and idempotency prefixes |
| `RESPONSE_INSUFFICIENT` | SYSTEM | missing fields/authentication/evidence reasons |
| `ACTION_RETRY_SCHEDULED` | SYSTEM | bounded attempt and safe reason |
| `EVIDENCE_ACCEPTED` | SYSTEM | exact evidence level and verifier reasons |
| `EVIDENCE_REJECTED` | SYSTEM | verifier reasons and next bounded behavior |
| `NOTIFICATION_RECORDED` | SYSTEM | kind, channel and dedupe prefix |
| `NOTIFICATION_STATUS_CHANGED` | ADAPTER | exact transport state and safe reason |
| `CASE_STOPPED` | PERSON | authority revoked version |
| `CASE_DISPUTED` | PERSON | prior result level and reopen requirement |
| `EMAIL_READINESS_CHANGED` | SYSTEM | deployment/config fingerprints and gate reasons |

## Ordering and idempotency

- Event identity is stable for the source transition/record, not random on retry.
- Sequence allocation and source transition commit in the same Firestore transaction where possible.
- A duplicate source identity produces no second logical event.
- Missing projection events may be repaired from source records; projections never repair source state.
- User timeline returns `visibility=USER`; Evidence Console may additionally return redacted
  `visibility=JUDGE` events for an owned synthetic demo case.

## Prohibited event implications

- `ANALYSIS_STARTED` does not imply valid extraction.
- `ACTION_AUTHORIZED` or `ACTION_PROVIDER_ACCEPTED` does not imply delivery or result.
- Provider webhook validity does not imply expected counterparty identity.
- `REQUEST_ACKNOWLEDGED` cannot map to `EVIDENCE_ACCEPTED` for a merchant-confirmed requirement.
- Notification delivery cannot transition business lifecycle.
