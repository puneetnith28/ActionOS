# Data Model: Resolve Commercial Promises

## Conventions

- IDs are opaque, stable, and globally unique within their entity type.
- Timestamps are UTC ISO-8601 values at boundaries.
- Money uses integer minor units plus ISO-4217 currency.
- Every mutable aggregate carries an integer `version` for optimistic concurrency.
- Raw source content is referenced, not embedded in logs or domain events.
- Model-produced objects are candidates until deterministic validation accepts them.

## Person

| Field                   | Meaning          | Rules                              |
| ----------------------- | ---------------- | ---------------------------------- |
| `person_id`             | Owner identity   | Opaque; immutable                  |
| `primary_channel`       | Return channel   | Verified before sensitive approval |
| `locale`                | Review language  | Defaults to English for judging    |
| `created_at`            | Account creation | Immutable                          |
| `deletion_requested_at` | Erasure request  | Nullable                           |

One Person owns zero or more Cases. P0 has exactly one owner per Case.

## SourceArtifact

| Field                 | Meaning                                    | Rules                         |
| --------------------- | ------------------------------------------ | ----------------------------- |
| `artifact_id`         | Artifact identity                          | Immutable                     |
| `person_id`           | Owner                                      | Required                      |
| `case_id`             | Associated case                            | Nullable until draft created  |
| `media_type`          | PDF/JPEG/PNG/text                          | Allowlisted                   |
| `sha256`              | Content identity                           | Used for duplicate detection  |
| `storage_ref`         | Private object reference                   | Never public                  |
| `source_channel`      | Upload/email/fixture                       | Required                      |
| `external_message_id` | Channel identity                           | Optional; unique with channel |
| `received_at`         | Intake time                                | Immutable                     |
| `retention_until`     | Planned removal                            | Required                      |
| `trust_label`         | user-supplied/counterparty/sandbox/fixture | Required                      |

Duplicate intake key: `(person_id, source_channel, external_message_id)` when present; otherwise a
bounded combination including artifact hash and explicit user confirmation.

## FieldProvenance

| Field          | Meaning                               |
| -------------- | ------------------------------------- |
| `artifact_id`  | Origin artifact                       |
| `locator`      | Page/region/message-part reference    |
| `excerpt_hash` | Hash of cited source segment          |
| `confidence`   | `HIGH`, `MEDIUM`, `LOW`, or `UNKNOWN` |

Every critical extracted field references at least one provenance record.

## CommercialPromise

| Field                   | Meaning                                 | Validation                       |
| ----------------------- | --------------------------------------- | -------------------------------- |
| `promise_id`            | Promise identity                        | Immutable                        |
| `promisor`              | Counterparty identity/display name      | Required before approval         |
| `promise_type`          | refund/bill-credit/replacement          | Allowlisted P0/P1 manifests      |
| `expected_level`        | Required evidence level                 | Required                         |
| `amount_minor`          | Promised amount                         | Required for refund/credit       |
| `currency`              | Promised currency                       | Required with amount             |
| `subject`               | Product/service/replacement description | Required when no amount          |
| `transaction_ref`       | Original reference                      | Required for refund P0           |
| `counterparty_case_ref` | Existing request reference              | Optional initially               |
| `due_at`                | Absolute due time                       | May be derived from condition    |
| `due_condition`         | Relative/business condition             | Preserved alongside derived time |
| `provenance`            | Per-field source records                | Required for critical fields     |

## ResolutionPlan

| Field                   | Meaning                            | Rules                         |
| ----------------------- | ---------------------------------- | ----------------------------- |
| `plan_id`               | Plan identity                      | Immutable                     |
| `case_id`               | Case                               | Required                      |
| `version`               | Approved version boundary          | Monotonic                     |
| `goal`                  | Exact claimed outcome              | Required                      |
| `allowed_actions`       | Closed action set                  | Required                      |
| `allowed_recipient`     | Counterparty destination           | Closed value                  |
| `shared_fields`         | Explicit data allowlist            | Required                      |
| `approval_rules`        | Decisions requiring new approval   | Required                      |
| `evidence_requirements` | Deterministic predicates           | At least one                  |
| `expires_at`            | Authority expiry                   | Required                      |
| `plan_hash`             | Canonical content hash             | Required for approval binding |
| `status`                | draft/approved/rejected/superseded | Deterministic                 |

Changing any authority-bearing field creates a new version and invalidates prior approval.

## Approval

| Field          | Meaning                     | Rules                     |
| -------------- | --------------------------- | ------------------------- |
| `approval_id`  | Approval identity           | Immutable                 |
| `case_id`      | Case                        | Required                  |
| `plan_version` | Authorized version          | Must equal current plan   |
| `plan_hash`    | Authorized content          | Must match canonical plan |
| `person_id`    | Approver                    | Must own case             |
| `approved_at`  | Decision time               | Required                  |
| `expires_at`   | Approval expiry             | Required                  |
| `consumed_at`  | Single-use link consumption | Optional                  |
| `revoked_at`   | Revocation                  | Optional                  |

