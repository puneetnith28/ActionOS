# Data Model: Consumer Case Inbox

## RecoverableOwner

- `ownerId`: stable Firebase UID used by server authorization.
- `isAnonymous`: whether recovery is unavailable.
- `providers`: bounded provider identifiers, never access tokens.
- `createdAt`, `linkedAt`, `lastSeenAt`.
- `notificationDestinationHash` and optional encrypted/config reference; list DTO exposes only redaction.

Invariant: linking cannot change the owner of an already executed case. An existing-account collision
may claim only the current unexecuted draft through a one-time transaction.

## IdentityClaim

- `claimId`, `sourceAnonymousOwnerId`, `targetOwnerId`, `caseId`.
- `status`: `PENDING | COMPLETED | REJECTED | EXPIRED`.
- `createdAt`, `completedAt`, `reasonCode`, `idempotencyKey`, `deleteAt`.

Invariant: one source case and one idempotency key produce at most one completed ownership change.

## CaseSummary (projection)

- `caseId`, `companyName`, `outcomeLabel`.
- `bucket`: `NEEDS_YOU | WORKING | DONE`.
- `statusLabel`, `lastActivityAt`, `lastActivityLabel`.
- `nextStepLabel`, `attentionRequired`, `channelLabel`.
- `updatedAt`, optional `cursorSortKey` (server only).

The projection contains no raw plan, recipient, evidence body, provider ID or control capability.

## ConversationEntry (projection)

- `entryId`, `direction`: `OUTBOUND | INBOUND | SYSTEM`.
- `actorLabel`, `occurredAt`, `subjectLabel`, `safeExcerpt`.
- `transportStatus`, `authenticityStatus`, `evidenceStatus`.
- `reasonLabels`, `explicitFacts`, `sourceRecordIds` (technical disclosure only).

Invariant: `safeExcerpt` is length-bounded and redacted. Expected plan values are never inserted as
observed inbound facts.

## OutcomeComparison

- `field`, `promisedValue`, `observedValue`, `status`: `MATCH | MISSING | CONFLICT | NOT_REQUIRED`.
- `sourceLabel`, `evidenceLevel`, `claimText`, `limitationText`.

Invariant: completion can show `MATCH` only for explicit accepted evidence. Transport receipt and
provider signature alone never populate outcome facts.

## NotificationRecord (extended)

- Existing: IDs, owner, case, correlation, kind, deep link, timestamps.
- `kind`: add terminal failure if needed: `NEEDS_ATTENTION | CASE_COMPLETED | CASE_FAILED`.
- `deliveryChannel`: `IN_APP | EMAIL`.
- `deliveryStatus`: `RECORDED | PLANNED | ATTEMPTED | ACCEPTED | DELIVERED | BOUNCED | SUPPRESSED | FAILED | UNAVAILABLE`.
- `destinationHash`, `destinationRedaction`, `attemptCount`, `lastAttemptAt`, `deliveryId`.

Transitions:

```text
RECORDED → PLANNED → ATTEMPTED → ACCEPTED → DELIVERED
                         ├──────→ FAILED
                         └──────→ SUPPRESSED
ACCEPTED → BOUNCED | SUPPRESSED
```

Provider acceptance is not called delivery. Case state never depends on notification state.

## TechnicalRunProjection

- `correlationId`, ordered `steps`.
- Each step: `stage`, `status`, `occurredAt`, `safeReasonCodes`, `safeRecordId`, `serviceLabel`.
- Stages: `MODEL | DURABLE_TASK | POLICY | EXTERNAL_ACTION | INBOUND_AUTH | VERIFIER | NOTIFICATION | STATE`.

Invariant: derived only from persisted allowlisted fields for owned synthetic/demo cases.

## CaseExport

- `generatedAt`, redacted owner/case label, promise summary, conversation entries,
  outcome comparison, claim and limitation.

Invariant: contains no token, live deep link, full email, raw artifact, provider payload or secret.

## Existing FollowThroughCase additions

- Add/derive `updatedAt` on every lifecycle mutation for stable inbox ordering.
- Preserve `ownerId` and current state/version CAS semantics.
- No migration is required for display-only fields; projection falls back to event/case timestamps.

## Required indexes

- `caseRuns(ownerId ASC, updatedAt DESC, caseId DESC)`.
- Existing notification/intervention case indexes remain.
- Identity claims use direct document/idempotency lookup, not cross-tenant collection scans.
