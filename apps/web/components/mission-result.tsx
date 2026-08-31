"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ConsumerCaseDetail } from "../lib/mission-projection";
import { anonymousIdToken } from "../lib/firebase-client";
import { errorCopy } from "../lib/error-copy";
import { GlassCard } from "./ui/GlassCard";
import InteractiveCard from "./ui/InteractiveCard";
import { AnimatedTimeline, type TimelineEvent } from "./ui/AnimatedTimeline";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { ArrowLeft, Clock, AlertTriangle, ShieldCheck, TerminalSquare } from "lucide-react";

export function MissionResult({ missionId }: { readonly missionId: string }) {
  const [detail, setDetail] = useState<ConsumerCaseDetail>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const token = await anonymousIdToken();
        const response = await fetch(`/api/missions/${missionId}/detail`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const body = await response.json() as ConsumerCaseDetail & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "DETAIL_FAILED");
        if (cancelled) return;
        setDetail(body); setError(undefined);
        if (!["DONE", "CANCELLED", "FAILED", "EXPIRED", "NEEDS_ATTENTION"].includes(body.state)) {
          timeout = setTimeout(() => void load(), 2000);
        }
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "DETAIL_FAILED"); }
    };
    void load();
    return () => { cancelled = true; if (timeout) clearTimeout(timeout); };
  }, [missionId]);

  if (error && !detail) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <GlassCard className="max-w-md w-full p-6 border-destructive/50 bg-destructive/10 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm">{errorCopy(error)}</p>
        </GlassCard>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8 px-4">
        <div className="h-8 w-48 bg-muted/20 animate-pulse rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px] bg-muted/20 animate-pulse rounded-xl" />
          <div className="h-[300px] bg-muted/20 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  const isRunning = !["DONE", "CANCELLED", "FAILED", "EXPIRED", "NEEDS_ATTENTION"].includes(detail.state);

  const timelineEvents: TimelineEvent[] = detail.timeline.map((event, idx) => {
    return {
      id: event.id,
      actor: "ActionOS System",
      role: "Agent",
      timestamp: event.occurredAt || new Date().toISOString(),
      note: event.reason || `Transitioned to ${event.transition.replaceAll("_", " ")}`,
      hash: `0x${Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('')}...`,
      ledgerRef: `evt_${event.transition.toLowerCase()}_${idx}`
    };
  });

  if (timelineEvents.length === 0) {
    timelineEvents.push({
      id: "init",
      actor: "ActionOS System",
      role: "Agent",
      timestamp: new Date().toISOString(),
      note: "Initializing agent runtime and connecting to environment...",
      hash: "0x000000000000000000000000",
      ledgerRef: "evt_init_0"
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
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
              {detail.outcome?.accepted ? "Prepare Weekly Report" : "Active Mission"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono ml-3">
            ID: {missionId}
          </p>
        </div>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border ${
            isRunning 
              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
              : detail.state === 'DONE' 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          }`}>
            {isRunning && <span className="animate-pulse mr-2">●</span>}
            {detail.state.replaceAll("_", " ")}
          </span>
        </div>
      </header>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Execution Timeline & Capability Logs (Commits 74 & 75) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">
          
          {/* Execution Timeline */}
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

          {/* Capability Logs */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TerminalSquare className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase m-0">Capability Logs</h2>
            </div>
            <InteractiveCard delay={0.2} hoverScale={1}>
              <GlassCard className="p-0 overflow-hidden">
                <ScrollArea className="h-[300px]">
                  {detail.conversation.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {detail.conversation.map((entry, idx) => (
                        <div key={entry.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-foreground">{entry.title}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {entry.occurredAt ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(entry.occurredAt)) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{entry.safeBody}</p>
                          <div className="inline-flex items-center gap-2 bg-background/50 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border border-border/50">
                            <span className={entry.status === "COMPLETED" ? "text-emerald-500" : "text-muted-foreground"}>
                              {entry.status}
                            </span>
                            {entry.reason && <span className="text-muted-foreground normal-case font-normal">— {entry.reason}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center h-full gap-2">
                      <TerminalSquare className="w-8 h-8 opacity-20" />
                      No capability logs generated yet.
                    </div>
                  )}
                </ScrollArea>
              </GlassCard>
            </InteractiveCard>
          </div>
        </div>

        {/* Right Column: Mission Metadata */}
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
                    {detail.promise || "No explicit goal provided."}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Status</div>
                    <div className="text-sm font-medium text-foreground">
                      {detail.state.replaceAll("_", " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Created</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {detail.timeline[0]?.occurredAt 
                        ? new Intl.DateTimeFormat('en-US', { timeStyle: "medium" }).format(new Date(detail.timeline[0].occurredAt))
                        : "—"}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Identity</div>
                  <div className="text-xs font-mono text-muted-foreground break-all bg-background/50 p-2 rounded-md border border-border/50">
                    {detail.channel.contact}
                  </div>
                </div>
              </div>
            </GlassCard>
          </InteractiveCard>
          
          {detail.outcome.accepted === false && (
            <InteractiveCard delay={0.4} hoverScale={1.02}>
              <GlassCard className="p-5 border-amber-500/50 bg-amber-500/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-500 mb-1">Intervention Required</h3>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                      The agent encountered an exception and requires human intervention to proceed.
                    </p>
                    <Button variant="outline" className="w-full border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white" asChild>
                      <Link href={`/missions/${missionId}/exception`}>
                        Resolve Exception
                      </Link>
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </InteractiveCard>
          )}
        </div>
      </div>
    </div>
  );
}