## Case

| Field                       | Meaning              | Rules                    |
| --------------------------- | -------------------- | ------------------------ |
| `case_id`                   | Aggregate identity   | Immutable                |
| `person_id`                 | Owner                | Required                 |
| `promise_id`                | Promise              | Required                 |
| `current_plan_id`           | Active plan          | Required after drafting  |
| `state`                     | Lifecycle state      | Reducer controlled       |
| `version`                   | Concurrency version  | Increment per transition |
| `next_wake_at`              | Scheduled evaluation | Optional                 |
| `last_event_sequence`       | Ordered event cursor | Monotonic                |
| `created_at` / `updated_at` | Lifecycle times      | Required                 |
| `completed_at`              | Completion time      | Only in `DONE`           |

### State transitions

```text
DRAFT → AWAITING_APPROVAL
AWAITING_APPROVAL → READY | DRAFT | CANCELLED
READY → RUNNING
RUNNING → WAITING_EXTERNAL | WAITING_RETRY | NEEDS_ATTENTION | DONE | FAILED
WAITING_EXTERNAL → RUNNING | WAITING_RETRY | NEEDS_ATTENTION
WAITING_RETRY → READY | NEEDS_ATTENTION
NEEDS_ATTENTION → READY | CANCELLED | EXPIRED
DONE → NEEDS_ATTENTION (user reopens)
any non-terminal → CANCELLED | EXPIRED where policy permits
```

`DONE` is legal only with a successful Verification tied to the current plan.

## ActionRecord

| Field                      | Meaning                                               | Rules                               |
| -------------------------- | ----------------------------------------------------- | ----------------------------------- |
| `action_id`                | Stable logical action                                 | Deterministic from case/plan/action |
| `idempotency_key`          | External effect key                                   | Unique                              |
| `case_id` / `plan_version` | Authority context                                     | Required                            |
| `action_type`              | Closed broker tool                                    | Required                            |
| `recipient`                | Exact destination                                     | Must satisfy plan                   |
| `shared_field_hash`        | Shared payload audit                                  | No raw PII                          |
| `status`                   | authorized/dispatched/pending/succeeded/denied/failed | Controlled                          |
| `attempt_count`            | Deliveries attempted                                  | Bounded                             |
| `external_receipt_id`      | Counterparty receipt                                  | Optional until accepted             |

## EvidenceRecord

| Field                       | Meaning                      | Rules                      |
| --------------------------- | ---------------------------- | -------------------------- |
| `evidence_id`               | Evidence identity            | Immutable                  |
| `case_id`                   | Target case                  | Required                   |
| `artifact_id`               | Supporting source            | Required                   |
| `claim_level`               | Evidence level               | Enum                       |
| `amount_minor` / `currency` | Claimed money                | Required when applicable   |
| `transaction_ref`           | Original transaction         | Required for refund P0     |
| `counterparty_case_ref`     | Counterparty receipt         | Required for P0 completion |
| `issued_at`                 | Evidence time                | Required                   |
| `provenance`                | Origin and signature context | Required                   |
| `candidate_status`          | extracted/invalid            | Model-boundary result      |

## Verification

| Field                      | Meaning                               |
| -------------------------- | ------------------------------------- |
| `verification_id`          | Immutable result identity             |
| `case_id` / `plan_version` | Exact policy evaluated                |
| `evidence_ids`             | Evidence evaluated                    |
| `status`                   | accepted/rejected/needs-more-evidence |
| `reason_codes`             | Deterministic explanations            |
| `policy_version`           | Verifier rules used                   |
| `verified_at`              | Evaluation time                       |

## CaseEvent

| Field            | Meaning                             | Rules                    |
| ---------------- | ----------------------------------- | ------------------------ |
| `event_id`       | Dedupe identity                     | Unique                   |
| `case_id`        | Aggregate                           | Required                 |
| `sequence`       | Ordered position                    | Unique per case          |
| `type`           | Domain event                        | Versioned enum           |
| `actor`          | person/system/model/adapter/sandbox | Required                 |
| `occurred_at`    | Event time                          | Required                 |
| `correlation_id` | Cross-service trace                 | Required                 |
| `payload_hash`   | Auditable payload identity          | No raw sensitive content |
| `schema_version` | Event compatibility                 | Required                 |

Core events are defined in [contracts/domain-events.md](contracts/domain-events.md).

## Deletion behavior

Deletion marks the case inaccessible, revokes future actions, cancels schedulable work where
possible, and removes source artifacts according to the documented retention policy. Minimal
security/audit tombstones may retain opaque IDs, hashes, reason, and time but no source content or
user-facing evidence.
