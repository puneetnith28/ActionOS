import type { RuntimeTimelineEvent } from "@actionos/runtime/timeline";
// Removed unused channel copy

function humanSummary(event: RuntimeTimelineEvent): string {
  if (event.reasonCodes.includes("CURRENT_PLAN_VERSION_APPROVED"))
    return "Mission execution plan authorized with boundaries validated.";
  if (event.reasonCodes.includes("ACTION_ACCEPTED"))
    return "Agent executed capability successfully.";
  if (event.reasonCodes.includes("INSUFFICIENT_STATUS"))
    return "Capability output did not satisfy the target state; execution loop remains active.";
  if (event.reasonCodes.includes("ACCEPTED"))
    return "Verification policy matched observed state; outcome verified.";
  return "Agent recorded a lifecycle transition within approved boundaries.";
}

export function MissionTimeline({
  events
}: {
  readonly events: readonly RuntimeTimelineEvent[];
}) {
  if (events.length === 0) {
    return <p>No persisted timeline events are available for this pre-ledger case.</p>;
  }
  return (
    <ol className="timeline">
      {events.map((event) => {
        const title: Record<RuntimeTimelineEvent["type"], string> = {
          PLAN_APPROVED: "Plan Authorized",
          ACTION_RESULT: "Capability Executed",
          EVIDENCE_RESULT: "State Verification",
          MISSION_CONTROL: "Manual Intervention"
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
              <p>{humanSummary(event)}</p>
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
