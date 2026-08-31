"use client";

import { useEffect, useState } from "react";
import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import type { InterventionRecord } from "@actionos/runtime/interventions";
import { anonymousIdToken } from "../lib/firebase-client";
import { useLocale } from "../lib/use-locale";
import { GlassCard } from "./ui/GlassCard";
import InteractiveCard from "./ui/InteractiveCard";
import AnimatedText, { TypewriterText } from "./ui/AnimatedText";
import { Button } from "./ui/button";
import { AlertTriangle, StopCircle, RefreshCw, Trash2, ArrowRightCircle } from "lucide-react";

interface ExceptionPayload {
  case: FollowThroughMission;
  interventions: InterventionRecord[];
  error?: string;
}

export function MissionException({ missionId }: { readonly missionId: string }) {
  const { locale, localize } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const [payload, setPayload] = useState<ExceptionPayload>();
  const [reason, setReason] = useState("The expected system state was not achieved.");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function load() {
    const token = await anonymousIdToken();
    const response = await fetch(`/api/missions/${missionId}/result`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const result = (await response.json()) as ExceptionPayload;
    if (!response.ok) throw new Error(result.error ?? "CASE_LOAD_FAILED");
    setPayload(result);
  }

  useEffect(() => {
    void load().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "CASE_LOAD_FAILED");
    });
  }, [missionId]);

  async function command(action: "STOP" | "REOPEN" | "RESUME" | "REVISE" | "DELETE") {
    if (!payload) return;
    setBusy(true);
    setError(undefined);
    try {
      const token = await anonymousIdToken();
      const response = await fetch(`/api/missions/${missionId}/control`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, expectedVersion: payload.case.version, reason, idempotencyKey: crypto.randomUUID() })
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "CONTROL_FAILED");
      if (action === "DELETE") {
        window.location.assign(`${localize("/intake")}?deleted=1`);
        return;
      }
      if (action === "REVISE") {
        window.location.assign(localize(`/missions/${missionId}/review`));
        return;
      }
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "CONTROL_FAILED");
    } finally {
      setBusy(false);
    }
  }

  if (error && !payload) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <GlassCard className="max-w-md w-full p-6 border-destructive/50 bg-destructive/10 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </GlassCard>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <TypewriterText text={tr("Loading the decision…", "Cargando la decisión…", "Carregando a decisão…")} className="text-lg font-medium text-muted-foreground" speed={0.03} />
      </div>
    );
  }

  const latest = payload.interventions.at(-1);

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatedText delay={0.1}>
          <GlassCard className="p-8 h-full flex flex-col border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <div className="text-xs font-bold tracking-widest text-amber-500 uppercase">{tr("Intervention Required", "Intervención requerida", "Intervenção necessária")}</div>
            </div>
            
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {latest?.question ?? (payload.case.state === "DONE" ? tr("Did the target state match expectations?", "¿El estado objetivo cumplió con las expectativas?", "O estado alvo atendeu às expectativas?") : tr("Halt agent execution loop?", "¿Detener el bucle de ejecución?", "Interromper o loop de execução?"))}
            </h2>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {latest?.requestedField
                ? `Check only the ${latest.requestedField}. ActionOS has not changed the approved plan.`
                : `Current state: ${payload.case.state.replaceAll("_", " ")}`}
            </p>
            
            {latest ? (
              <div className="bg-background/50 p-4 rounded-md border border-border/50 mb-6 font-mono text-xs text-amber-500">
                {latest.reasonCodes.join(" · ")}
              </div>
            ) : null}
            
            {latest ? (
              <div className="mt-auto pt-6 border-t border-border/50">
                <strong className="text-foreground">{tr("What happens next", "Qué sucede ahora", "O que acontece agora")}:</strong> 
                <span className="text-muted-foreground ml-2">{latest.consequence}</span>
              </div>
            ) : null}
          </GlassCard>
        </AnimatedText>

        <AnimatedText delay={0.2}>
          <InteractiveCard hoverScale={1}>
            <GlassCard className="p-8 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {tr("Manual Intervention Controls", "Controles de intervención manual", "Controles de intervenção manual")}
              </h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                {tr("Halt prevents future agent execution. Delete completely purges this mission and execution history; side-effects already triggered cannot be reversed.", "Detener impide la ejecución futura. Eliminar purga por completo esta misión y su historial; los efectos secundarios ya desencadenados no se pueden revertir.", "Interromper impede a execução futura do agente. Excluir expurga completamente esta missão e o histórico; efeitos colaterais já acionados não podem ser revertidos.")}
              </p>

              <div className="space-y-4 mb-8">
                {payload.case.state === "DONE" ? (
                  <div className="space-y-4">
                    <label htmlFor="reopen-reason" className="text-sm font-medium text-foreground">
                      {tr("Reason for forced state failure?", "¿Motivo del fallo forzado?", "Motivo da falha forçada?")}
                    </label>
                    <textarea
                      id="reopen-reason"
                      className="w-full min-h-[100px] bg-background/50 border border-border/50 rounded-md text-sm text-foreground p-3 resize-none outline-none focus:border-primary/50 transition-colors"
                      value={reason}
                      maxLength={500}
                      onChange={(event) => setReason(event.target.value)}
                    />
                    <Button variant="outline" className="w-full" disabled={busy || !reason.trim()} onClick={() => void command("REOPEN")}>
                      <StopCircle className="w-4 h-4 mr-2" />
                      {tr("Force failure", "Forzar fallo", "Forçar falha")}
                    </Button>
                  </div>
                ) : payload.case.state === "NEEDS_ATTENTION" ? (
                  latest?.allowedDecisions.includes("REVISE") ? (
                    <Button className="w-full" size="lg" disabled={busy} onClick={() => void command("REVISE")}>
                      <ArrowRightCircle className="w-4 h-4 mr-2" />
                      {tr("Revise execution boundaries", "Revisar límites de ejecución", "Revisar limites de execução")}
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" disabled={busy} onClick={() => void command("RESUME")}>
                      <ArrowRightCircle className="w-4 h-4 mr-2" />
                      {tr("Resume execution loop", "Reanudar bucle de ejecución", "Retomar loop de execução")}
                    </Button>
                  )
                ) : (
                  <Button variant="outline" className="w-full text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white" disabled={busy} onClick={() => void command("STOP")}>
                    <StopCircle className="w-4 h-4 mr-2" />
                    {tr("Halt execution loop", "Detener bucle de ejecución", "Interromper loop de execução")}
                  </Button>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-border/50">
                <Button 
                  variant="ghost" 
                  className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground" 
                  disabled={busy} 
                  onClick={() => {
                    if (window.confirm(tr("Purge this mission and halt all execution? Side-effects already triggered cannot be reversed.", "¿Purgar esta misión y detener la ejecución? Los efectos secundarios ya desencadenados no se pueden revertir.", "Expurgar esta missão e interromper toda execução? Efeitos colaterais já acionados não podem ser revertidos."))) void command("DELETE");
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {tr("Purge mission data", "Purgar datos de misión", "Expurgar dados da missão")}
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                  {error}
                </div>
              )}
            </GlassCard>
          </InteractiveCard>
        </AnimatedText>
      </div>
    </div>
  );
}
