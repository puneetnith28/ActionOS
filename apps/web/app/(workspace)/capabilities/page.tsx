import { getRequestLocale, getRequestMessages } from "../../../lib/i18n-server";
import { GlassCard } from "../../../components/ui/GlassCard";
import InteractiveCard from "../../../components/ui/InteractiveCard";
import NeonMesh from "../../../components/ui/neon-mesh";
import { Zap, ShieldCheck, Mail, Boxes, Bot } from "lucide-react";
import { publicCapabilities } from "@actionos/runtime/capability-registry";
import { config } from "../../../lib/config";

export default async function CapabilitiesPage() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  // Make it functional by checking actual environment capabilities
  const managedEmailOutbound = Boolean(
    config.secrets.resendApiKey &&
    config.email.from &&
    config.email.replyDomain &&
    config.email.allowedDomains
  );
  const managedEmailInbound = Boolean(
    config.secrets.resendApiKey &&
    config.secrets.emailWebhookSigning &&
    config.email.replyDomain
  );
  
  const caps = publicCapabilities({
    now: new Date().toISOString(),
    sandboxAvailable: Boolean(config.urls.sandbox && config.secrets.merchantCallback),
    managedEmailOutbound,
    managedEmailInbound,
    partnerFixtureAvailable: Boolean(process.env.PARTNER_FIXTURE_ENDPOINT && process.env.PARTNER_FIXTURE_SIGNING_SECRET)
  });

  return (
    <div style={{ position: "relative", minHeight: "100%", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", zIndex: 0, pointerEvents: "none" }}>
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 lg:py-20">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-6">
            <Zap className="w-4 h-4" />
            Registry
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
            Agent Capabilities
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            These are the verified external actions the ActionOS agent is authorized to take on your behalf.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {caps.map((cap, idx) => {
            const isAvailable = cap.status === "AVAILABLE";
            let Icon = Boxes;
            let title = cap.channelType;
            let description = "";

            if (cap.channelType === "CONTROLLED_SANDBOX") {
              Icon = ShieldCheck;
              title = "Controlled Sandbox";
              description = "A safe, simulated environment for the agent to test communication workflows and parse responses deterministically.";
            } else if (cap.channelType === "MANAGED_EMAIL") {
              Icon = Mail;
              title = "Managed Email";
              description = "Authorized outbound and inbound email gateway. The agent can construct and parse email threads securely.";
            } else if (cap.channelType === "GMAIL_CONNECTED") {
              Icon = Bot;
              title = "Gmail (OAuth)";
              description = "Connect user Gmail accounts for native thread replies and deep inbox integration.";
            } else if (cap.channelType === "PARTNER_API") {
              Icon = Zap;
              title = "Partner API Integrations";
              description = "Direct programmatic access to verified ActionOS partner endpoints for immediate resolution.";
            }

            return (
              <InteractiveCard key={cap.channelType} delay={0.1 + idx * 0.1} hoverScale={1.02}>
                <GlassCard className={`h-full p-8 bg-black/40 backdrop-blur-xl border ${isAvailable ? 'border-[#BEF202]/30 hover:border-[#BEF202]/50' : 'border-white/10 opacity-60'} transition-colors group relative overflow-hidden`}>
                  {isAvailable && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#BEF202] rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" />
                  )}
                  <div className="flex justify-between items-start mb-6">
                    <div className={`inline-flex p-3 rounded-xl bg-white/5 ${isAvailable ? 'text-[#BEF202]' : 'text-white/40'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${isAvailable ? 'bg-[#BEF202]/10 text-[#BEF202]' : 'bg-white/5 text-white/40'}`}>
                      {cap.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">{description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5">
                    {cap.canSend && <span className="text-[10px] uppercase tracking-wider text-white/40 bg-white/5 px-2 py-1 rounded">Outbound</span>}
                    {cap.canReceive && <span className="text-[10px] uppercase tracking-wider text-white/40 bg-white/5 px-2 py-1 rounded">Inbound</span>}
                    {cap.supportsThreading && <span className="text-[10px] uppercase tracking-wider text-white/40 bg-white/5 px-2 py-1 rounded">Threading</span>}
                  </div>
                </GlassCard>
              </InteractiveCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
