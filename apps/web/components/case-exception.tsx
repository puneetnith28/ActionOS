"use client";

import { useEffect, useState } from "react";
import type { FollowThroughCase } from "@dueback/runtime/case-runner";
import type { InterventionRecord } from "@dueback/runtime/interventions";
import { anonymousIdToken } from "../lib/firebase-client";
import { useLocale } from "../lib/use-locale";

interface ExceptionPayload {
  case: FollowThroughCase;
  interventions: InterventionRecord[];
  error?: string;
}

export function CaseException({ caseId }: { readonly caseId: string }) {
  const { locale, localize } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const [payload, setPayload] = useState<ExceptionPayload>();
  const [reason, setReason] = useState("The promised result did not actually arrive.");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function load() {
    const token = await anonymousIdToken();
    const response = await fetch(`/api/cases/${caseId}/result`, {
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
  }, [caseId]);

  async function command(action: "STOP" | "REOPEN" | "RESUME" | "REVISE" | "DELETE") {
    if (!payload) return;
    setBusy(true);
    setError(undefined);
    try {
      const token = await anonymousIdToken();
      const response = await fetch(`/api/cases/${caseId}/control`, {
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
        window.location.assign(localize(`/cases/${caseId}/review`));
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
        <div className="eyebrow">{tr("Your decision is required", "Necesitamos tu decisión", "Precisamos da sua decisão")}</div>
        <h2>{latest?.question ?? (payload.case.state === "DONE" ? tr("Did the promised result actually arrive?", "¿Llegó realmente el resultado prometido?", "O resultado prometido realmente chegou?") : tr("Should DueBack stop future actions?", "¿DueBack debe detener las acciones futuras?", "O DueBack deve interromper as ações futuras?"))}</h2>
        <p>
          {latest?.requestedField
            ? `Check only the ${latest.requestedField}. DueBack has not changed the approved plan.`
            : `Current state: ${payload.case.state}`}
        </p>
        {latest ? <code>{latest.reasonCodes.join(" · ")}</code> : null}
        {latest ? <p><strong>{tr("What happens next", "Qué sucede ahora", "O que acontece agora")}:</strong> {latest.consequence}</p> : null}
      </section>
      <section className="card">
        <h2>{tr("You remain in control", "Vos mantenés el control", "Você mantém o controle")}</h2>
        <p>{tr("Stop prevents future actions. Delete removes this case and its nested records; actions already sent cannot be recalled.", "Detener impide acciones futuras. Eliminar borra el caso y sus registros; las acciones ya enviadas no pueden recuperarse.", "Parar impede ações futuras. Excluir remove o caso e seus registros; ações já enviadas não podem ser recuperadas.")}</p>
        {payload.case.state === "DONE" ? (
          <>
            <label htmlFor="reopen-reason">{tr("Why is this not resolved?", "¿Por qué no está resuelto?", "Por que isto não está resolvido?")}</label>
            <textarea
              id="reopen-reason"
              value={reason}
              maxLength={500}
              onChange={(event) => {
                setReason(event.target.value);
              }}
            />
            <button disabled={busy || !reason.trim()} onClick={() => void command("REOPEN")}>
              {tr("This isn't resolved", "Esto no está resuelto", "Isto não está resolvido")}
            </button>
          </>
        ) : payload.case.state === "NEEDS_ATTENTION" ? latest?.allowedDecisions.includes("REVISE") ? (
          <button disabled={busy} onClick={() => void command("REVISE")}>
            {tr("Correct the approved plan", "Corregir el plan aprobado", "Corrigir o plano aprovado")}
          </button>
        ) : (
          <button disabled={busy} onClick={() => void command("RESUME")}>
            {tr("Retry within the approved limits", "Reintentar dentro de los límites aprobados", "Tentar novamente dentro dos limites aprovados")}
          </button>
        ) : (
          <button disabled={busy} onClick={() => void command("STOP")}>
            {tr("Stop future actions", "Detener acciones futuras", "Interromper ações futuras")}
          </button>
        )}
        <button className="secondary" disabled={busy} onClick={() => {
          if (window.confirm(tr("Delete this case and stop all future actions? Actions already sent cannot be recalled.", "¿Eliminar este caso y detener toda acción futura? Las acciones enviadas no pueden recuperarse.", "Excluir este caso e interromper todas as ações futuras? Ações enviadas não podem ser recuperadas."))) void command("DELETE");
        }}>
          {tr("Delete this case", "Eliminar este caso", "Excluir este caso")}
        </button>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </div>
  );
}
