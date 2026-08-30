"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { anonymousIdToken } from "../lib/firebase-client";
import { errorCopy } from "../lib/error-copy";
import { examplePromises } from "../lib/example-promises";
import { getInteractiveCopy } from "../lib/interactive-copy";
import { useLocale } from "../lib/use-locale";

export function IntakeForm() {
  const router = useRouter();
  const { locale, localize } = useLocale();
  const copy = getInteractiveCopy(locale).intake;
  const [text, setText] = useState("");
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string>();
  const [hydrated, setHydrated] = useState(false);
  const [deletionConfirmed, setDeletionConfirmed] = useState(false);
  const examples = examplePromises();

  useEffect(() => {
    setHydrated(true);
    setDeletionConfirmed(new URLSearchParams(window.location.search).get("deleted") === "1");
  }, []);

  useEffect(() => {
    if (!busy) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [busy]);

  async function submit() {
    setBusy(true);
    setError(undefined);
    try {
      const token = await anonymousIdToken();
      const body = new FormData();
      if (text.trim()) body.set("text", text);
      if (file) body.set("file", file);
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body
      });
      const result = (await response.json()) as { caseId?: string; status?: string; error?: string };
      if (!response.ok || !result.caseId) throw new Error(result.error ?? "INTAKE_FAILED");
      router.push(
        result.status === "READY"
          ? localize(`/cases/${result.caseId}/review`)
          : localize(`/cases/${result.caseId}/analyzing`)
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "INTAKE_FAILED");
      setBusy(false);
    }
  }

  const ready = text.trim().length > 0 || file !== undefined;
  return (
    <div className="card intake-composer-card" data-testid="intake-form" data-hydrated={hydrated} aria-busy={busy}>
      {deletionConfirmed ? <p className="success" role="status">{copy.deleted}</p> : null}
      <div className="form-heading">
        <span>{copy.recipe}</span><strong>{copy.title}</strong>
      </div>
      <p className="recipe-scope">
        {copy.scope}
      </p>
      <div className="smart-composer">
        <label className="composer-label" htmlFor="promise">{copy.prompt}</label>
        <textarea
          id="promise"
          value={text}
          disabled={busy}
          onChange={(event) => {
            setText(event.target.value);
          }}
          placeholder={copy.placeholder}
          maxLength={50_000}
        />
        <div className="composer-footer">
          <div className="composer-attachment">
            <label htmlFor="artifact">{file ? file.name : copy.addFile}</label>
            <input
              id="artifact"
              type="file"
              disabled={busy}
              accept="application/pdf,image/jpeg,image/png"
              onChange={(event) => {
                setFile(event.target.files?.[0]);
              }}
            />
          </div>
          <button
            className="composer-submit"
            type="button"
            disabled={!ready || busy}
            onClick={() => void submit()}
          >
            {busy ? copy.working : copy.build}
          </button>
        </div>
      </div>
      <p className="button-help intake-ai-note">
        {copy.ai} <a href={localize("/privacy")}>{copy.data}</a>.
      </p>
      {file ? (
        <div className="attachment-status"><span>{(file.size / 1024 / 1024).toFixed(1)} MB · {copy.ready}</span><button className="remove-file" type="button" disabled={busy} onClick={() => { setFile(undefined); }}>{copy.remove}</button></div>
      ) : null}
      {text.trim() && file ? <p className="combined-source">{copy.combined}</p> : null}
      <div className="example-picker">
        <span>{copy.common}</span>
        <div>
          {examples.map((example) => (
            <button key={example.label} type="button" disabled={busy} onClick={() => { setText(example.text); setError(undefined); }}>
              {example.label}<span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>
      <details className="mobile-after">
        <summary>{copy.after}</summary>
        <ol>
          <li>{copy.after1}</li><li>{copy.after2}</li><li>{copy.after3}</li>
        </ol>
        <p>{copy.adapter}</p>
      </details>
      {busy ? (
        <div className="analysis-progress">
          <div className="progress-orbit" aria-hidden="true"><span /></div>
          <div>
            <strong>{copy.reading}</strong>
            <p>
              {elapsedSeconds < 15
                ? copy.extracting
                : elapsedSeconds < 30
                  ? copy.complex
                  : copy.slow}
            </p>
            <small aria-hidden="true">{elapsedSeconds}s {copy.elapsed}</small>
          </div>
        </div>
      ) : null}
      <p className="privacy">
        {copy.privacy} <a href={localize("/privacy")}>{copy.privacyLink}</a>.
      </p>
      <p className="sr-status" role="status" aria-live="polite">
        {busy
          ? elapsedSeconds < 15
            ? copy.srInitial
            : elapsedSeconds < 30
              ? copy.srComplex
              : copy.srSlow
          : ""}
      </p>
      {error ? (
        <p className="error" role="alert">
          {errorCopy(error)}
        </p>
      ) : null}
    </div>
  );
}
