"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { anonymousIdToken } from "../lib/firebase-client";
import { getInteractiveCopy } from "../lib/interactive-copy";
import { useLocale } from "../lib/use-locale";

interface AnalysisStatus {
  status: "QUEUED" | "ANALYZING" | "READY" | "FAILED";
  stage: "EVIDENCE_SECURED" | "GEMINI_EXTRACTION" | "VALIDATING" | "REVIEW_READY" | "FAILED";
  attemptCount: number;
  createdAt: string;
  error?: string;
}

const stageIds = ["EVIDENCE_SECURED", "GEMINI_EXTRACTION", "VALIDATING", "REVIEW_READY"] as const;

export function AnalysisProgress({ caseId, preview }: { readonly caseId: string; readonly preview?: AnalysisStatus }) {
  const router = useRouter();
  const { locale, localize } = useLocale();
  const copy = getInteractiveCopy(locale).analysis;
  const stages = stageIds.map((stage, index) => [stage, copy.stages[index] ?? stage] as const);
  const [analysis, setAnalysis] = useState<AnalysisStatus | undefined>(preview);
  const [error, setError] = useState<string>();
  const [retrying, setRetrying] = useState(false);
  const [pollGeneration, setPollGeneration] = useState(0);

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const token = await anonymousIdToken();
        const response = await fetch(`/api/cases/${caseId}/analysis`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });
        const body = await response.json() as AnalysisStatus & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "ANALYSIS_STATUS_FAILED");
        if (cancelled) return;
        setAnalysis(body);
        setError(undefined);
        if (body.status === "READY") {
          router.replace(localize(`/cases/${caseId}/review`));
          return;
        }
        if (body.status !== "FAILED") timeout = setTimeout(() => void poll(), 1_200);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "ANALYSIS_STATUS_FAILED");
        timeout = setTimeout(() => void poll(), 3_000);
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [caseId, router, pollGeneration, localize, preview]);

  async function retry() {
    setRetrying(true);
    setError(undefined);
    try {
      const token = await anonymousIdToken();
      const response = await fetch(`/api/cases/${caseId}/analysis`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await response.json() as AnalysisStatus & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "ANALYSIS_RETRY_FAILED");
      setAnalysis(body);
      setPollGeneration((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ANALYSIS_RETRY_FAILED");
    } finally {
      setRetrying(false);
    }
  }

  const activeIndex = analysis
    ? Math.max(0, stages.findIndex(([stage]) => stage === analysis.stage))
    : 0;
  const phaseAnnouncement = analysis?.status === "FAILED"
    ? copy.stopped
    : stages[activeIndex]?.[1] ?? copy.stages[0];
  const retentionEndsAt = analysis?.createdAt
    ? new Date(new Date(analysis.createdAt).getTime() + 86_400_000)
    : undefined;
  return <section className="card durable-analysis" aria-busy={analysis?.status !== "FAILED"}>
    <span className="sr-only" role="status" aria-live="polite">{phaseAnnouncement}</span>
    <div className="analysis-visual" aria-hidden="true"><div className="progress-orbit"><span /></div><b>Gemini</b></div>
    <div>
      <div className="eyebrow">{copy.saved}</div>
      <div className="analysis-platform" aria-label={locale === "es" ? "Servicios en ejecución" : locale === "pt" ? "Serviços em execução" : "Services running"}><span>Gemini 3.5 Flash · Vertex AI</span><span>Cloud Tasks · durable job</span></div>
      <h2>{analysis?.status === "FAILED" ? copy.failedTitle : copy.building}</h2>
      <p>{analysis?.status === "FAILED"
        ? copy.failedText
        : locale === "es" ? "Gemini extrae datos citados mientras reglas deterministas validan el contrato." : locale === "pt" ? "O Gemini extrai dados citados enquanto regras determinísticas validam o contrato." : "Gemini extracts cited facts while deterministic rules validate the contract."}</p>
      <ol className="analysis-stage-list">
        {stages.map(([stage, label], index) => <li key={stage} data-state={index < activeIndex || analysis?.stage === "REVIEW_READY" ? "done" : index === activeIndex ? "active" : "pending"}>
          <span>{index < activeIndex || analysis?.stage === "REVIEW_READY" ? "✓" : index + 1}</span><strong>{label}</strong>
        </li>)}
      </ol>
      <p className="analysis-leave-note"><strong>{locale === "es" ? "Podés salir de forma segura." : locale === "pt" ? "Você pode sair com segurança." : "You may leave safely."}</strong> {locale === "es" ? "Cloud Tasks continúa; volvé desde My follow-ups." : locale === "pt" ? "O Cloud Tasks continua; volte por My follow-ups." : "Cloud Tasks continues; return from My follow-ups."}</p>
      {analysis?.attemptCount ? <small>{copy.attempt} {analysis.attemptCount} {copy.of}</small> : null}
      {retentionEndsAt ? <small className="retention-deadline">
        {copy.retentionBefore} {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(retentionEndsAt)}. {copy.retentionAfter}
      </small> : null}
      {analysis?.status === "FAILED" ? <button type="button" disabled={retrying} onClick={() => void retry()}>{retrying ? copy.restarting : copy.retry}</button> : null}
      {error ? <p className="error" role="alert">{copy.refresh}</p> : null}
    </div>
  </section>;
}
