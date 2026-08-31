import { getRequestLocale, getRequestMessages } from "../../../../lib/i18n-server";
import { GlassCard } from "../../../../components/ui/GlassCard";
import InteractiveCard from "../../../../components/ui/InteractiveCard";
import NeonMesh from "../../../../components/ui/neon-mesh";
import { Server, Activity, Network } from "lucide-react";
import { MissionInbox } from "../../../../components/mission-inbox";

export default async function ExecutionPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  return (
    <div style={{ position: "relative", minHeight: "100%", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", zIndex: 0, pointerEvents: "none" }}>
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 lg:py-20">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-6">
            <Server className="w-4 h-4" />
            Active Runners
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
            Execution Engine
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Real-time observability into the deterministic state machine. These missions are currently processing in the background via Cloud Tasks.
          </p>
        </header>

        <section className="mb-16">
          <InteractiveCard delay={0.1} hoverScale={1.02}>
            <GlassCard className="relative overflow-hidden p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[120px] opacity-10" />
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
                <div className="p-4">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Cloud Tasks Queue</div>
                  <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Operational
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Current State</div>
                  <div className="text-2xl font-bold text-blue-400">Processing</div>
                </div>
                <div className="p-4">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-2">Concurrency Limit</div>
                  <div className="text-2xl font-bold text-white">100 / min</div>
                </div>
              </div>
            </GlassCard>
          </InteractiveCard>
        </section>

        <div className="flex items-center gap-2 mb-6 px-2">
          <Activity className="w-4 h-4 text-white/50" />
          <h2 className="text-sm font-bold tracking-widest text-white/50 uppercase m-0">Live Executions</h2>
        </div>

        <section className="mt-4">
          {/* Functional list fetching real WORKING bucket missions */}
          <MissionInbox filterBucket="WORKING" hideSummary={true} />
        </section>
      </div>
    </div>
  );
}
