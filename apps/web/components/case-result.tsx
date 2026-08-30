"use client";

import { useEffect, useState } from "react";
import type { ConsumerCaseDetail } from "../lib/mission-projection";
import { anonymousIdToken } from "../lib/firebase-client";
import { GoogleSignIn } from "./google-sign-in";
import { NotificationStatus } from "./notification-status";
import { TechnicalRun } from "./technical-run";
import { CaseExport } from "./case-export";
import { CaseDecisionStory } from "./case-decision-story";
import { ResultVerdict } from "./result-verdict";
import { MissionTimeline } from "./mission-timeline";
import { useLocale } from "../lib/use-locale";

export function CaseResult({ missionId }: { readonly missionId: string }) {
  const { locale, localize } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const [detail, setDetail] = useState<ConsumerCaseDetail>();
  const [error, setError] = useState<string>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const token = await anonymousIdToken();
        const response = await fetch(`/api/cases/${missionId}/detail`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const body = await response.json() as ConsumerCaseDetail & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "DETAIL_FAILED");
        if (cancelled) return;
        setDetail(body); setError(undefined); setLastRefreshed(new Date().toISOString());
        if (!["DONE", "CANCELLED", "FAILED", "EXPIRED", "NEEDS_ATTENTION"].includes(body.state)) timeout = setTimeout(() => void load(), 2_000);
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "DETAIL_FAILED"); }
    };
    void load();
    return () => { cancelled = true; if (timeout) clearTimeout(timeout); };
  }, [missionId, refreshKey]);

  if (error && !detail) return <section className="card error case-access-error" role="alert"><h2>{tr("Sign in to open this private case", "Iniciá sesión para abrir este caso privado", "Entre para abrir este caso privado")}</h2><p>{tr("The link does not grant access. Use the Google account that owns this follow-up.", "El enlace no concede acceso. Usá la cuenta Google propietaria del seguimiento.", "O link não concede acesso. Use a conta Google proprietária do acompanhamento.")}</p><GoogleSignIn onSignedIn={() => { setRefreshKey((value) => value + 1); }} /><button type="button" onClick={() => { setRefreshKey((value) => value + 1); }}>{tr("Try current session", "Probar la sesión actual", "Tentar a sessão atual")}</button></section>;
  if (!detail) return <section className="card case-loading" role="status" aria-live="polite" aria-busy="true">
    <div className="eyebrow">{tr("Active Mission", "Misión activa", "Missão ativa")}</div>
    <h2>{tr("Connecting to execution runtime…", "Conectando al entorno de ejecución…", "Conectando ao runtime de execução…")}</h2>
    <p>{tr("Retrieving execution state, active capabilities, and agent activity.", "Recuperando estado de ejecución, capacidades activas y actividad del agente.", "Recuperando estado de execução, capacidades ativas e atividade do agente.")}</p>
    <div className="case-loading-steps" aria-hidden="true"><span /><span /><span /></div>
  </section>;
  const notification = detail.notifications.at(-1);
  return <div className="result-grid consumer-mission-detail">
    {error ? <section className="card error refresh-warning" role="alert"><p>{tr("ActionOS could not refresh. Your last saved state remains below.", "ActionOS no pudo actualizar. El último estado guardado continúa abajo.", "O ActionOS não conseguiu atualizar. O último estado salvo continua abaixo.")}</p><button type="button" onClick={() => { setRefreshKey((value) => value + 1); }}>{tr("Try again", "Intentar nuevamente", "Tentar novamente")}</button></section> : null}
    {lastRefreshed ? <p className="last-updated">{tr("Last refreshed", "Última actualización", "Última atualização")} {new Intl.DateTimeFormat(locale, { timeStyle: "medium" }).format(new Date(lastRefreshed))}</p> : null}
    <ResultVerdict detail={detail} />
    <CaseDecisionStory detail={detail} />
    <section className="case-channel-card" aria-label={tr("Active Capabilities", "Capacidades Activas", "Capacidades Ativas")}><div><span>↗</span><p><small>{tr("OUTBOUND", "SALIDA", "SAÍDA")}</small><strong>{detail.channel.contact}</strong></p></div><i aria-hidden="true">→</i><div><span>✓</span><p><small>{tr("INBOUND", "ENTRADA", "ENTRADA")}</small><strong>{detail.channel.reply}</strong></p></div><i aria-hidden="true">→</i><div><span>●</span><p><small>{tr("NOTIFICATIONS", "NOTIFICACIONES", "NOTIFICAÇÕES")}</small><strong>{detail.returnPath}</strong></p></div></section>
    <p className="preview-label">{detail.channel.disclosure} Authorized endpoint: {detail.channel.recipientHint}.</p>
    {notification ? <NotificationStatus missionId={missionId} notification={notification} onRetried={() => { setRefreshKey((value) => value + 1); }} /> : null}
    {detail.comparison.length ? <section className="card outcome-comparison" aria-labelledby="comparison-title"><div className="eyebrow">{tr("State Verification", "Verificación de estado", "Verificação de estado")}</div><h2 id="comparison-title">{tr("Target vs. Observed", "Objetivo vs. Observado", "Alvo vs. Observado")}</h2><p>{tr("ActionOS requires exact state matching to mark a mission complete.", "ActionOS requiere coincidencias exactas para marcar una misión como completa.", "O ActionOS exige correspondência exata para marcar uma missão como concluída.")}</p><div className="comparison-table" role="table">{detail.comparison.map((row) => <div role="row" key={row.label} data-status={row.status}><strong role="cell">{row.label}</strong><span role="cell">{row.promised}</span><span role="cell">{row.observed}<small>{row.status === "MATCH" ? tr(" Matches", " Coincide", " Corresponde") : row.status === "MISSING" ? tr(" Missing", " Ausente", " Ausente") : tr(" Different", " Diferente", " Diferente")}</small></span></div>)}</div></section> : null}
    <section className="card case-conversation" aria-labelledby="conversation-title"><div className="eyebrow">{tr("Agent Activity", "Actividad del Agente", "Atividade do Agente")}</div><h2 id="conversation-title">{tr("Capability Execution Logs", "Registros de ejecución", "Logs de execução")}</h2>{detail.conversation.length ? <ol>{detail.conversation.map((entry) => <li key={entry.id} data-direction={entry.direction}><div><strong>{entry.title}</strong>{entry.occurredAt ? <time dateTime={entry.occurredAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.occurredAt))}</time> : null}</div><p className="conversation-body">{entry.safeBody}</p><p className="conversation-reason"><span>{entry.status.replaceAll("_", " ")}</span>{entry.reason}</p></li>)}</ol> : <p>{tr("The agent has not invoked any capabilities yet.", "El agente no ha invocado capacidades aún.", "O agente ainda não invocou capacidades.")}</p>}</section>
    <section className="card"><h2>{tr("Mission Interventions", "Intervenciones de Misión", "Intervenções de Missão")}</h2><p>{tr("Pause execution, revoke capabilities, or force state transitions.", "Pausa la ejecución, revoca capacidades o fuerza transiciones.", "Pause a execução, revogue capacidades ou force transições.")}</p><a className="button-link" href={localize(`/missions/${missionId}/exception`)}>{detail.outcome.accepted ? tr("Force failure", "Forzar falla", "Forçar falha") : tr("Halt or inspect mission", "Detener o inspeccionar", "Parar ou inspecionar")}</a></section>
    <section className="card case-timeline-card" aria-labelledby="timeline-title"><div className="eyebrow">{tr("Execution Timeline", "Línea de tiempo de ejecución", "Linha do tempo de execução")}</div><h2 id="timeline-title">{tr("Complete lifecycle", "Ciclo de vida completo", "Ciclo de vida completo")}</h2><p>{tr("ActionOS records every state transition, autonomous action, and counterparty result.", "ActionOS registra cada transición de estado, acción autónoma y resultado de contraparte.", "ActionOS registra cada transição de estado, ação autônoma e resultado da contraparte.")}</p><MissionTimeline events={detail.timeline} channel={detail.channel.type} /></section>
    {detail.technicalTraceEligible ? <TechnicalRun missionId={missionId} /> : null}<CaseExport missionId={missionId} />
  </div>;
}
