import { MissionInbox } from "../../../components/mission-inbox";
import { getRequestMessages } from "../../../lib/i18n-server";
import NeonMesh from "../../../components/ui/neon-mesh";
import InteractiveCard from "../../../components/ui/InteractiveCard";
import { GlassCard } from "../../../components/ui/GlassCard";

export default async function MissionsPage() {
  const copy = (await getRequestMessages()).cases;
  return (
    <main className="relative min-h-screen bg-black text-white flex flex-col items-center overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0">
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
      </div>
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl px-6 md:px-12 py-16 md:py-24">
        <header className="mb-12 border-b border-white/10 pb-8">
          <InteractiveCard delay={0.1} hoverScale={1.0}>
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#BEF202] font-medium w-fit">
                <span className="w-2 h-2 rounded-full bg-[#BEF202] animate-pulse"></span> System Online
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-lg">
                {copy.title}
              </h1>
              <p className="text-xl text-white/60 max-w-3xl mt-2 font-medium">
                {copy.lede}
              </p>
            </div>
          </InteractiveCard>
        </header>
        
        <InteractiveCard delay={0.2} hoverScale={1.0} className="w-full">
          <GlassCard className="p-1 min-h-[400px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl relative overflow-hidden">
             <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#BEF202] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
             <div className="relative z-10 p-4 md:p-8">
                <MissionInbox />
             </div>
          </GlassCard>
        </InteractiveCard>
      </div>
    </main>
  );
}
