import Link from "next/link";
import { getRequestLocale, getRequestMessages } from "../../../lib/i18n-server";
import FloatingElements from "../../../components/ui/FloatingElements";
import InteractiveCard from "../../../components/ui/InteractiveCard";
import { GlassCard } from "../../../components/ui/GlassCard";
import { Button } from "../../../components/ui/button";
import { Activity, Play, CheckCircle2, Server, Database, Bot, Zap } from "lucide-react";

export default async function CommandCenter() {
  const [locale] = await Promise.all([getRequestLocale(), getRequestMessages()]);
  
  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 py-12 lg:py-20">
      {/* Subtle floating background elements */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <FloatingElements />
      </div>

      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Good morning, Puneet.</h1>
        <p className="text-lg text-muted-foreground">What should ActionOS take care of?</p>
      </header>

      {/* Mission Composer */}
      <section className="mb-16">
        <InteractiveCard hoverScale={1.02} delay={0.1}>
          <GlassCard className="p-2 flex items-center gap-3 bg-card/60">
            <input 
              type="text" 
              placeholder="Prepare the weekly project report..." 
              className="flex-1 bg-transparent border-none text-foreground text-base outline-none px-4 py-3 placeholder:text-muted-foreground"
            />
            <Button asChild size="lg" className="rounded-md gap-2 font-semibold">
              <Link href="/intake">
                Run Mission <span className="opacity-70 text-lg leading-none">→</span>
              </Link>
            </Button>
          </GlassCard>
        </InteractiveCard>
      </section>

      {/* Active Missions */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Active Missions</h2>
        </div>
        
        <div className="grid gap-4">
          <InteractiveCard delay={0.2} hoverScale={1.01}>
            <GlassCard className="overflow-hidden">
              <Link href="/missions/active-demo" className="block p-5 hover:bg-white/[0.02] transition-colors" suppressHydrationWarning>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </div>
                    <span className="font-medium text-foreground">Prepare weekly report</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500 border border-blue-500/20">
                    RUNNING
                  </span>
                </div>
                <div className="flex items-center justify-between pl-6">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Planning → Gathering → Compiling
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">2m 14s</span>
                </div>
              </Link>
            </GlassCard>
          </InteractiveCard>
          
          <InteractiveCard delay={0.3} hoverScale={1.01}>
            <GlassCard className="overflow-hidden">
              <Link href="/missions/completed-demo" className="block p-5 hover:bg-white/[0.02] transition-colors" suppressHydrationWarning>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-foreground">Review deployment configuration</span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                    DONE
                  </span>
                </div>
                <div className="flex items-center justify-between pl-8">
                  <span className="text-sm text-muted-foreground">Completed 12 minutes ago</span>
                </div>
              </Link>
            </GlassCard>
          </InteractiveCard>
        </div>
      </section>

      {/* System Status */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">System Status</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Agent Runtime", icon: Bot },
            { name: "Task Queue", icon: Server },
            { name: "Database", icon: Database },
            { name: "Genkit API", icon: Zap },
          ].map((service, idx) => (
            <InteractiveCard key={service.name} delay={0.4 + idx * 0.1} hoverScale={1.05}>
              <GlassCard className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <service.icon className="w-5 h-5 text-muted-foreground" />
                  <div className="flex items-center gap-1.5">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">OK</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">{service.name}</span>
              </GlassCard>
            </InteractiveCard>
          ))}
        </div>
      </section>
    </div>
  );
}
