import type { FollowThroughMission } from "@actionos/runtime/case-runner";
import type { EvidenceRecord } from "@actionos/runtime/evidence-service";
import { caseConversation } from "../lib/case-conversation";

export function CaseConversation({
  item,
  evidence,
  channelEvents
}: {
  readonly item: FollowThroughCase;
  readonly evidence: readonly EvidenceRecord[];
  readonly channelEvents: readonly { acceptedAt: string; transportStatus: string }[];
}) {
  const entries = caseConversation(item, evidence, channelEvents);
  if (entries.length === 0) return <section className="card"><h2>Conversation</h2><p>ActionOS has not contacted the company yet.</p></section>;
  return <section className="card case-conversation" aria-labelledby="conversation-title">
    <div className="eyebrow">Conversation</div><h2 id="conversation-title">What ActionOS and the company said</h2>
    <p>Only the approved outbound message and explicit, bounded reply facts are shown here.</p>
    <ol>{entries.map((entry) => <li key={entry.id} data-direction={entry.direction}>
      <div><strong>{entry.title}</strong><time dateTime={entry.occurredAt}>{entry.occurredAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.occurredAt)) : "Time unavailable"}</time></div>
      <p className="conversation-body">{entry.safeBody}</p><p className="conversation-reason"><span>{entry.status.replaceAll("_", " ")}</span>{entry.reason}</p>
    </li>)}</ol>
  </section>;
}
