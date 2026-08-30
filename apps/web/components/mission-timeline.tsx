import type { RuntimeTimelineEvent } from "@actionos/runtime/timeline";
import { channelCopy, type ActiveCaseChannel } from "../lib/channel-copy";

function humanSummary(event: RuntimeTimelineEvent, channel: ActiveCaseChannel): string {
  const copy = channelCopy(channel);
  if (event.reasonCodes.includes("CURRENT_PLAN_VERSION_APPROVED"))
    return "You approved this exact version before ActionOS acted.";
  if (event.reasonCodes.includes("ACTION_ACCEPTED"))
    return copy.actionSummary;
  if (event.reasonCodes.includes("INSUFFICIENT_STATUS"))
    return "Not enough: this reply only acknowledged the request, so the mission stayed open.";
  if (event.reasonCodes.includes("ACCEPTED"))
    return copy.acceptedEvidence;
  return "ActionOS recorded this step without changing the approved limits.";
}

export function MissionTimeline({
  events,
  channel
}: {
  readonly events: readonly RuntimeTimelineEvent[];
  readonly channel: ActiveCaseChannel;
}) {
  if (events.length === 0) {
    return <p>No persisted timeline events are available for this pre-ledger case.</p>;
  }
  return (
    <ol className="timeline">
      {events.map((event) => {
        const copy = channelCopy(channel);
        const title: Record<RuntimeTimelineEvent["type"], string> = {
          PLAN_APPROVED: "Plan approved by you",
          ACTION_RESULT: copy.actionTitle,
          EVIDENCE_RESULT: copy.evidenceTitle,
          MISSION_CONTROL: "Mission control used"
        };
        const rejected = event.reasonCodes.some((reason) =>
          ["INSUFFICIENT", "WRONG", "INVALID", "EXHAUSTED", "DENIED"].some((token) =>
            reason.includes(token)
          )
        );
        return (
          <li key={event.eventId}>
            <span className={`timeline-mark ${rejected ? "rejected" : "complete"}`} />
            <div>
              <strong>{title[event.type]}</strong>
              <p>
                {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
                  new Date(event.occurredAt)
                )}
              </p>
              <p>{humanSummary(event, channel)}</p>
              <details className="technical-details">
                <summary>Technical details</summary>
                <code>actor: {event.actor}</code>
                <code>state: {event.state}</code>
                <code>reason: {event.reasonCodes.join(", ")}</code>
                {event.receiptId ? <code>receipt: {event.receiptId}</code> : null}
                {event.idempotencyKey ? <code>action: {event.idempotencyKey}</code> : null}
                {event.outcomeId ? <code>verification: {event.outcomeId}</code> : null}
                <code>correlation: {event.correlationId}</code>
              </details>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
