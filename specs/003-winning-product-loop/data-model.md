# Data Model: Winning Product Loop

## ExecutionModePolicy

- `executionMode`: `ACCELERATED_DEMO | CONTROLLED_REAL_PILOT`
- `policyVersion`
- `counterpartyType`: `CONTROLLED_SANDBOX | CONTROLLED_EMAIL`
- `timing`: relative initial delay, acknowledgement delay, confirmation delay, retry delay
- `disclosureVersion`, `disclosureAcceptedAt`
- `available`, `reasonCodes`, `checkedAt`

The mode and timing policy are canonical plan inputs. Acceleration never alters authorization or
evidence rules.

## AnalysisJob

- `analysisJobId`, `caseId`, `ownerId`, `artifactId`, `sourceHash`
- `state`: `QUEUED | LEASED | EXTRACTING | VALIDATING | REVIEW_READY | RETRY_PENDING | FAILED | CANCELLED`
- `version`, `attemptCount`, `leaseOwner?`, `leaseExpiresAt?`
- `modelBudgetKey`, `modelCallId?`, `modelName?`, `modelConfigVersion?`
- `lastErrorCode?`, `retryAt?`, `createdAt`, `updatedAt`, `completedAt?`, `deleteAt`

### Analysis transitions

```text
QUEUED → LEASED → EXTRACTING → VALIDATING → REVIEW_READY
                     │              │
                     └──────→ RETRY_PENDING → LEASED
                     └──────→ FAILED
QUEUED|LEASED|EXTRACTING|VALIDATING|RETRY_PENDING → CANCELLED
```

A worker publishes a plan only through compare-and-set on job version and allowed current state.

## EditablePromiseContract

Extends current `PromiseDraft` and Resolution Plan:

- `promiseType`
- `promisor`, `result`, `amountMinor?`, `currency?`, `transactionRef`
- `itemOrSubject?`, `dueAt?`, `dueCondition?`, `followUpAt?`
- `contactTarget`: channel type, recipient, sender, reply route
- `evidenceRequirements[]`
- for each fact: value, provenance[], uncertainty, `source: MODEL | USER_CORRECTION`
- `executionMode`, `timingPolicyVersion`
- `version`, `planHash`, approval and expiry

Every action-authorizing mutation increments version and recomputes the canonical hash.

## CaseOwnerIdentity

- `ownerId`: stable internal owner identity
- `firebaseUids[]`: linked provider identities
- `providers[]`: `ANONYMOUS | GOOGLE`
- `recoverable`: boolean
- `primaryProviderUid?`, `linkedAt`, `lastAuthenticatedAt`, `deleteAt?`

Activation requires `recoverable=true`. Firestore ownership remains keyed by stable `ownerId`, not a
transient anonymous UID.

## CaseOwnershipClaim

- `claimId`, `caseId`, `fromAnonymousUid`, `toOwnerId`
- `status`: `RESERVED | APPLIED | REJECTED`
- `createdAt`, `appliedAt?`, `reasonCode?`

Unique by case. The claim transaction prevents two recoverable owners from claiming one draft.

## CaseEvent

- `eventId`, `caseId`, `ownerId`, `sequence`, `schemaVersion`
- `type`, `actor`: `PERSON | SYSTEM | MODEL | ADAPTER`
- `occurredAt`, `correlationId`, `reasonCodes[]`
- `sourceCollection`, `sourceRecordId`, `payloadHash`
- `display`: safe title, summary, consequence, evidence level?, next action?
- `visibility`: `USER | JUDGE`
- `deleteAt`

Sequence is assigned transactionally per case. Events are audit/read projections and do not replace
the authoritative lifecycle record.

## EvidenceAuthenticityAssessment

- `providerEventId`, `inboundId`, `caseId`
- `providerSignature`: `VALID | INVALID | UNKNOWN`
- `senderMatch`: `EXPECTED | UNEXPECTED | AMBIGUOUS`
- `threadMatch`: `EXACT | MISMATCH | UNKNOWN`
- `domainAuthentication`: safe normalized SPF/DKIM/DMARC result when provider supplies it
- `reasonCodes[]`, `assessedAt`

Provider signature validity alone never sets `senderMatch` or evidence validity.

## ExplicitInboundEvidenceCandidate

- existing evidence identity, case, level, issued time and candidate issuer
- optional `amountMinor`, `currency`, `transactionRef`, `subject`, `billPeriod`, `trackingNumber`
- per present field: normalized value plus inbound locator/hash/provenance
- `missingRequiredFields[]`
- authenticity assessment reference
- `modelInterpretationId?`, uncertainty and changed terms

No optional evidence value receives a default from the plan requirement.

## EmailReadiness

- `readinessId`, `deploymentRevision`, `configurationFingerprint`
- gates: verified sender, reply domain, webhook, secret access, allowlist, outbound smoke, inbound
  smoke, thread correlation, weak-proof rejection
- `status`: `AVAILABLE | UNAVAILABLE | EXPIRED`
- controlled address/domain fingerprints only
- `checkedAt`, `expiresAt`, `reasonCodes[]`

Readiness is valid only for the matching deployment/configuration fingerprint and before expiry.

## NotificationRecord

Extends the current entity:

- existing notification ID, dedupe key, case, owner, kind and deep link
- `channel`: `IN_APP | EMAIL`
- `status`: `RECORDED | ACCEPTED | DELIVERED | BOUNCED | SUPPRESSED | FAILED | UNAVAILABLE`
- provider identity/fingerprint, attempts and timestamps

Notification delivery never affects evidence or case completion.

## EvidenceConsoleProjection

Computed, not independently authoritative:

- case/correlation safe identity and deployed revision
- model name/config, observed latency/usage/cost status
- analysis job attempts/stages
- plan version/hash prefix and approval status
- task/action ordinal, authorization reasons, idempotency prefix
- adapter/receipt state, callback authentication state
- verifier reason codes and evidence level
- notification record/status

Only allowlisted fields are serializable. Raw artifacts, prompts, bodies, addresses, signatures,
tokens and secrets have no schema field.

## LiveModelEvaluationRun

- `evaluationRunId`, `corpusVersion`, `gitCommit`, `model`, `modelConfigVersion`, `executedAt`
- per case: fixture ID, status, expected/observed fields, provenance/uncertainty result, latency,
  usage, estimated cost and safe failure code
- aggregates with denominators, never dropping failed cases
- output artifact hash and tool version

## ReleaseGate

- `gateId`, `kind`: eligibility, repository, app, video, language, architecture, cloud evidence,
  Devpost, claim
- `status`: `MISSING | INVALID | VERIFIED | MANUAL_CONFIRMATION_REQUIRED`
- `evidenceReference?`, `verifiedAt?`, `verifiedBy`, `reasonCodes[]`

External/manual claims remain manual confirmations with recorded evidence references; the validator
does not pretend to verify facts it cannot observe.

## Relationships and Invariants

- One submitted source identity produces at most one active case per owner and one current AnalysisJob.
- One AnalysisJob publishes at most one current review plan.
- One case has one stable owner; linking adds provider identities rather than rewriting every record.
- Activation requires a recoverable owner and approval of the current mode/plan version/hash.
- One authoritative state transition may append one or more typed projection events transactionally.
- Evidence candidate facts are a subset of explicitly supported inbound facts.
- Missing required evidence always prevents deterministic acceptance.
- One email readiness record applies only to its exact deployment/configuration fingerprint.
- Evidence Console is available only for owned synthetic demo cases under enabled judge mode.
- Release gates record evidence; they do not manufacture external proof.
