"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { anonymousIdToken } from "../lib/firebase-client";
import { errorCopy } from "../lib/error-copy";
import { useLocale } from "../lib/use-locale";
import { GlassCard } from "./ui/GlassCard";
import InteractiveCard from "./ui/InteractiveCard";
import AnimatedText, { TypewriterText } from "./ui/AnimatedText";
import { AnimatedCubes } from "./ui/AnimatedCubes";
import { Button } from "./ui/button";
import { Paperclip, X, Zap, Loader2 } from "lucide-react";

export function IntakeForm() {
  const router = useRouter();
  const { localize } = useLocale();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [executionMode, setExecutionMode] = useState<"automatic" | "ask">("ask");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function submit() {
    setBusy(true);
    setError(undefined);
    try {
      const token = await anonymousIdToken();
      const body = new FormData();
      if (text.trim()) body.set("text", text);
      if (file) body.set("file", file);
      
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body
      });
      const result = (await response.json()) as { missionId?: string; status?: string; error?: string };
      if (!response.ok || !result.missionId) throw new Error(result.error ?? "INTAKE_FAILED");
      
      router.push(
        result.status === "READY"
          ? localize(`/missions/${result.missionId}/review`)
          : localize(`/missions/${result.missionId}/analyzing`)
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "INTAKE_FAILED");
      setBusy(false);
    }
  }

  const ready = text.trim().length > 0 || file !== undefined;

  return (
    <div data-testid="intake-form" data-hydrated={hydrated} aria-busy={busy} className="max-w-4xl mx-auto py-12">
      {busy ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AnimatedCubes />
          <TypewriterText text="ActionOS is interpreting your intent and crafting a mission plan..." className="text-xl font-medium mt-12 text-center text-primary" speed={0.03} />
        </div>
      ) : (
        <div className="space-y-8">
          <AnimatedText delay={0.1}>
            <GlassCard className="overflow-hidden">
              <textarea
                className="w-full min-h-[240px] bg-transparent border-none text-foreground text-lg outline-none p-6 resize-none placeholder:text-muted-foreground/60 no-scrollbar"
                value={text}
                disabled={busy}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell ActionOS what you want accomplished..."
              />
              <div className="flex items-center justify-between px-6 py-4 bg-background/50 border-t border-border/50 backdrop-blur-sm">
                <div className="relative">
                  <label htmlFor="artifact" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    <Paperclip className="w-4 h-4" /> 
                    {file ? file.name : "Attach context file"}
                  </label>
                  <input
                    id="artifact"
                    type="file"
                    disabled={busy}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0])}
                  />
                </div>
                {file && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFile(undefined)} className="h-8 gap-2 text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" /> Remove
                  </Button>
                )}
              </div>
            </GlassCard>
          </AnimatedText>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InteractiveCard delay={0.2} hoverScale={1.02}>
              <GlassCard className="p-6 h-full flex flex-col">
                <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">Capabilities</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Email", "HTTP", "Data", "Files"].map(cap => (
                    <span key={cap} className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground border border-border">
                      {cap}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-auto">
                  The agent will automatically select the necessary capabilities based on the mission goal.
                </p>
              </GlassCard>
            </InteractiveCard>

            <InteractiveCard delay={0.3} hoverScale={1.02}>
              <GlassCard className="p-6 h-full flex flex-col">
                <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">Execution Strategy</h3>
                <div className="flex flex-col gap-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="radio" name="exec-mode" className="mt-1" checked={executionMode === "automatic"} onChange={() => setExecutionMode("automatic")} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Automatic</span>
                      <span className="text-xs text-muted-foreground">Execute plan immediately</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="radio" name="exec-mode" className="mt-1" checked={executionMode === "ask"} onChange={() => setExecutionMode("ask")} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Ask before sensitive actions</span>
                      <span className="text-xs text-muted-foreground">Require human approval</span>
                    </div>
                  </label>
                </div>
              </GlassCard>
            </InteractiveCard>
          </div>

          {error && (
            <AnimatedText delay={0}>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {errorCopy(error)}
              </div>
            </AnimatedText>
          )}

          <AnimatedText delay={0.4} className="flex justify-end pt-4">
            <Button
              size="lg"
              className="gap-2 px-8 shadow-lg shadow-primary/20"
              type="button"
              disabled={!ready || busy}
              onClick={submit}
            >
              <Zap className="w-4 h-4" />
              Review Mission Plan <span className="opacity-70">→</span>
            </Button>
          </AnimatedText>
        </div>
      )}
    </div>
  );
}
