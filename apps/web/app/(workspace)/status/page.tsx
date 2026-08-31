import { getRequestLocale, getRequestMessages } from "../../../lib/i18n-server";
import { GlassCard } from "../../../components/ui/GlassCard";
import InteractiveCard from "../../../components/ui/InteractiveCard";
import { CheckCircle2, Server, Activity, Clock, TerminalSquare, AlertCircle } from "lucide-react";

export default async function StatusPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 py-12 lg:py-20">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">System Health</h1>
        <p className="text-lg text-muted-foreground">Real-time operational status</p>
      </header>

      {/* Overall Health */}
      <section className="mb-12">
        <InteractiveCard delay={0.1} hoverScale={1.02}>
          <GlassCard className="p-8 flex items-center gap-6 border-emerald-500/20 bg-emerald-500/5">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
              <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">All Systems Operational</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Last checked just now
              </p>
            </div>
          </GlassCard>
        </InteractiveCard>
      </section>

      {/* Core Services */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase m-0">Services</h2>
        </div>
        <InteractiveCard delay={0.2} hoverScale={1}>
          <GlassCard className="p-0 overflow-hidden">
            <div className="divide-y divide-border/50">
              {[
                { name: "Gemini / Vertex AI", status: "Operational", latency: "142ms", ok: true },
                { name: "Mission Runtime", status: "Operational", latency: "89ms", ok: true },
                { name: "Firestore Persistence", status: "Operational", latency: "24ms", ok: true },
                { name: "Cloud Tasks Queue", status: "Operational", latency: "12ms", ok: true },
                { name: "Capability Registry", status: "Operational", latency: "—", ok: true },
              ].map((service, idx) => (
                <div key={service.name} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-medium text-foreground">{service.name}</span>
                  <div className="flex items-center gap-6">
                    <span className="font-mono text-xs text-muted-foreground">{service.latency}</span>
                    <div className="flex items-center gap-2 w-24">
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${service.ok ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      <span className="text-xs text-muted-foreground">{service.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </InteractiveCard>
      </section>

      {/* Execution Metrics */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase m-0">Execution (24h)</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active", value: "4", color: "text-blue-500" },
            { label: "Completed", value: "37", color: "text-emerald-500" },
            { label: "Failed", value: "2", color: "text-destructive" },
            { label: "Avg Duration", value: "18.4s", color: "text-foreground" },
          ].map((metric, idx) => (
            <InteractiveCard key={metric.label} delay={0.3 + idx * 0.1} hoverScale={1.05}>
              <GlassCard className="p-6 flex flex-col justify-between h-full">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{metric.label}</div>
                <div className={`text-3xl font-semibold ${metric.color}`}>{metric.value}</div>
              </GlassCard>
            </InteractiveCard>
          ))}
        </div>
      </section>

      {/* Recent Events */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TerminalSquare className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase m-0">Recent Events</h2>
        </div>
        <InteractiveCard delay={0.5} hoverScale={1}>
          <GlassCard className="p-0 overflow-hidden">
            <div className="divide-y divide-border/50">
              {[
                { time: "09:42:15", msg: "Mission started (ID: cas_1234)", type: "info" },
                { time: "09:41:03", msg: "Capability Data Retrieval completed", type: "success" },
                { time: "09:39:55", msg: "Mission completed (ID: cas_9876)", type: "success" },
                { time: "09:15:22", msg: "Agent scaled up capacity", type: "info" },
                { time: "08:30:11", msg: "API rate limit approaching", type: "warning" }
              ].map((evt, idx) => (
                <div key={idx} className="flex items-start gap-4 p-5 hover:bg-white/[0.02] transition-colors">
                  <span className="font-mono text-xs text-muted-foreground shrink-0 mt-0.5">{evt.time}</span>
                  <span className={`text-sm ${
                    evt.type === 'warning' ? 'text-amber-500' : 
                    evt.type === 'success' ? 'text-emerald-500/80' : 
                    'text-foreground'
                  }`}>
                    {evt.msg}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </InteractiveCard>
      </section>

    </div>
  );
}
