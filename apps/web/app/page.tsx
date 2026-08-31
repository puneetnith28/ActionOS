import Link from "next/link";
import { getRequestLocale, getRequestMessages } from "../lib/i18n-server";
import { Button } from "../components/ui/button";
import NeonMesh from "../components/ui/neon-mesh";
import { GlassCard } from "../components/ui/GlassCard";
import { Zap } from "lucide-react";

export default async function LandingPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  return (
    <div style={{ backgroundColor: "var(--bg-base)", minHeight: "100vh", color: "var(--fg-base)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100vh", zIndex: 0 }}>
        <NeonMesh title="" subtitle="" description="" className="opacity-60" />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40vh", background: "linear-gradient(to bottom, transparent, var(--bg-base) 95%)", zIndex: 1 }} />
      </div>
      
      {/* Navigation */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "relative", zIndex: 10, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)" }}>
        <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em" }}>ActionOS</div>
        <div style={{ display: "flex", gap: "16px" }}>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Sign up</Link>
          </Button>
        </div>
      </nav>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 24px", position: "relative", zIndex: 10 }}>
        {/* Hero Section */}
        <section style={{ textAlign: "center", marginBottom: "96px" }}>
          <div className="badge badge-accent" style={{ marginBottom: "24px", padding: "6px 12px", fontSize: "12px", background: "rgba(190, 242, 2, 0.1)", color: "#BEF202", border: "1px solid rgba(190, 242, 2, 0.2)" }}>
            Now in Public Beta
          </div>
          <h1 style={{ fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.1, marginBottom: "24px", letterSpacing: "-0.04em", textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
            The operational console <br/> for autonomous agents.
          </h1>
          <p style={{ fontSize: "20px", color: "var(--fg-muted)", maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.6, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            ActionOS bridges the gap between AI generation and real-world execution. Deploy agents that can securely plan, operate, and verify tasks autonomously.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <Button size="lg" asChild className="bg-[#BEF202] text-black hover:bg-[#a5d202] border-none font-bold">
              <Link href="/dashboard">Get Started Free →</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-black/50 backdrop-blur border-white/20 hover:bg-white/10">
              <a href="#features">Read the Docs</a>
            </Button>
          </div>
        </section>

        {/* Product Preview Image (Conceptual) */}
        <div className="mb-24 relative group mx-auto max-w-3xl">
          {/* Subtle glow effect behind the card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#BEF202]/20 to-emerald-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
          
          <GlassCard className="relative p-1 rounded-[2rem] bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#BEF202]/5 to-transparent opacity-50"></div>
            <div className="relative bg-black/60 rounded-[1.8rem] border border-white/5 p-16 text-center shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
              
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-[#BEF202] blur-xl opacity-20 rounded-full"></div>
                <Zap className="w-16 h-16 text-[#BEF202] relative z-10" fill="#BEF202" fillOpacity={0.2} />
              </div>
              
              <h3 className="text-3xl font-bold mb-4 tracking-tight text-white">ActionOS Command Center</h3>
              <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
                A premium, dark-mode interface designed for high-density information and robust execution timelines.
              </p>
            </div>
          </GlassCard>
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
          <Button size="lg" asChild>
            <Link href="/dashboard">Sign up for free</Link>
          </Button>
        </section>
      </main>
      
      {/* Footer */}
      <footer style={{ padding: "48px", borderTop: "1px solid var(--border-subtle)", textAlign: "center", color: "var(--fg-subtle)", fontSize: "14px" }}>
        &copy; {new Date().getFullYear()} ActionOS. All rights reserved.
      </footer>
    </div>
  );
}
