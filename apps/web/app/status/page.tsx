import { AppHeader } from "../../components/app-header";
import { getRequestMessages } from "../../lib/i18n-server";

export default async function SystemStatusPage() {
  const copy = await getRequestMessages();
  return (
    <main className="shell">
      <AppHeader />
      <section className="hero compact">
        <div className="eyebrow">Platform Health</div>
        <h1>{copy.header.systemStatus}</h1>
        <p className="lede">Monitor ActionOS background workers, metrics, and API health.</p>
      </section>
      <div className="status-metrics">
        {/* Status metrics placeholder */}
      </div>
    </main>
  );
}
