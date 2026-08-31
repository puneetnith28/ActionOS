"use client";

import { useCallback, useEffect, useState } from "react";
import { anonymousIdToken, recoverableIdentity } from "../lib/firebase-client";
import type { MissionSummary } from "../lib/missions-controller";
import { emptyInboxPresentation, type InboxIdentity } from "../lib/inbox-presentation";
import { GoogleSignIn } from "./google-sign-in";
import { useLocale } from "../lib/use-locale";

export function MissionInbox({ filterBucket, hideSummary }: { filterBucket?: "WORKING" | "NEEDS_YOU" | "DONE"; hideSummary?: boolean } = {}) {
  const { locale, localize } = useLocale();
  const tr = useCallback((en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en, [locale]);
  const [items, setItems] = useState<MissionSummary[]>();
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
      if (filterBucket) query.set("bucket", filterBucket);
      const response = await fetch(`/api/missions?${query}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json() as { items?: MissionSummary[]; nextCursor?: string | null; error?: string };
      if (!response.ok || !result.items) throw new Error(result.error ?? "CASES_FAILED");
      const pageItems = result.items;
      setItems((current) => cursor && current ? [...current, ...pageItems] : pageItems);
      setNextCursor(result.nextCursor ?? null); setIdentity(currentIdentity); setError(undefined);
    } catch { setError(cursor ? tr("Could not load more missions. The current list remains active.", "No pudimos cargar más misiones. La lista actual sigue activa.", "Não foi possível carregar mais missões. A lista atual continua ativa.") : tr("Could not retrieve execution state. Please sign in if you created these missions on another device.", "No pudimos recuperar el estado de ejecución. Iniciá sesión si creaste estas misiones en otro dispositivo.", "Não foi possível recuperar o estado de execução. Entre se você criou essas missões em outro dispositivo.")); }
    finally { setLoadingMore(false); }
  }, [tr]);
  useEffect(() => { void load(); }, [load]);

  if (!items && !error) return (
    <section className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center backdrop-blur-xl">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#BEF202] font-medium mb-6">
        <span className="w-2 h-2 rounded-full bg-[#BEF202] animate-pulse"></span> {tr("Connecting", "Conectando", "Conectando")}
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{tr("Retrieving missions…", "Recuperando misiones…", "Recuperando missões…")}</h2>
      <p className="text-white/50 max-w-md">{tr("Loading the latest execution outcomes and agent decisions.", "Cargando los últimos resultados de ejecución y decisiones del agente.", "Carregando os últimos resultados de execução e decisões do agente.")}</p>
    </section>
  );

  const empty = identity ? emptyInboxPresentation(identity) : undefined;
  
  return (
    <div className="w-full flex flex-col gap-8">
      {items && items.length > 0 && !hideSummary && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col gap-1 hover:bg-white/10 transition-colors">
            <strong className="text-3xl text-white font-bold">{items.filter((item) => item.bucket === "WORKING").length}</strong>
            <span className="text-white/50 text-sm uppercase tracking-wider">{tr("Running", "En curso", "Em andamento")}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col gap-1 hover:bg-white/10 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BEF202] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <strong className="text-3xl text-[#BEF202] font-bold z-10">{items.filter((item) => item.bucket === "NEEDS_YOU").length}</strong>
            <span className="text-white/50 text-sm uppercase tracking-wider z-10">{tr("Intervention", "Intervención", "Intervenção")}</span>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col gap-1 hover:bg-white/10 transition-colors">
            <strong className="text-3xl text-white font-bold">{items.filter((item) => item.bucket === "DONE").length}</strong>
            <span className="text-white/50 text-sm uppercase tracking-wider">{tr("Verified", "Verificadas", "Verificadas")}</span>
          </div>
          {identity?.email && <div className="col-span-full text-right text-xs text-white/30 mt-2">Signed in as {identity.email}</div>}
        </section>
      )}
      
      {error && (
        <section className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-6">
          <p className="text-red-400 font-medium">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 items-start justify-center mt-2">
            {identity?.isAnonymous !== false && <GoogleSignIn compact onSignedIn={() => { void load(); }} />}
            <button type="button" onClick={() => void load()} className="px-6 py-2.5 rounded-full bg-white/5 text-white hover:bg-white/10 hover:text-[#BEF202] transition-colors text-sm font-medium border border-white/10 mt-0">
              {tr("Try again", "Intentar nuevamente", "Tentar novamente")}
            </button>
          </div>
        </section>
      )}
      
      {items?.length === 0 && empty && (
        <section className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-white mb-2">{empty.heading}</h2>
          <p className="text-white/50 mb-8 max-w-md">{empty.message}</p>
          {empty.showSignIn ? (
            <GoogleSignIn onSignedIn={() => { void load(); }} />
          ) : (
            <p className="text-green-400 text-sm mb-6 flex items-center gap-2">
              <span aria-hidden="true" className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-xs">✓</span> 
              {tr("Google access is active on this device.", "El acceso con Google está activo en este dispositivo.", "O acesso do Google está ativo neste dispositivo.")}
            </p>
          )}
          <a href={localize("/intake")} className="mt-4 px-6 py-3 rounded-full bg-[#BEF202] text-black hover:bg-[#a5d202] transition-all duration-200 font-semibold shadow-[0_0_15px_rgba(190,242,2,0.3)]">
            {tr("Define objective", "Definir objetivo", "Definir objetivo")}
          </a>
        </section>
      )}

      <div className="flex flex-col gap-4">
        {items?.map((item) => (
          <a href={localize(item.detailPath ?? `/missions/${item.missionId}/result`)} key={item.missionId} className={`group bg-black/40 backdrop-blur-md border ${item.attentionRequired ? 'border-[#BEF202]/50 shadow-[0_0_20px_rgba(190,242,2,0.1)]' : 'border-white/10'} rounded-2xl p-6 hover:bg-white/5 transition-all flex flex-col md:flex-row justify-between gap-6`}>
            <div className="flex flex-col gap-2 flex-grow">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded border text-[10px] uppercase font-bold tracking-wider ${item.bucket === "NEEDS_YOU" ? 'bg-[#BEF202]/10 border-[#BEF202]/30 text-[#BEF202]' : item.bucket === "DONE" ? 'bg-white/5 border-white/10 text-white/50' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                  {item.bucket === "NEEDS_YOU" ? tr("Intervention Required", "Intervención requerida", "Intervenção necessária") : item.bucket === "DONE" ? tr("Verified", "Verificada", "Verificada") : tr("Running", "En curso", "Em andamento")}
                </span>
                <small className="text-white/40 text-xs">{item.channelLabel}</small>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{item.companyName}</h2>
              <p className="text-white/70 text-sm mt-1">{item.outcomeLabel}</p>
            </div>
            
            <div className="flex flex-col md:items-end justify-between md:text-right gap-4">
              <div>
                <strong className="text-sm text-white/90 block mb-1">{item.statusLabel}</strong>
                <p className="text-white/50 text-xs max-w-[250px]">{item.nextStepLabel}</p>
              </div>
              <small className="text-white/30 text-[10px] uppercase tracking-wider">
                {tr("Updated", "Actualizado", "Atualizado")} {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.lastActivityAt))}
              </small>
            </div>
          </a>
        ))}
      </div>

      {nextCursor && (
        <div className="flex justify-center mt-6">
          <button type="button" disabled={loadingMore} onClick={() => { void load(nextCursor); }} className="px-6 py-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm disabled:opacity-50">
            {loadingMore ? tr("Retrieving…", "Recuperando…", "Recuperando…") : tr("Load older missions", "Cargar misiones anteriores", "Carregar missões mais antigas")}
          </button>
        </div>
      )}
    </div>
  );
}
