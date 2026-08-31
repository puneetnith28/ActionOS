import Link from "next/link";
import { getRequestLocale, getRequestMessages } from "../../../lib/i18n-server";
import FloatingElements from "../../../components/ui/FloatingElements";
import InteractiveCard from "../../../components/ui/InteractiveCard";
import { GlassCard } from "../../../components/ui/GlassCard";
import NeonMesh from "../../../components/ui/neon-mesh";
import { Button } from "../../../components/ui/button";
import { Activity, Play, CheckCircle2, Server, Database, Bot, Zap, LayoutDashboard } from "lucide-react";
import { MissionInbox } from "../../../components/mission-inbox";
import { DashboardGreeting } from "../../../components/dashboard-greeting";

export default async function CommandCenter() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);
  
  // Dynamic Environment Checks for System Status
  const gcpConnected = Boolean(process.env.GOOGLE_CLOUD_PROJECT);
  const firestoreConnected = Boolean(process.env.FIRESTORE_DATABASE || process.env.GOOGLE_CLOUD_PROJECT);
  const tasksConnected = Boolean(process.env.CLOUD_TASKS_QUEUE);
  
  return (
    <div style={{ position: "relative", minHeight: "100%", overflowX: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", zIndex: 0, pointerEvents: "none" }}>
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
        <FloatingElements />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 lg:py-20">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#BEF202]/10 border border-[#BEF202]/20 text-xs font-medium text-[#BEF202] mb-6">
            <LayoutDashboard className="w-4 h-4" />
            Command Center
          </div>
          <DashboardGreeting />
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            What should ActionOS take care of today?
          </p>
        </header>

        {/* Mission Composer */}
        <section className="mb-16 max-w-3xl mx-auto">
          <InteractiveCard hoverScale={1.02} delay={0.1}>
            <GlassCard className="bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#BEF202]/30 transition-colors">
              <div className="p-2 flex items-center gap-3 w-full">
                <input 
                  type="text" 
                  placeholder="Prepare the weekly project report..." 
                  className="flex-1 w-full bg-transparent border-none text-white text-base outline-none px-4 py-3 placeholder:text-white/40 min-w-0"
                />
                <Button asChild size="lg" className="rounded-md gap-2 font-semibold bg-[#BEF202] text-black hover:bg-[#a5d202] flex-shrink-0">
                  <Link href="/intake">
                    Run Mission <span className="opacity-70 text-lg leading-none">→</span>
                  </Link>
                </Button>
              </div>
            </GlassCard>
          </InteractiveCard>
        </section>

        {/* Active Missions */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold tracking-widest text-white/50 uppercase">Active Missions</h2>
            <Link href="/missions" className="text-xs text-[#BEF202] hover:underline">View All →</Link>
          </div>
          
          <MissionInbox filterBucket="WORKING" hideSummary={true} />
        </section>

        {/* System Status */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold tracking-widest text-white/50 uppercase">System Status</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Agent Runtime", icon: Bot, ok: gcpConnected },
              { name: "Task Queue", icon: Server, ok: tasksConnected },
              { name: "Database", icon: Database, ok: firestoreConnected },
              { name: "Genkit API", icon: Zap, ok: gcpConnected },
            ].map((service, idx) => (
              <InteractiveCard key={service.name} delay={0.4 + idx * 0.1} hoverScale={1.05}>
                <GlassCard className={`bg-black/40 backdrop-blur-xl border ${service.ok ? 'border-white/10' : 'border-red-500/20'} transition-colors`}>
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <service.icon className={`w-5 h-5 ${service.ok ? 'text-white/50' : 'text-red-400/50'}`} />
                      <div className="flex items-center gap-1.5">
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${service.ok ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">{service.ok ? "OK" : "ERR"}</span>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${service.ok ? 'text-white' : 'text-red-400'}`}>{service.name}</span>
                  </div>
                </GlassCard>
              </InteractiveCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
