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
    } catch { setError(cursor ? tr("We could not load more follow-ups. Your current list is still here.", "No pudimos cargar más seguimientos. Tu lista actual sigue disponible.", "Não foi possível carregar mais acompanhamentos. Sua lista atual continua disponível.") : tr("We could not refresh your follow-ups. Sign in if you saved these cases on another device.", "No pudimos actualizar tus seguimientos. Iniciá sesión si los guardaste en otro dispositivo.", "Não foi possível atualizar seus acompanhamentos. Entre se você os salvou em outro dispositivo.")); }
    finally { setLoadingMore(false); }
  }, [tr]);
  useEffect(() => { void load(); }, [load]);

  if (!items && !error) return <section className="card inbox-loading" role="status" aria-live="polite" aria-busy="true">
    <div><span className="case-bucket">{tr("Working", "Trabajando", "Trabalhando")}</span><small>{tr("Checking saved cases", "Revisando casos guardados", "Verificando casos salvos")}</small></div>
    <h2>{tr("Opening your follow-ups…", "Abriendo tus seguimientos…", "Abrindo seus acompanhamentos…")}</h2>
    <p>{tr("Loading the latest company activity and decisions.", "Cargando la actividad y decisiones más recientes.", "Carregando atividades e decisões mais recentes.")}</p>
    <div className="case-loading-steps" aria-hidden="true"><span /><span /><span /></div>
  </section>;
  const empty = identity ? emptyInboxPresentation(identity) : undefined;
  return <div className="mission-inbox">
    {items && items.length > 0 ? <section className="inbox-summary" aria-label={tr("Follow-up summary", "Resumen de seguimientos", "Resumo dos acompanhamentos")}>
      <p><strong>{items.filter((item) => item.bucket === "WORKING").length}</strong><span>{tr("Working", "Trabajando", "Trabalhando")}</span></p>
      <p><strong>{items.filter((item) => item.bucket === "NEEDS_YOU").length}</strong><span>{tr("Need you", "Te necesitan", "Precisam de você")}</span></p>
      <p><strong>{items.filter((item) => item.bucket === "DONE").length}</strong><span>{tr("Done", "Terminados", "Concluídos")}</span></p>
      {identity?.email ? <small>Signed in as {identity.email}</small> : null}
    </section> : null}
    {error ? <section className="card error" role="alert"><p>{error}</p>{identity?.isAnonymous !== false ? <GoogleSignIn compact onSignedIn={() => { void load(); }} /> : null}<button type="button" onClick={() => void load()}>{tr("Try again", "Intentar nuevamente", "Tentar novamente")}</button></section> : null}
    {items?.length === 0 && empty ? <section className="card empty-state"><h2>{empty.heading}</h2><p>{empty.message}</p>{empty.showSignIn ? <GoogleSignIn onSignedIn={() => { void load(); }} /> : <p className="identity-confirmation"><span aria-hidden="true">✓</span> {tr("Google access is active on this device.", "El acceso con Google está activo en este dispositivo.", "O acesso do Google está ativo neste dispositivo.")}</p>}<a className="button-link" href={localize("/intake")}>{tr("Add a promise", "Agregar una promesa", "Adicionar uma promessa")}</a></section> : null}
    {items?.map((item) => <a className={`mission-inbox-card ${item.attentionRequired ? "needs-you" : ""}`} href={localize(item.detailPath ?? `/cases/${item.missionId}/result`)} key={item.missionId}>
      <div><span className="case-bucket">{item.bucket === "NEEDS_YOU" ? tr("Needs you", "Te necesita", "Precisa de você") : item.bucket === "DONE" ? tr("Done", "Terminado", "Concluído") : tr("Working", "Trabajando", "Trabalhando")}</span><small>{item.channelLabel}</small></div>
      <h2>{item.companyName}</h2><p className="case-outcome">{item.outcomeLabel}</p>
      <strong>{item.statusLabel}</strong><p>{item.nextStepLabel}</p>
      <small>{tr("Updated", "Actualizado", "Atualizado")} {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.lastActivityAt))}</small>
    </a>)}
    {nextCursor ? <button type="button" className="secondary inbox-load-more" disabled={loadingMore} onClick={() => { void load(nextCursor); }}>{loadingMore ? tr("Loading more…", "Cargando más…", "Carregando mais…") : tr("Load more follow-ups", "Cargar más seguimientos", "Carregar mais acompanhamentos")}</button> : null}
  </div>;
}
