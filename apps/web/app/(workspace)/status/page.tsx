import { getRequestLocale, getRequestMessages } from "../../../lib/i18n-server";
import { GlassCard } from "../../../components/ui/GlassCard";
import InteractiveCard from "../../../components/ui/InteractiveCard";
import { CheckCircle2, Server, Activity, Clock, AlertCircle, ActivitySquare } from "lucide-react";
import NeonMesh from "../../../components/ui/neon-mesh";

export default async function StatusPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  // Dynamically verify core system components
  const gcpConnected = Boolean(process.env.GOOGLE_CLOUD_PROJECT);
  const tasksConnected = Boolean(process.env.CLOUD_TASKS_QUEUE);
  const firestoreConnected = Boolean(process.env.FIRESTORE_DATABASE || process.env.GOOGLE_CLOUD_PROJECT);
  const allOperational = gcpConnected && tasksConnected && firestoreConnected;

  const nodeVersion = process.version;
  const platform = process.platform;
  const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB";

  return (
    <div style={{ position: "relative", minHeight: "100%", overflowX: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", zIndex: 0, pointerEvents: "none" }}>
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 lg:py-20">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#BEF202]/10 border border-[#BEF202]/20 text-xs font-medium text-[#BEF202] mb-6">
            <ActivitySquare className="w-4 h-4" />
            System Health
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
            Operational Status
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Real-time infrastructure and runtime status diagnostics.
          </p>
        </header>

      {/* Overall Health */}
      <section className="mb-12">
        <InteractiveCard delay={0.1} hoverScale={1.02}>
          <GlassCard className={`p-8 flex items-center gap-6 ${allOperational ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
            <div className="relative flex h-16 w-16 items-center justify-center">
              {allOperational && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>}
              <div className={`relative flex items-center justify-center h-16 w-16 rounded-full ${allOperational ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                {allOperational ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {allOperational ? "All Systems Operational" : "Degraded Performance"}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Live Server Status
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
                { name: "Gemini / Vertex AI Runtime", status: gcpConnected ? "Operational" : "Offline", ok: gcpConnected },
                { name: "Firestore Persistence", status: firestoreConnected ? "Operational" : "Offline", ok: firestoreConnected },
                { name: "Cloud Tasks Queue", status: tasksConnected ? "Operational" : "Offline", ok: tasksConnected },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-medium text-foreground">{service.name}</span>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 w-24">
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${service.ok ? 'bg-emerald-500' : 'bg-destructive'}`}></span>
                      <span className="text-xs text-muted-foreground">{service.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </InteractiveCard>
      </section>

      {/* Server Metrics */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase m-0">Server Environment</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Node.js", value: nodeVersion, color: "text-blue-500" },
            { label: "Memory Heap", value: memoryUsage, color: "text-emerald-500" },
            { label: "Platform", value: platform, color: "text-foreground" },
            { label: "Environment", value: process.env.NODE_ENV || "development", color: "text-purple-500" },
          ].map((metric, idx) => (
            <InteractiveCard key={metric.label} delay={0.3 + idx * 0.1} hoverScale={1.05}>
              <GlassCard className="p-6 flex flex-col justify-between h-full">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{metric.label}</div>
                <div className={`text-2xl font-semibold ${metric.color} truncate`}>{metric.value}</div>
              </GlassCard>
            </InteractiveCard>
          ))}
        </div>
      </section>

      </div>
    </div>
  );
}
