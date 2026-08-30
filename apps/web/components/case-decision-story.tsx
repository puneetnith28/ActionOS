"use client";

import type { ConsumerCaseDetail } from "../lib/mission-projection";
import { useLocale } from "../lib/use-locale";

export function CaseDecisionStory({ detail }: { readonly detail: ConsumerCaseDetail }) {
  const { locale } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const contactObserved = detail.attemptCount > 0 || detail.conversation.length > 0;
  const acknowledgementObserved = detail.outcome.acknowledgementOnly;
  return <section className="case-story" aria-label={tr("How ActionOS decides", "Cómo decide ActionOS", "Como o ActionOS decide")}>
    <div data-complete={contactObserved}><span>1</span><p><small>{contactObserved ? tr("CONTACTED", "CONTACTADO", "CONTATADO") : tr("SCHEDULED", "PROGRAMADO", "AGENDADO")}</small><strong>{contactObserved ? tr("Bounded action sent", "Acción limitada enviada", "Ação limitada enviada") : tr("Waiting for the approved action", "Esperando la acción aprobada", "Aguardando a ação aprovada")}</strong></p></div>
    <i aria-hidden="true">→</i>
    <div data-complete={acknowledgementObserved} data-rejected={acknowledgementObserved}><span>2</span><p><small>{acknowledgementObserved ? tr("ACK ≠ PROOF", "ACK ≠ PRUEBA", "ACK ≠ PROVA") : tr("EVIDENCE CHECK", "CONTROL DE EVIDENCIA", "VERIFICAÇÃO DE EVIDÊNCIA")}</small><strong>{acknowledgementObserved ? tr("Mission stayed open", "El caso siguió abierto", "O caso permaneceu aberto") : tr("No weak acknowledgement observed", "No se observó un ACK débil", "Nenhum ACK fraco observado")}</strong></p></div>
    <i aria-hidden="true">→</i>
    <div data-complete={detail.outcome.accepted}><span>3</span><p><small>{detail.outcome.accepted ? tr("VERIFIED", "VERIFICADO", "VERIFICADO") : tr("RETRYING", "REINTENTANDO", "TENTANDO NOVAMENTE")}</small><strong>{detail.outcome.accepted ? tr("Matching evidence accepted", "Evidencia coincidente aceptada", "Evidência correspondente aceita") : tr("Waiting for sufficient proof", "Esperando prueba suficiente", "Aguardando prova suficiente")}</strong></p></div>
  </section>;
}
