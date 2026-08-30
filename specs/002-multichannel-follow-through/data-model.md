# Data Model: Multichannel Follow-Through

## ChannelConfiguration

- `channelType`: `CONTROLLED_SANDBOX | MANAGED_EMAIL | GMAIL_CONNECTED | PARTNER_API`
- `status`: `AVAILABLE | DEGRADED | UNAVAILABLE | FUTURE`
- `capabilities`: send, receive, threading, deliveryReceipt, authenticatedReply, userOAuth
- `provider`: public provider identifier
- `senderDisplay`: safe human-readable sender identity
- `replyRouteDisplay`: redacted/safe reply route
- `policyVersion`
- `checkedAt`, `reasonCodes`

Secrets and raw tokens are never part of this entity.

## ConversationPlan

Extends the existing Resolution Plan:

- `channelType`
- `recipient`, `recipientFingerprint`, `recipientConfirmedAt`
- `senderIdentity`
- `replyRoutePolicy`
- `messageTemplateVersion`, `subject`, `body`
- `sharedFields`
- `firstSendAt`, `followUpIntervalSeconds`, `maxLogicalSends`
- `escalationRules`, `evidenceRequirements`, `expiresAt`
- `version`, `planHash`, `approval`

Changing any action-authorizing field creates a new version/hash.

## MessageThread

- `threadId`, `caseId`, `ownerId`, `channelType`
- `providerThreadId?`, `outboundProviderMessageIds[]`
- `opaqueReplyRoute`, `expectedSenderFingerprints[]`
- `createdAt`, `lastActivityAt`, `deleteAt`

## ActionReceipt

- `receiptId`, `caseId`, `actionId`, `idempotencyKey`, `channelType`
- `providerMessageId`, `recipientFingerprint`
- `transportStatus`: `ACCEPTED | DELIVERED | BOUNCED | COMPLAINED | SUPPRESSED | FAILED | UNKNOWN`
- `acceptedAt`, `observedAt`, `reasonCodes`, `correlationId`, `deleteAt`

Receipt status never represents business completion.

## ProviderEventReservation

- `provider`, `providerEventId`, `payloadHash`
- `signatureStatus`, `receivedAt`, `status`: `RESERVED | ENQUEUED | PROCESSED | REJECTED | FAILED`
- `attemptCount`, `lastErrorCode?`, `deleteAt`

Unique identity is `(provider, providerEventId)`.

## InboundEnvelope

- `inboundId`, `providerEventId`, `channelType`
- `caseId?`, `threadId?`, `correlationStatus`: `EXACT | AMBIGUOUS | UNKNOWN | REJECTED`
- `senderFingerprint`, `recipientRouteFingerprint`, `messageId`, `inReplyTo?`
- `subject`, bounded normalized `text`, `contentHash`
- `authentication`: provider signature, sender-domain signals and reason codes
- bounded attachment metadata and provenance
- `receivedAt`, `deleteAt`

## InboundInterpretation

- `inboundId`, `replyType`: `ACKNOWLEDGEMENT | STATUS | PROPOSAL_CHANGE | EVIDENCE | AUTO_REPLY | UNKNOWN`
- candidate evidence fields with provenance and uncertainty
- requested changes and missing fields
- model/version/config, usage, latency, createdAt

This object has no lifecycle authority.

## ChannelEvent

- `eventId`, `caseId`, `threadId?`, `sequence`
- `type`: action scheduled/sending/accepted/delivered/bounced/suppressed/inbound received/rejected
- `actor`, `occurredAt`, `correlationId`, `reasonCodes`, `payloadHash`

## NotificationDelivery

- Existing NotificationRecord identity and kind
- `channel`: `IN_APP | EMAIL`
- `status`: `RECORDED | ACCEPTED | DELIVERED | BOUNCED | SUPPRESSED | FAILED | UNAVAILABLE`
- provider receipt identity, attempts, timestamps and redacted reason codes

## Relationships and Invariants

- One case has one current ConversationPlan and zero or more historical versions.
- One approved plan may create at most `maxLogicalSends` action identities.
- One logical action has at most one successful ActionReceipt.
- One provider event reservation produces at most one InboundEnvelope.
- An InboundEnvelope affects only one exactly correlated case or none.
- Model interpretation cannot create ActionReceipt, Approval or `DONE`.
- `DONE` requires deterministic verification against current approved evidence requirements.
- Stop/revoke/expiry/deletion dominates scheduled execution.
