import { getRequestLocale, getRequestMessages } from "../../../../lib/i18n-server";
import { GlassCard } from "../../../../components/ui/GlassCard";
import InteractiveCard from "../../../../components/ui/InteractiveCard";
import NeonMesh from "../../../../components/ui/neon-mesh";
import { CheckCircle2, Trophy, ShieldCheck } from "lucide-react";
import { MissionInbox } from "../../../../components/mission-inbox";

export default async function CompletedPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  return (
    <div style={{ position: "relative", minHeight: "100%", overflow: "hidden" }}>
      {/* Background Effects */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", zIndex: 0, pointerEvents: "none" }}>
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 lg:py-20">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#BEF202]/10 border border-[#BEF202]/20 text-xs font-medium text-[#BEF202] mb-6">
            <CheckCircle2 className="w-4 h-4" />
            Verified & Completed
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
            Mission Accomplished
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            All successfully executed and verified autonomous workflows are securely archived here.
          </p>
        </header>

        <section className="mb-16">
          <InteractiveCard delay={0.1} hoverScale={1.02}>
            <GlassCard className="relative overflow-hidden p-8 md:p-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#BEF202] rounded-full blur-[120px] opacity-20" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-2xl">
                  <Trophy className="w-16 h-16 text-[#BEF202]" strokeWidth={1.5} />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Zero Active Exceptions</h2>
                  <p className="text-white/60">
                    Your agentic fleet has successfully resolved all historical tasks in this view. The system's deterministic state machine guarantees that every task listed here reached a verified terminal state.
                  </p>
                </div>
              </div>
            </GlassCard>
          </InteractiveCard>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <InteractiveCard delay={0.2} hoverScale={1.02}>
            <GlassCard className="h-full p-8 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#BEF202]/30 transition-colors group">
              <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 group-hover:bg-[#BEF202]/10 transition-colors">
                <ShieldCheck className="w-6 h-6 text-white/70 group-hover:text-[#BEF202]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Cryptographic Proofs</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Completed missions contain immutable evidence of execution, verified against the original intent contract before being marked as done.
              </p>
            </GlassCard>
          </InteractiveCard>

          <InteractiveCard delay={0.3} hoverScale={1.02}>
            <GlassCard className="h-full p-8 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#BEF202]/30 transition-colors group">
              <div className="mb-4 inline-flex p-3 rounded-xl bg-white/5 group-hover:bg-[#BEF202]/10 transition-colors">
                <CheckCircle2 className="w-6 h-6 text-white/70 group-hover:text-[#BEF202]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">100% Deterministic</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                All successful workflows guarantee that the real-world state matches the requested outcome without side effects or unhandled edge cases.
              </p>
            </GlassCard>
          </InteractiveCard>
        </div>

        <section className="mt-8">
          <MissionInbox filterBucket="DONE" hideSummary={true} />
        </section>

      </div>
    </div>
  );
}
