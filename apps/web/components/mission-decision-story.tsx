"use client";

import type { ConsumerCaseDetail } from "../lib/mission-projection";
import { useLocale } from "../lib/use-locale";

export function MissionDecisionStory({ detail }: { readonly detail: ConsumerCaseDetail }) {
  const { locale } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const contactObserved = detail.attemptCount > 0 || detail.conversation.length > 0;
  const acknowledgementObserved = detail.outcome.acknowledgementOnly;
  return <section className="mission-story" aria-label={tr("How ActionOS decides", "Cómo decide ActionOS", "Como o ActionOS decide")}>
    <div data-complete={contactObserved}><span>1</span><p><small>{contactObserved ? tr("EXECUTED", "EJECUTADO", "EXECUTADO") : tr("PENDING", "PENDIENTE", "PENDENTE")}</small><strong>{contactObserved ? tr("Agent invoked capabilities", "El agente invocó capacidades", "O agente invocou capacidades") : tr("Waiting for execution", "Esperando ejecución", "Aguardando execução")}</strong></p></div>
    <i aria-hidden="true">→</i>
    <div data-complete={acknowledgementObserved} data-rejected={acknowledgementObserved}><span>2</span><p><small>{acknowledgementObserved ? tr("RETRY REQUIRED", "REINTENTO REQUERIDO", "TENTATIVA NECESSÁRIA") : tr("VERIFICATION", "VERIFICACIÓN", "VERIFICAÇÃO")}</small><strong>{acknowledgementObserved ? tr("Agent recovered from failure", "El agente se recuperó", "O agente se recuperou") : tr("Evaluating system state", "Evaluando el estado", "Avaliando o estado")}</strong></p></div>
    <i aria-hidden="true">→</i>
    <div data-complete={detail.outcome.accepted}><span>3</span><p><small>{detail.outcome.accepted ? tr("VERIFIED", "VERIFICADO", "VERIFICADO") : tr("RUNNING", "EN CURSO", "EM ANDAMENTO")}</small><strong>{detail.outcome.accepted ? tr("Objective achieved", "Objetivo alcanzado", "Objetivo alcançado") : tr("Execution loop active", "Bucle de ejecución activo", "Loop de execução ativo")}</strong></p></div>
  </section>;
}
