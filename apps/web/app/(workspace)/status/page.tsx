import { getRequestLocale, getRequestMessages } from "../../../lib/i18n-server";

export default async function StatusPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 0" }}>
      <header style={{ marginBottom: "48px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "8px", fontWeight: 600 }}>System Health</h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "var(--text-lg)" }}>Real-time operational status</p>
      </header>

      {/* Overall Health */}
      <section style={{ marginBottom: "48px" }}>
        <div className="panel" style={{ padding: "32px", display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--success-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "var(--success)", fontSize: "24px" }}>✓</span>
          </div>
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "4px" }}>All Systems Operational</h2>
            <p style={{ color: "var(--fg-muted)", fontSize: "var(--text-sm)" }}>Last checked 2 minutes ago</p>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)", marginBottom: "16px" }}>SERVICES</h2>
        <div className="panel" style={{ padding: "0" }}>
          {[
            { name: "Gemini / Vertex AI", status: "Operational", latency: "142ms" },
            { name: "Mission Runtime", status: "Operational", latency: "89ms" },
            { name: "Firestore Persistence", status: "Operational", latency: "24ms" },
            { name: "Cloud Tasks Queue", status: "Operational", latency: "12ms" },
            { name: "Capability Registry", status: "Operational", latency: "—" },
          ].map((service, idx) => (
            <div key={service.name} className="flex-between" style={{ padding: "16px 24px", borderBottom: idx < 4 ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ fontSize: "14px", color: "var(--fg-base)" }}>{service.name}</span>
              <div className="flex-center gap-4">
                <span className="text-mono" style={{ fontSize: "12px", color: "var(--fg-subtle)" }}>{service.latency}</span>
                <div className="flex-center gap-2">
                  <span style={{ color: "var(--success)", fontSize: "14px" }}>●</span>
                  <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>{service.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Execution Metrics */}
      <section style={{ marginBottom: "48px" }}>
        <h2 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)", marginBottom: "16px" }}>EXECUTION (24h)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--fg-subtle)", marginBottom: "8px" }}>Active</div>
            <div style={{ fontSize: "24px", color: "var(--fg-base)", fontWeight: 600 }}>4</div>
          </div>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--fg-subtle)", marginBottom: "8px" }}>Completed</div>
            <div style={{ fontSize: "24px", color: "var(--fg-base)", fontWeight: 600 }}>37</div>
          </div>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--fg-subtle)", marginBottom: "8px" }}>Failed</div>
            <div style={{ fontSize: "24px", color: "var(--fg-base)", fontWeight: 600 }}>2</div>
          </div>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", color: "var(--fg-subtle)", marginBottom: "8px" }}>Avg Duration</div>
            <div style={{ fontSize: "24px", color: "var(--fg-base)", fontWeight: 600 }}>18.4s</div>
          </div>
        </div>
      </section>

      {/* Recent Events */}
      <section>
        <h2 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)", marginBottom: "16px" }}>RECENT EVENTS</h2>
        <div className="panel" style={{ padding: "0" }}>
          {[
            { time: "09:42", msg: "Mission started (ID: cas_1234)" },
            { time: "09:41", msg: "Capability Data Retrieval completed" },
            { time: "09:39", msg: "Mission completed (ID: cas_9876)" },
            { time: "09:15", msg: "Agent scaled up capacity" }
          ].map((evt, idx) => (
            <div key={idx} style={{ padding: "16px 24px", display: "flex", gap: "24px", borderBottom: idx < 3 ? "1px solid var(--border-subtle)" : "none" }}>
              <span className="text-mono" style={{ fontSize: "12px", color: "var(--fg-subtle)" }}>{evt.time}</span>
              <span style={{ fontSize: "13px", color: "var(--fg-muted)" }}>{evt.msg}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
