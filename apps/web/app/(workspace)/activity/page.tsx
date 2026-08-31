import { getRequestLocale, getRequestMessages } from "../../../lib/i18n-server";
import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { firestore } from "../../../lib/firebase-admin";
import { GlassCard } from "../../../components/ui/GlassCard";
import InteractiveCard from "../../../components/ui/InteractiveCard";
import NeonMesh from "../../../components/ui/neon-mesh";
import { Activity, Clock, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const [locale, copy] = await Promise.all([getRequestLocale(), getRequestMessages()]);
  const store = new FirestoreRuntimeStore(firestore);
  const events = await store.listAll(50);
  
  return (
    <div style={{ position: "relative", minHeight: "100%", overflowX: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "100%", zIndex: 0, pointerEvents: "none" }}>
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 lg:py-20">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#BEF202]/10 border border-[#BEF202]/20 text-xs font-medium text-[#BEF202] mb-6">
            <Activity className="w-4 h-4" />
            System Feed
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
            {copy.header.activity || "Global Activity"}
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Monitor all agent actions, capabilities invoked, and system events in real-time.
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {events.length === 0 ? (
             <GlassCard className="p-12 text-center bg-black/40 border-white/10 backdrop-blur-xl">
               <p className="text-white/60">No execution history found across any missions.</p>
             </GlassCard>
          ) : (
            <div className="flex flex-col gap-4">
              {events.map((event, idx) => (
                <InteractiveCard key={event.historyId} delay={0.05 * Math.min(idx, 10)} hoverScale={1.01}>
                  <GlassCard className="p-6 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-[#BEF202]/30 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-white/5 text-white/80 border border-white/10">
                          {event.eventType.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(event.occurredAt))}
                        </div>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">{event.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-white/5 whitespace-nowrap md:ml-auto">
                       <FileText className="w-3.5 h-3.5 text-white/40" />
                       <span className="font-mono text-[10px] text-white/50">{event.missionId.slice(0, 16)}...</span>
                    </div>
                  </GlassCard>
                </InteractiveCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
