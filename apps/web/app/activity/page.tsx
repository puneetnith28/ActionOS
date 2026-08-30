import { AppHeader } from "../../components/app-header";
import { getRequestMessages } from "../../lib/i18n-server";
import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { firestore } from "../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const copy = await getRequestMessages();
  const store = new FirestoreRuntimeStore(firestore);
  const events = await store.listAll(50);
  
  return (
    <main className="shell">
      <AppHeader />
      <section className="hero compact">
        <div className="eyebrow">Execution Timeline</div>
        <h1>{copy.header.activity}</h1>
        <p className="lede">Monitor all agent actions, capabilities invoked, and system events.</p>
      </section>
      <div className="activity-feed">
        {events.length === 0 ? (
          <p className="empty-state">No execution history found across any missions.</p>
        ) : (
          <ol className="timeline">
            {events.map((event) => (
              <li key={event.historyId}>
                <span className="timeline-mark complete" />
                <div>
                  <strong>{event.eventType.replace(/_/g, " ")}</strong>
                  <p>
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
                      new Date(event.occurredAt)
                    )}
                    <span className="timeline-mission-id"> · {event.missionId}</span>
                  </p>
                  <p>{event.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
