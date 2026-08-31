import Link from "next/link";
import { getRequestLocale, getRequestMessages } from "../lib/i18n-server";

export default async function LandingPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  return (
    <div style={{ backgroundColor: "var(--bg-base)", minHeight: "100vh", color: "var(--fg-base)" }}>
      {/* Navigation */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em" }}>ActionOS</div>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link href="/dashboard" className="btn btn-ghost" style={{ fontSize: "14px" }}>Log in</Link>
          <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: "14px" }}>Sign up</Link>
        </div>
      </nav>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 24px" }}>
        {/* Hero Section */}
        <section style={{ textAlign: "center", marginBottom: "96px" }}>
          <div className="badge badge-accent" style={{ marginBottom: "24px", padding: "6px 12px", fontSize: "12px" }}>
            Now in Public Beta
          </div>
          <h1 style={{ fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.1, marginBottom: "24px", letterSpacing: "-0.04em" }}>
            The operational console <br/> for autonomous agents.
          </h1>
          <p style={{ fontSize: "20px", color: "var(--fg-muted)", maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.6 }}>
            ActionOS bridges the gap between AI generation and real-world execution. Deploy agents that can securely plan, operate, and verify tasks autonomously.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "16px" }}>
              Get Started Free →
            </Link>
            <a href="#features" className="btn btn-secondary" style={{ padding: "14px 28px", fontSize: "16px" }}>
              Read the Docs
            </a>
          </div>
        </section>

        {/* Product Preview Image (Conceptual) */}
        <div style={{ border: "1px solid var(--border-strong)", borderRadius: "var(--radius-lg)", padding: "4px", backgroundColor: "var(--bg-surface-elevated)", boxShadow: "var(--shadow-lg)", marginBottom: "96px" }}>
          <div style={{ backgroundColor: "var(--bg-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", padding: "48px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>⚡</div>
            <h3 style={{ fontSize: "24px", marginBottom: "16px" }}>ActionOS Command Center</h3>
            <p style={{ color: "var(--fg-muted)", maxWidth: "400px", margin: "0 auto" }}>
              A premium, dark-mode interface designed for high-density information and robust execution timelines.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <section id="features" style={{ marginBottom: "96px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "48px", textAlign: "center" }}>
            Engineered for reliability.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            <div className="card" style={{ border: "1px solid var(--border-subtle)", background: "transparent" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "var(--fg-base)" }}>Autonomous Execution</h3>
              <p style={{ color: "var(--fg-muted)", fontSize: "15px", lineHeight: 1.6 }}>
                Agents dynamically select the necessary capabilities from a strict registry to solve complex objectives without human intervention.
              </p>
            </div>
            <div className="card" style={{ border: "1px solid var(--border-subtle)", background: "transparent" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "var(--fg-base)" }}>Deterministic State</h3>
              <p style={{ color: "var(--fg-muted)", fontSize: "15px", lineHeight: 1.6 }}>
                Every action is tracked via a strict state machine, ensuring that a mission's state transitions are fully reproducible and auditable.
              </p>
            </div>
            <div className="card" style={{ border: "1px solid var(--border-subtle)", background: "transparent" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "var(--fg-base)" }}>Safe Interactions</h3>
              <p style={{ color: "var(--fg-muted)", fontSize: "15px", lineHeight: 1.6 }}>
                ActionOS runs all external interactions through isolated capabilities, requiring human intervention before executing sensitive actions.
              </p>
            </div>
            <div className="card" style={{ border: "1px solid var(--border-subtle)", background: "transparent" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "12px", color: "var(--fg-base)" }}>Execution Observability</h3>
              <p style={{ color: "var(--fg-muted)", fontSize: "15px", lineHeight: 1.6 }}>
                Inspect detailed timelines of capability invocation, agent reasoning paths, and target verification outcomes right from the dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: "center", padding: "80px 0", borderTop: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "24px" }}>Ready to deploy?</h2>
          <p style={{ fontSize: "18px", color: "var(--fg-muted)", marginBottom: "32px" }}>Join the developers building reliable agentic workflows.</p>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "16px" }}>
            Sign up for free
          </Link>
        </section>
      </main>
      
      {/* Footer */}
      <footer style={{ padding: "48px", borderTop: "1px solid var(--border-subtle)", textAlign: "center", color: "var(--fg-subtle)", fontSize: "14px" }}>
        &copy; {new Date().getFullYear()} ActionOS. All rights reserved.
      </footer>
    </div>
  );
}
