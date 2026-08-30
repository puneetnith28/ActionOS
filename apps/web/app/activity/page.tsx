import { AppHeader } from "../../components/app-header";
import { getRequestMessages } from "../../lib/i18n-server";

export default async function ActivityPage() {
  const copy = await getRequestMessages();
  return (
    <main className="shell">
      <AppHeader />
      <section className="hero compact">
        <div className="eyebrow">Execution Timeline</div>
        <h1>{copy.header.activity}</h1>
        <p className="lede">Monitor all agent actions, capabilities invoked, and system events.</p>
      </section>
      <div className="activity-feed">
        {/* Activity feed placeholder */}
      </div>
    </main>
  );
}
