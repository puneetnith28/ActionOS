import Link from "next/link";
import { getRequestLocale, getRequestMessages } from "../lib/i18n-server";
import { Button } from "../components/ui/button";
import NeonMesh from "../components/ui/neon-mesh";
import { GlassCard } from "../components/ui/GlassCard";
import InteractiveCard from "../components/ui/InteractiveCard";
import { Navbar } from "../components/ui/mini-navbar";
import { Zap, BrainCircuit, ShieldCheck, GitMerge, Activity } from "lucide-react";

export default async function LandingPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  return (
    <div style={{ backgroundColor: "var(--bg-base)", minHeight: "100vh", color: "var(--fg-base)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100vh", zIndex: 0 }}>
        <NeonMesh title="" subtitle="" description="" className="opacity-60" />
        <div style={{ position: "absolute", top: "70vh", left: 0, right: 0, bottom: 0, background: "linear-gradient(to bottom, transparent, var(--bg-base))", zIndex: 1 }} />
      </div>
      
      {/* Navigation */}
      <Navbar />

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 24px", position: "relative", zIndex: 10 }}>
        {/* Hero Section */}
        <section style={{ textAlign: "center", marginBottom: "96px", paddingTop: "80px" }}>
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
              <Link href="/login">Get Started Free →</Link>
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
        <section id="features" className="mb-24 relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">
            Engineered for reliability.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InteractiveCard delay={0.1} hoverScale={1.02}>
              <GlassCard className="h-full p-8 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#BEF202]/50 transition-colors group">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 group-hover:bg-[#BEF202]/10 transition-colors">
                  <BrainCircuit className="w-6 h-6 text-white/70 group-hover:text-[#BEF202] transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Autonomous Execution</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Agents dynamically select the necessary capabilities from a strict registry to solve complex objectives without human intervention.
                </p>
              </GlassCard>
            </InteractiveCard>

            <InteractiveCard delay={0.2} hoverScale={1.02}>
              <GlassCard className="h-full p-8 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#BEF202]/50 transition-colors group">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 group-hover:bg-[#BEF202]/10 transition-colors">
                  <GitMerge className="w-6 h-6 text-white/70 group-hover:text-[#BEF202] transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Deterministic State</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Every action is tracked via a strict state machine, ensuring that a mission's state transitions are fully reproducible and auditable.
                </p>
              </GlassCard>
            </InteractiveCard>

            <InteractiveCard delay={0.3} hoverScale={1.02}>
              <GlassCard className="h-full p-8 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#BEF202]/50 transition-colors group">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 group-hover:bg-[#BEF202]/10 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-white/70 group-hover:text-[#BEF202] transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Safe Interactions</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  ActionOS runs all external interactions through isolated capabilities, requiring human intervention before executing sensitive actions.
                </p>
              </GlassCard>
            </InteractiveCard>

            <InteractiveCard delay={0.4} hoverScale={1.02}>
              <GlassCard className="h-full p-8 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#BEF202]/50 transition-colors group">
                <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 group-hover:bg-[#BEF202]/10 transition-colors">
                  <Activity className="w-6 h-6 text-white/70 group-hover:text-[#BEF202] transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Execution Observability</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Inspect detailed timelines of capability invocation, agent reasoning paths, and target verification outcomes right from the dashboard.
                </p>
              </GlassCard>
            </InteractiveCard>
          </div>
        </section>

        {/* CTA */}
        <section className="relative text-center py-32 mb-16">
          <div className="absolute inset-0 bg-gradient-to-t from-[#BEF202]/10 to-transparent rounded-[3rem] opacity-50 blur-3xl"></div>
          
          <GlassCard className="relative overflow-hidden p-12 md:p-20 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[3rem]">
            {/* Ambient inner glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#BEF202] rounded-full blur-[100px] opacity-20"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
                Ready to deploy?
              </h2>
              <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
                Join the developers building reliable agentic workflows. ActionOS gives you the tools to bridge AI generation with deterministic execution.
              </p>
              <Button size="lg" asChild className="bg-[#BEF202] text-black hover:bg-[#a5d202] border-none font-bold text-lg px-8 py-6 h-auto rounded-xl shadow-[0_0_40px_rgba(190,242,2,0.3)] hover:shadow-[0_0_60px_rgba(190,242,2,0.5)] transition-all duration-300">
                <Link href="/login">Deploy Your First Agent</Link>
              </Button>
            </div>
          </GlassCard>
        </section>
      </main>
      
      {/* Footer */}
      <footer style={{ padding: "48px", borderTop: "1px solid var(--border-subtle)", textAlign: "center", color: "var(--fg-subtle)", fontSize: "14px" }}>
        &copy; {new Date().getFullYear()} ActionOS. All rights reserved.
      </footer>
    </div>
  );
}
