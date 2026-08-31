import Link from "next/link";
import { GlassCard } from "./ui/GlassCard";
import InteractiveCard from "./ui/InteractiveCard";
import { AnimatedTimeline, type TimelineEvent } from "./ui/AnimatedTimeline";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { ArrowLeft, Clock, AlertTriangle, ShieldCheck, TerminalSquare } from "lucide-react";

export function MissionResultPreview() {
  const isRunning = false;
  
  const timelineEvents: TimelineEvent[] = [
    {
      id: "1",
      actor: "ActionOS System",
      role: "Agent",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      note: "Started planning mission for order ORDER-1842",
      hash: "0x3f2d1e4c",
      ledgerRef: "evt_plan_0"
    },
    {
      id: "2",
      actor: "ActionOS System",
      role: "Agent",
      timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      note: "Executed API call to Northstar Store",
      hash: "0x8a9b2c1d",
      ledgerRef: "evt_exec_1"
    },
    {
      id: "3",
      actor: "ActionOS System",
      role: "Agent",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      note: "Refund confirmed by merchant",
      hash: "0x5e6f7a8b",
      ledgerRef: "evt_verify_2"
    }
  ];

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-border/50 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground -ml-3">
              <Link href="/missions">
                <ArrowLeft className="w-4 h-4" /> Missions
              </Link>
            </Button>
            <span className="text-border">/</span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground m-0">
              Prepare Weekly Report (Preview)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono ml-3">
            ID: demo-verified
          </p>
        </div>
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            DONE
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase m-0">Execution Timeline</h2>
            </div>
            <InteractiveCard delay={0.1} hoverScale={1}>
              <GlassCard className="p-6">
                <ScrollArea className="h-[400px] pr-4">
                  <AnimatedTimeline events={timelineEvents} />
                </ScrollArea>
              </GlassCard>
            </InteractiveCard>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <TerminalSquare className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase m-0">Capability Logs</h2>
            </div>
            <InteractiveCard delay={0.2} hoverScale={1}>
              <GlassCard className="p-4">
                <div className="p-4 hover:bg-white/[0.02] transition-colors border-b border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-foreground">Extract Ticker</span>
                    <span className="text-[10px] font-mono text-muted-foreground">10:45:00 AM</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Extracted AAPL from the prompt.</p>
                  <div className="inline-flex items-center gap-2 bg-background/50 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border border-border/50">
                    <span className="text-emerald-500">COMPLETED</span>
                  </div>
                </div>
              </GlassCard>
            </InteractiveCard>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          <InteractiveCard delay={0.3} hoverScale={1}>
            <GlassCard className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase m-0">Mission Details</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Goal</div>
                  <div className="text-sm text-foreground leading-relaxed bg-background/50 p-3 rounded-md border border-border/50">
                    Refund USD 59.00 for order ORDER-1842
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Status</div>
                    <div className="text-sm font-medium text-foreground">
                      DONE
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Created</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {new Intl.DateTimeFormat('en-US', { timeStyle: "medium" }).format(new Date())}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Identity</div>
                  <div className="text-xs font-mono text-muted-foreground break-all bg-background/50 p-2 rounded-md border border-border/50">
                    Bounded sandbox request
                  </div>
                </div>
              </div>
            </GlassCard>
          </InteractiveCard>
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-8">Development-only visual preview · synthetic data</p>
    </div>
  );
}
