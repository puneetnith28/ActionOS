"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { anonymousIdToken } from "../lib/firebase-client";
import { getInteractiveCopy } from "../lib/interactive-copy";
import { useLocale } from "../lib/use-locale";
import { GlassCard } from "./ui/GlassCard";
import { AnimatedCubes } from "./ui/AnimatedCubes";
import AnimatedText, { TypewriterText } from "./ui/AnimatedText";
import { Button } from "./ui/button";
import { RefreshCw, CheckCircle2, Circle, AlertTriangle, ShieldCheck } from "lucide-react";

interface AnalysisStatus {
  status: "QUEUED" | "ANALYZING" | "READY" | "FAILED";
  stage: "EVIDENCE_SECURED" | "GEMINI_EXTRACTION" | "VALIDATING" | "REVIEW_READY" | "FAILED";
  attemptCount: number;
  createdAt: string;
  error?: string;
}

const stageIds = ["EVIDENCE_SECURED", "GEMINI_EXTRACTION", "VALIDATING", "REVIEW_READY"] as const;

export function AnalysisProgress({ missionId, preview }: { readonly missionId: string; readonly preview?: AnalysisStatus }) {
  const router = useRouter();
  const { locale, localize } = useLocale();
  const copy = getInteractiveCopy(locale).analysis;
  const stages = stageIds.map((stage, index) => [stage, copy.stages[index] ?? stage] as const);
  const [analysis, setAnalysis] = useState<AnalysisStatus | undefined>(preview);
  const [error, setError] = useState<string>();
  const [retrying, setRetrying] = useState(false);
  const [pollGeneration, setPollGeneration] = useState(0);

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const token = await anonymousIdToken();
        const response = await fetch(`/api/missions/${missionId}/analysis`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        const body = await response.json() as AnalysisStatus & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "ANALYSIS_STATUS_FAILED");
        if (cancelled) return;
        setAnalysis(body);
        setError(undefined);
        if (body.status === "READY") {
          router.replace(localize(`/missions/${missionId}/review`));
          return;
        }
        if (body.status !== "FAILED") timeout = setTimeout(() => void poll(), 1_200);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "ANALYSIS_STATUS_FAILED");
        timeout = setTimeout(() => void poll(), 3_000);
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [missionId, router, pollGeneration, localize, preview]);

  async function retry() {
    setRetrying(true);
    setError(undefined);
    try {
      const token = await anonymousIdToken();
      const response = await fetch(`/api/missions/${missionId}/analysis`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await response.json() as AnalysisStatus & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "ANALYSIS_RETRY_FAILED");
      setAnalysis(body);
      setPollGeneration((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ANALYSIS_RETRY_FAILED");
    } finally {
      setRetrying(false);
    }
  }

  const activeIndex = analysis
    ? Math.max(0, stages.findIndex(([stage]) => stage === analysis.stage))
    : 0;
  
  const retentionEndsAt = analysis?.createdAt
    ? new Date(new Date(analysis.createdAt).getTime() + 86_400_000)
    : undefined;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <AnimatedText delay={0.1}>
        <GlassCard className="p-8 md:p-12 overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual Side */}
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              {analysis?.status === "FAILED" ? (
                <AlertTriangle className="w-24 h-24 text-destructive/50 mb-8" />
              ) : (
                <div className="mb-8 scale-75">
                  <AnimatedCubes />
                </div>
              )}
              <div className="text-center">
                <TypewriterText 
                  text={analysis?.status === "FAILED" ? copy.failedTitle : copy.building} 
                  className="text-xl font-semibold text-foreground mb-2" 
                  speed={0.03} 
                />
                <p className="text-sm text-muted-foreground">
                  {analysis?.status === "FAILED" ? copy.failedText : "Gemini extracts cited facts while deterministic rules validate the contract."}
                </p>
              </div>
            </div>

            {/* Status Side */}
            <div className="flex flex-col justify-center">
              <div className="mb-8">
                <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2">Runtime Infrastructure</div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                    Gemini 3.5 Flash
                  </span>
                  <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                    Cloud Tasks
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {stages.map(([stage, label], index) => {
                  const isDone = index < activeIndex || analysis?.stage === "REVIEW_READY";
                  const isActive = index === activeIndex && analysis?.status !== "FAILED";
                  
                  return (
                    <div key={stage} className={`flex items-center gap-4 transition-opacity duration-300 ${!isDone && !isActive ? "opacity-40" : "opacity-100"}`}>
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isActive ? (
                        <div className="relative flex h-5 w-5 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={`text-sm ${isActive ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-border/50 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 mb-2 text-primary" />
                <strong className="text-foreground">You may leave safely.</strong> Cloud Tasks continues; return from My follow-ups.
              </div>

              {analysis?.status === "FAILED" && (
                <div className="mt-6">
                  <Button onClick={() => void retry()} disabled={retrying} className="w-full" size="lg">
                    <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? "animate-spin" : ""}`} />
                    {retrying ? copy.restarting : copy.retry}
                  </Button>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                  {copy.refresh}
                </div>
              )}
            </div>
            
          </div>
        </GlassCard>
      </AnimatedText>
    </div>
  );
}
