"use client";

import { useEffect, useState } from "react";
import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import type { InterventionRecord } from "@actionos/runtime/interventions";
import { anonymousIdToken } from "../lib/firebase-client";
import { useLocale } from "../lib/use-locale";

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

  if (error && !payload) return <section className="card error">{error}</section>;
  if (!payload) return <section className="card">{tr("Loading the decision…", "Cargando la decisión…", "Carregando a decisão…")}</section>;
  const latest = payload.interventions.at(-1);
  return (
    <div className="review-grid">
      <section className="card">
        <div className="eyebrow">{tr("Intervention Required", "Intervención requerida", "Intervenção necessária")}</div>
        <h2>{latest?.question ?? (payload.case.state === "DONE" ? tr("Did the target state match expectations?", "¿El estado objetivo cumplió con las expectativas?", "O estado alvo atendeu às expectativas?") : tr("Halt agent execution loop?", "¿Detener el bucle de ejecución?", "Interromper o loop de execução?"))}</h2>
        <p>
          {latest?.requestedField
            ? `Check only the ${latest.requestedField}. ActionOS has not changed the approved plan.`
            : `Current state: ${payload.case.state}`}
        </p>
        {latest ? <code>{latest.reasonCodes.join(" · ")}</code> : null}
        {latest ? <p><strong>{tr("What happens next", "Qué sucede ahora", "O que acontece agora")}:</strong> {latest.consequence}</p> : null}
      </section>
      <section className="card">
        <h2>{tr("Manual Intervention Controls", "Controles de intervención manual", "Controles de intervenção manual")}</h2>
        <p>{tr("Halt prevents future agent execution. Delete completely purges this mission and execution history; side-effects already triggered cannot be reversed.", "Detener impide la ejecución futura. Eliminar purga por completo esta misión y su historial; los efectos secundarios ya desencadenados no se pueden revertir.", "Interromper impede a execução futura do agente. Excluir expurga completamente esta missão e o histórico; efeitos colaterais já acionados não podem ser revertidos.")}</p>
        {payload.case.state === "DONE" ? (
          <>
            <label htmlFor="reopen-reason">{tr("Reason for forced state failure?", "¿Motivo del fallo forzado?", "Motivo da falha forçada?")}</label>
            <textarea
              id="reopen-reason"
              value={reason}
              maxLength={500}
              onChange={(event) => {
                setReason(event.target.value);
              }}
            />
            <button disabled={busy || !reason.trim()} onClick={() => void command("REOPEN")}>
              {tr("Force failure", "Forzar fallo", "Forçar falha")}
            </button>
          </>
        ) : payload.case.state === "NEEDS_ATTENTION" ? latest?.allowedDecisions.includes("REVISE") ? (
          <button disabled={busy} onClick={() => void command("REVISE")}>
            {tr("Revise execution boundaries", "Revisar límites de ejecución", "Revisar limites de execução")}
          </button>
        ) : (
          <button disabled={busy} onClick={() => void command("RESUME")}>
            {tr("Resume execution loop", "Reanudar bucle de ejecución", "Retomar loop de execução")}
          </button>
        ) : (
          <button disabled={busy} onClick={() => void command("STOP")}>
            {tr("Halt execution loop", "Detener bucle de ejecución", "Interromper loop de execução")}
          </button>
        )}
        <button className="secondary" disabled={busy} onClick={() => {
          if (window.confirm(tr("Purge this mission and halt all execution? Side-effects already triggered cannot be reversed.", "¿Purgar esta misión y detener la ejecución? Los efectos secundarios ya desencadenados no se pueden revertir.", "Expurgar esta missão e interromper toda execução? Efeitos colaterais já acionados não podem ser revertidos."))) void command("DELETE");
        }}>
          {tr("Purge mission data", "Purgar datos de misión", "Expurgar dados da missão")}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </div>
  );
}
