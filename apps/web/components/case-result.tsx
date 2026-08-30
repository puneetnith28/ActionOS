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
    <div className="eyebrow">{tr("Your follow-up", "Tu seguimiento", "Seu acompanhamento")}</div>
    <h2>{tr("Opening the latest saved state…", "Abriendo el último estado guardado…", "Abrindo o último estado salvo…")}</h2>
    <p>{tr("Checking the case, company response and proof decision.", "Revisando el caso, la respuesta y la decisión de prueba.", "Verificando o caso, a resposta e a decisão de prova.")}</p>
    <div className="case-loading-steps" aria-hidden="true"><span /><span /><span /></div>
  </section>;
  const notification = detail.notifications.at(-1);
  return <div className="result-grid consumer-case-detail">
    {error ? <section className="card error refresh-warning" role="alert"><p>{tr("ActionOS could not refresh. Your last saved state remains below.", "ActionOS no pudo actualizar. El último estado guardado continúa abajo.", "O ActionOS não conseguiu atualizar. O último estado salvo continua abaixo.")}</p><button type="button" onClick={() => { setRefreshKey((value) => value + 1); }}>{tr("Try again", "Intentar nuevamente", "Tentar novamente")}</button></section> : null}
    {lastRefreshed ? <p className="last-updated">{tr("Last refreshed", "Última actualización", "Última atualização")} {new Intl.DateTimeFormat(locale, { timeStyle: "medium" }).format(new Date(lastRefreshed))}</p> : null}
    <ResultVerdict detail={detail} />
    <CaseDecisionStory detail={detail} />
    <section className="case-channel-card" aria-label={tr("How this follow-up communicates", "Cómo se comunica este seguimiento", "Como este acompanhamento se comunica")}><div><span>↗</span><p><small>{tr("CONTACT", "CONTACTO", "CONTATO")}</small><strong>{detail.channel.contact}</strong></p></div><i aria-hidden="true">→</i><div><span>✓</span><p><small>{tr("REPLY", "RESPUESTA", "RESPOSTA")}</small><strong>{detail.channel.reply}</strong></p></div><i aria-hidden="true">→</i><div><span>●</span><p><small>{tr("YOUR UPDATE", "TU NOVEDAD", "SUA ATUALIZAÇÃO")}</small><strong>{detail.returnPath}</strong></p></div></section>
    <p className="preview-label">{detail.channel.disclosure} Recipient: {detail.channel.recipientHint}.</p>
    {notification ? <NotificationStatus missionId={missionId} notification={notification} onRetried={() => { setRefreshKey((value) => value + 1); }} /> : null}
    {detail.comparison.length ? <section className="card outcome-comparison" aria-labelledby="comparison-title"><div className="eyebrow">{tr("Proof check", "Verificación de prueba", "Verificação da prova")}</div><h2 id="comparison-title">{tr("Promised vs. observed", "Prometido vs. observado", "Prometido vs. observado")}</h2><p>{tr("Missing facts stay missing; ActionOS never copies them from the promise.", "Los datos ausentes siguen ausentes; ActionOS nunca los copia de la promesa.", "Dados ausentes continuam ausentes; o ActionOS nunca os copia da promessa.")}</p><div className="comparison-table" role="table">{detail.comparison.map((row) => <div role="row" key={row.label} data-status={row.status}><strong role="cell">{row.label}</strong><span role="cell">{row.promised}</span><span role="cell">{row.observed}<small>{row.status === "MATCH" ? tr(" Matches", " Coincide", " Corresponde") : row.status === "MISSING" ? tr(" Missing", " Ausente", " Ausente") : tr(" Different", " Diferente", " Diferente")}</small></span></div>)}</div></section> : null}
    <section className="card case-conversation" aria-labelledby="conversation-title"><div className="eyebrow">{tr("Conversation", "Conversación", "Conversa")}</div><h2 id="conversation-title">{tr("What ActionOS and the company said", "Qué dijeron ActionOS y la empresa", "O que o ActionOS e a empresa disseram")}</h2>{detail.conversation.length ? <ol>{detail.conversation.map((entry) => <li key={entry.id} data-direction={entry.direction}><div><strong>{entry.title}</strong>{entry.occurredAt ? <time dateTime={entry.occurredAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.occurredAt))}</time> : null}</div><p className="conversation-body">{entry.safeBody}</p><p className="conversation-reason"><span>{entry.status.replaceAll("_", " ")}</span>{entry.reason}</p></li>)}</ol> : <p>{tr("ActionOS has not contacted the company yet.", "ActionOS todavía no contactó a la empresa.", "O ActionOS ainda não contatou a empresa.")}</p>}</section>
    <section className="card"><h2>{tr("Mission controls", "Controles del caso", "Controles do caso")}</h2><p>{tr("Stop future actions or report that an accepted result did not arrive.", "Detené acciones futuras o informá que un resultado aceptado no llegó.", "Interrompa ações futuras ou informe que um resultado aceito não chegou.")}</p><a className="button-link" href={localize(`/cases/${missionId}/exception`)}>{detail.outcome.accepted ? tr("This isn't resolved", "Esto no está resuelto", "Isto não está resolvido") : tr("Review or stop this case", "Revisar o detener este caso", "Revisar ou interromper este caso")}</a></section>
    <details className="card technical-disclosure"><summary>{tr("Technical activity", "Actividad técnica", "Atividade técnica")}</summary><p>{tr("Consumer-safe lifecycle events; identifiers and private message content are not exposed.", "Eventos seguros del ciclo de vida; no se exponen identificadores ni mensajes privados.", "Eventos seguros do ciclo de vida; identificadores e mensagens privadas não são expostos.")}</p><ol>{detail.timeline.map((event) => <li key={event.eventId}><strong>{event.type.replaceAll("_", " ")}</strong> · {event.state.replaceAll("_", " ")} · <time dateTime={event.occurredAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurredAt))}</time></li>)}</ol></details>
    {detail.technicalTraceEligible ? <TechnicalRun missionId={missionId} /> : null}<CaseExport missionId={missionId} />
  </div>;
}
