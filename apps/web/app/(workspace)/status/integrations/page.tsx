import { getRequestLocale, getRequestMessages } from "../../../../lib/i18n-server";
import { GlassCard } from "../../../../components/ui/GlassCard";
import InteractiveCard from "../../../../components/ui/InteractiveCard";
import NeonMesh from "../../../../components/ui/neon-mesh";
import { Network, Server, Key, Database, Cpu, Mail } from "lucide-react";

export default async function IntegrationsPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  // Functional environment checks
  const gcpConnected = Boolean(process.env.GOOGLE_CLOUD_PROJECT);
  const firestoreConnected = Boolean(process.env.FIRESTORE_DATABASE);
  const tasksConnected = Boolean(process.env.CLOUD_TASKS_QUEUE && process.env.CLOUD_TASKS_SERVICE_ACCOUNT);
  const resendConnected = Boolean(process.env.RESEND_API_KEY);
  const vertexConnected = Boolean(process.env.GOOGLE_CLOUD_LOCATION);
  
  const integrations = [
    {
      id: "gcp",
      name: "Google Cloud Platform",
      description: "Core infrastructure, authentication, and IAM roles for the agent.",
      connected: gcpConnected,
      icon: Server,
      category: "Infrastructure"
    },
    {
      id: "firestore",
      name: "Firestore Database",
      description: "Deterministic state persistence, mission rules, and logging.",
      connected: firestoreConnected,
      icon: Database,
      category: "Persistence"
    },
    {
      id: "vertex",
      name: "Vertex AI (Gemini)",
      description: "The autonomous brain driving reasoning and execution planning.",
      connected: vertexConnected,
      icon: Cpu,
      category: "Intelligence"
    },
    {
      id: "tasks",
      name: "Cloud Tasks",
      description: "Asynchronous background worker queue for executing agent actions.",
      connected: tasksConnected,
      icon: Network,
      category: "Execution"
    },
    {
      id: "resend",
      name: "Resend Email Gateway",
      description: "Managed outbound and inbound email delivery for agentic communication.",
      connected: resendConnected,
      icon: Mail,
      category: "Channels"
    }
  ];

  return (
    <div style={{ position: "relative", minHeight: "100%", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", zIndex: 0, pointerEvents: "none" }}>
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 lg:py-20">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-400 mb-6">
            <Network className="w-4 h-4" />
            Connections
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
            System Integrations
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Live diagnostic of all external services wired into your ActionOS instance.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {integrations.map((integration, idx) => {
            const Icon = integration.icon;
            
            return (
              <InteractiveCard key={integration.id} delay={0.1 + idx * 0.1} hoverScale={1.02}>
                <GlassCard className={`h-full p-8 bg-black/40 backdrop-blur-xl border ${integration.connected ? 'border-[#BEF202]/30 hover:border-[#BEF202]/50' : 'border-red-500/30 hover:border-red-500/50'} transition-colors group relative overflow-hidden`}>
                  {integration.connected ? (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#BEF202] rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" />
                  ) : (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" />
                  )}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className={`inline-flex p-3 rounded-xl bg-white/5 ${integration.connected ? 'text-white' : 'text-red-400'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${integration.connected ? 'bg-[#BEF202]/10 text-[#BEF202]' : 'bg-red-500/10 text-red-400'}`}>
                      {integration.connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                    {integration.category}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{integration.name}</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">{integration.description}</p>
                </GlassCard>
              </InteractiveCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
