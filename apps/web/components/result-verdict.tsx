"use client";

import type { ConsumerCaseDetail } from "../lib/case-projection";
import { useLocale } from "../lib/use-locale";

export function ResultVerdict({ detail }: { readonly detail: ConsumerCaseDetail }) {
  const { locale } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  return <section className={`card outcome result-verdict ${detail.outcome.accepted ? "verified" : "waiting"}`}>
    <div className="verdict-heading"><span aria-hidden="true">{detail.outcome.accepted ? "✓" : "…"}</span><div><div className="eyebrow">{detail.outcome.accepted ? tr("Verified result", "Resultado verificado", "Resultado verificado") : tr("Still working", "Sigue trabajando", "Ainda trabalhando")}</div><h2>{detail.outcome.title}</h2></div></div>
    <p>{detail.outcome.explanation}</p>
    <div className="claim-limit">{detail.outcome.limitation}</div>
    <dl className="verdict-meta">
      <div><dt>{tr("Case", "Caso", "Caso")}</dt><dd>{detail.goal}</dd></div>
      <div><dt>{tr("What happens next", "Qué pasa ahora", "O que acontece agora")}</dt><dd>{detail.nextAction}</dd></div>
    </dl>
  </section>;
}
