import { AppHeader } from "../../components/app-header";
import { getRequestMessages } from "../../lib/i18n-server";

export default async function CapabilitiesPage() {
  const copy = await getRequestMessages();
  return (
    <main className="shell">
      <AppHeader />
      <section className="hero compact">
        <div className="eyebrow">ActionOS Integrations</div>
        <h1>{copy.header.capabilities}</h1>
        <p className="lede">Manage capabilities available for the agent to execute.</p>
      </section>
      <div className="capabilities-list">
        {/* Capabilities list placeholder */}
      </div>
    </main>
  );
}
