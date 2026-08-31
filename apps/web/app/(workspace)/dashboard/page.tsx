import Link from "next/link";
import { getRequestLocale, getRequestMessages } from "../../../lib/i18n-server";

export default async function CommandCenter() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);
  
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 0" }}>
      <header style={{ marginBottom: "48px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "8px", fontWeight: 600 }}>Good morning, Puneet.</h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "var(--text-lg)" }}>What should ActionOS take care of?</p>
      </header>

      {/* Mission Composer */}
      <section style={{ marginBottom: "64px" }}>
        <div className="card" style={{ padding: "8px", display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-surface-elevated)" }}>
          <input 
            type="text" 
            placeholder="Prepare the weekly project report..." 
            style={{ flex: 1, background: "transparent", border: "none", color: "var(--fg-base)", fontSize: "var(--text-base)", outline: "none", padding: "12px 16px" }}
          />
          <Link href="/intake" className="btn btn-primary" style={{ padding: "10px 20px" }}>
            Run Mission <span style={{ opacity: 0.7 }}>→</span>
          </Link>
        </div>
      </section>

      {/* Active Missions */}
      <section style={{ marginBottom: "64px" }}>
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)" }}>ACTIVE MISSIONS</h2>
        </div>
        
        <div className="panel">
          <Link href="/missions/active-demo" style={{ display: "block", textDecoration: "none", padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }} className="nav-link" suppressHydrationWarning>
            <div className="flex-between" style={{ marginBottom: "8px" }}>
              <div className="flex-center gap-2">
                <span className="timeline-icon running" style={{ width: "16px", height: "16px" }}></span>
                <span style={{ fontWeight: 500, color: "var(--fg-base)" }}>Prepare weekly report</span>
              </div>
              <span className="badge badge-accent">RUNNING</span>
            </div>
            <div className="flex-between">
              <span style={{ fontSize: "13px", color: "var(--fg-subtle)" }}>Planning → Gathering → Compiling</span>
              <span className="text-mono" style={{ fontSize: "12px", color: "var(--fg-muted)" }}>2m 14s</span>
            </div>
          </Link>
          
          <Link href="/missions/completed-demo" style={{ display: "block", textDecoration: "none", padding: "16px 20px" }} className="nav-link" suppressHydrationWarning>
            <div className="flex-between" style={{ marginBottom: "8px" }}>
              <div className="flex-center gap-2">
                <span className="timeline-icon success" style={{ width: "16px", height: "16px", fontSize: "10px" }}>✓</span>
                <span style={{ fontWeight: 500, color: "var(--fg-base)" }}>Review deployment configuration</span>
              </div>
              <span className="badge badge-success">DONE</span>
            </div>
            <div className="flex-between">
              <span style={{ fontSize: "13px", color: "var(--fg-subtle)" }}>Completed 12 minutes ago</span>
            </div>
          </Link>
        </div>
      </section>

      {/* System Status */}
      <section>
        <div className="flex-between" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)" }}>SYSTEM</h2>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--fg-muted)", fontSize: "14px" }}>Agent</span>
            <div className="flex-center gap-2">
              <span style={{ color: "var(--success)" }}>●</span>
              <span style={{ color: "var(--fg-subtle)", fontSize: "12px" }}>Operational</span>
            </div>
          </div>
          <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--fg-muted)", fontSize: "14px" }}>Queue</span>
            <div className="flex-center gap-2">
              <span style={{ color: "var(--success)" }}>●</span>
              <span style={{ color: "var(--fg-subtle)", fontSize: "12px" }}>Operational</span>
            </div>
          </div>
          <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--fg-muted)", fontSize: "14px" }}>Firestore</span>
            <div className="flex-center gap-2">
              <span style={{ color: "var(--success)" }}>●</span>
              <span style={{ color: "var(--fg-subtle)", fontSize: "12px" }}>Operational</span>
            </div>
          </div>
          <div className="card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--fg-muted)", fontSize: "14px" }}>Gemini</span>
            <div className="flex-center gap-2">
              <span style={{ color: "var(--success)" }}>●</span>
              <span style={{ color: "var(--fg-subtle)", fontSize: "12px" }}>Operational</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
