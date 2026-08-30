# Research: Consumer Case Inbox

## Decision 1 — Product surface is a personal inbox, not an email client or dashboard

**Decision**: Build “My follow-ups” as a compact owner-scoped inbox with Needs you, Working and Done
states. Email carries messages; the app owns state, control and evidence.

**Rationale**: This answers the user’s missing “what happens after?” while preserving DueBack’s
unique false-DONE and durable-execution story. It also lets the judge leave and return.

**Alternatives considered**: Email-only loses recovery/control; an enterprise dashboard is the wrong
mental model; a general chat/email client adds scope without improving the rubric.

## Decision 2 — Progressive recoverable identity before real action

**Decision**: Keep anonymous exploration and sandbox demos. Before managed-email activation, link
the current anonymous Firebase user to Google sign-in. If the credential belongs to an existing
owner, perform an explicit, transaction-safe claim/merge flow limited to the current unexecuted
draft; never silently swap UIDs or merge active histories.

**Rationale**: Google sign-in is familiar, cross-device and already within Firebase. Linking the
anonymous user preserves current ownership when the Google credential is new. The collision case
requires an explicit server transaction because client-only sign-in would strand the draft.

**Alternatives considered**: Email-link auth introduces cross-device continuation/linking complexity
and email-deliverability dependency; password auth adds friction; anonymous-only is not recoverable;
bearer magic links weaken ownership.

## Decision 3 — Server-derived safe projections

**Decision**: Create bounded `CaseSummary`, `CaseDetail`, `ConversationEntry` and `TechnicalRunStep`
DTOs server-side. Never return raw Firestore documents to list or judge views.

**Rationale**: Stable consumer wording, backward compatibility and redaction cannot safely be left
to React components. A projection layer also makes channel differences testable.

**Alternatives considered**: Rendering existing records directly leaks internals and repeats channel
logic; denormalizing all presentation into source records creates migration and integrity risk.

## Decision 4 — Firestore owner query with cursor pagination

**Decision**: Query `caseRuns` by exact `ownerId`, ordered by meaningful update timestamp and case ID,
with a bounded page and opaque cursor. Add the composite index to deploy automation.

**Rationale**: The dataset already places owner ID on each run. A query avoids a second ownership
index collection and remains rules-verifiable.

**Alternatives considered**: Client-side filtering is insecure; storing case IDs on a profile risks
transactional drift; unbounded list reads are costly and slow.

## Decision 5 — Notification creation and delivery are separate idempotent facts

**Decision**: Every attention/completion/failure transition creates one logical record. A delivery
service attempts the configured owner channel and records provider acceptance, later delivery,
bounce or suppression separately. Intervention creation must invoke delivery, not only persistence.

**Rationale**: A provider-accepted email is not proof that the user received it, and notification
delivery is never proof the company fulfilled the promise.

**Alternatives considered**: Sending inside UI polling fails when the page closes; fire-and-forget
email duplicates on retries; treating `ACCEPTED` as delivered overclaims evidence.

## Decision 6 — Conversation is evidence projection, not raw mailbox storage

**Decision**: Show bounded safe excerpts and extracted explicit facts with direction, timestamp,
transport/authenticity status and verifier reason. Do not expose full raw email bodies or headers.

**Rationale**: The product needs “what they said”, but raw correspondence increases privacy,
injection and retention risk. The existing inbound interpreter and evidence ledger already provide
the trustworthy facts.

**Alternatives considered**: Full thread UI turns DueBack into an email client; event labels alone
are too abstract; model summaries without citations could invent meaning.

## Decision 7 — Authority changes require reapproval

**Decision**: Resume/stop/dispute can be narrow case controls. Recipient, result, amount, deadline or
proof changes generate a new canonical plan/hash and invalidate the prior approval.

**Rationale**: This preserves DueBack’s strongest safety property and prevents a friendly consumer
UI from becoming an authorization bypass.

**Alternatives considered**: Direct inline mutation is convenient but unsafe; prohibiting all edits
leaves real exceptions unresolved.

## Decision 8 — Honest controlled pilot remains the public channel claim

**Decision**: Update stale documentation to say managed email is enabled only for controlled,
allowlisted pilot recipients after Gates A–C. Sandbox remains the reproducible fallback.

**Rationale**: The send and signed inbound path now has real evidence. Calling it disabled is false;
calling it universal is also false.

**Alternatives considered**: Hide the pilot and lose demo credibility; open arbitrary recipients and
create abuse/deliverability risk; replace Resend only to increase Google branding despite no suitable
Google transactional-email equivalent.
