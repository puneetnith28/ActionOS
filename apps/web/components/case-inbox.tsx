"use client";

import { useCallback, useEffect, useState } from "react";
import { anonymousIdToken, recoverableIdentity } from "../lib/firebase-client";
import type { CaseSummary } from "../lib/missions-controller";
import { emptyInboxPresentation, type InboxIdentity } from "../lib/inbox-presentation";
import { GoogleSignIn } from "./google-sign-in";
import { useLocale } from "../lib/use-locale";

export function CaseInbox() {
  const { locale, localize } = useLocale();
  const tr = useCallback((en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en, [locale]);
  const [items, setItems] = useState<CaseSummary[]>();
  const [identity, setIdentity] = useState<InboxIdentity>();
  const [nextCursor, setNextCursor] = useState<string | null>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();
  const load = useCallback(async (cursor?: string) => {
    if (cursor) setLoadingMore(true);
    try {
      const [token, currentIdentity] = await Promise.all([anonymousIdToken(), recoverableIdentity()]);
      const query = new URLSearchParams({ limit: "25" });
      if (cursor) query.set("cursor", cursor);
      const response = await fetch(`/api/cases?${query}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json() as { items?: CaseSummary[]; nextCursor?: string | null; error?: string };
      if (!response.ok || !result.items) throw new Error(result.error ?? "CASES_FAILED");
      const pageItems = result.items;
      setItems((current) => cursor && current ? [...current, ...pageItems] : pageItems);
      setNextCursor(result.nextCursor ?? null); setIdentity(currentIdentity); setError(undefined);
    } catch { setError(cursor ? tr("Could not load more missions. The current list remains active.", "No pudimos cargar más misiones. La lista actual sigue activa.", "Não foi possível carregar mais missões. A lista atual continua ativa.") : tr("Could not retrieve execution state. Please sign in if you created these missions on another device.", "No pudimos recuperar el estado de ejecución. Iniciá sesión si creaste estas misiones en otro dispositivo.", "Não foi possível recuperar o estado de execução. Entre se você criou essas missões em outro dispositivo.")); }
    finally { setLoadingMore(false); }
  }, [tr]);
  useEffect(() => { void load(); }, [load]);

  if (!items && !error) return <section className="card inbox-loading" role="status" aria-live="polite" aria-busy="true">
    <div><span className="case-bucket">{tr("Connecting", "Conectando", "Conectando")}</span><small>{tr("Checking runtime state", "Revisando el estado de ejecución", "Verificando o estado de execução")}</small></div>
    <h2>{tr("Retrieving missions…", "Recuperando misiones…", "Recuperando missões…")}</h2>
    <p>{tr("Loading the latest execution outcomes and agent decisions.", "Cargando los últimos resultados de ejecución y decisiones del agente.", "Carregando os últimos resultados de execução e decisões do agente.")}</p>
    <div className="case-loading-steps" aria-hidden="true"><span /><span /><span /></div>
  </section>;
  const empty = identity ? emptyInboxPresentation(identity) : undefined;
  return <div className="mission-inbox">
    {items && items.length > 0 ? <section className="inbox-summary" aria-label={tr("Mission summary", "Resumen de misiones", "Resumo das missões")}>
      <p><strong>{items.filter((item) => item.bucket === "WORKING").length}</strong><span>{tr("Running", "En curso", "Em andamento")}</span></p>
      <p><strong>{items.filter((item) => item.bucket === "NEEDS_YOU").length}</strong><span>{tr("Intervention", "Intervención", "Intervenção")}</span></p>
      <p><strong>{items.filter((item) => item.bucket === "DONE").length}</strong><span>{tr("Verified", "Verificadas", "Verificadas")}</span></p>
      {identity?.email ? <small>Signed in as {identity.email}</small> : null}
    </section> : null}
    {error ? <section className="card error" role="alert"><p>{error}</p>{identity?.isAnonymous !== false ? <GoogleSignIn compact onSignedIn={() => { void load(); }} /> : null}<button type="button" onClick={() => void load()}>{tr("Try again", "Intentar nuevamente", "Tentar novamente")}</button></section> : null}
    {items?.length === 0 && empty ? <section className="card empty-state"><h2>{empty.heading}</h2><p>{empty.message}</p>{empty.showSignIn ? <GoogleSignIn onSignedIn={() => { void load(); }} /> : <p className="identity-confirmation"><span aria-hidden="true">✓</span> {tr("Google access is active on this device.", "El acceso con Google está activo en este dispositivo.", "O acesso do Google está ativo neste dispositivo.")}</p>}<a className="button-link" href={localize("/intake")}>{tr("Define objective", "Definir objetivo", "Definir objetivo")}</a></section> : null}
    {items?.map((item) => <a className={`mission-inbox-card ${item.attentionRequired ? "needs-you" : ""}`} href={localize(item.detailPath ?? `/missions/${item.missionId}/result`)} key={item.missionId}>
      <div><span className="case-bucket">{item.bucket === "NEEDS_YOU" ? tr("Intervention", "Intervención", "Intervenção") : item.bucket === "DONE" ? tr("Verified", "Verificada", "Verificada") : tr("Running", "En curso", "Em andamento")}</span><small>{item.channelLabel}</small></div>
      <h2>{item.companyName}</h2><p className="case-outcome">{item.outcomeLabel}</p>
      <strong>{item.statusLabel}</strong><p>{item.nextStepLabel}</p>
      <small>{tr("Updated", "Actualizado", "Atualizado")} {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.lastActivityAt))}</small>
    </a>)}
    {nextCursor ? <button type="button" className="secondary inbox-load-more" disabled={loadingMore} onClick={() => { void load(nextCursor); }}>{loadingMore ? tr("Retrieving…", "Recuperando…", "Recuperando…") : tr("Load older missions", "Cargar misiones anteriores", "Carregar missões mais antigas")}</button> : null}
  </div>;
}
