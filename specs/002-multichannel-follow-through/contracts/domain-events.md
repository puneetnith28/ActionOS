# Domain Events: Multichannel Follow-Through

All events use the existing ordered case timeline envelope: event ID, case ID, sequence, actor,
occurred-at, correlation ID, payload hash and schema version.

| Event | Actor | Required reason/evidence |
| --- | --- | --- |
| `CHANNEL_SELECTED` | PERSON | channel type, capability policy version |
| `CONVERSATION_PLAN_REVISED` | PERSON | old/new plan version and hash |
| `ACTION_SCHEDULED` | SYSTEM | action identity and wake time |
| `ACTION_SEND_STARTED` | SYSTEM | idempotency identity and channel |
| `ACTION_PROVIDER_ACCEPTED` | ADAPTER | receipt/provider message identity |
| `ACTION_DELIVERED` | ADAPTER | signed provider event identity |
| `ACTION_BOUNCED` | ADAPTER | safe bounce class |
| `ACTION_SUPPRESSED` | ADAPTER | safe suppression/complaint class |
| `INBOUND_EVENT_REJECTED` | SYSTEM | signature/replay/correlation reason |
| `INBOUND_MESSAGE_RECEIVED` | ADAPTER | inbound and exact thread identity |
| `INBOUND_INTERPRETED` | MODEL | interpretation identity and uncertainty |
| `RESPONSE_INSUFFICIENT` | SYSTEM | deterministic missing evidence reasons |
| `RESPONSE_REQUIRES_DECISION` | SYSTEM | changed term or authentication reason |
| `EVIDENCE_RESULT` | SYSTEM | verifier outcome and exact level |
| `NOTIFICATION_RECORDED` | SYSTEM | kind and dedupe identity |
| `NOTIFICATION_DELIVERY_UPDATED` | ADAPTER | delivery state and safe reason |

Transport events never imply `DONE`. Connectors append candidate events through runtime services and
cannot directly mutate the case lifecycle.
