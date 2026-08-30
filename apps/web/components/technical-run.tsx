"use client";

import { useState } from "react";
import type { TechnicalStep } from "@actionos/contracts";
import { anonymousIdToken } from "../lib/firebase-client";

export function TechnicalRun({ missionId }: { readonly missionId: string }) {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<TechnicalStep[]>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const load = () => {
    setBusy(true);
    setError(undefined);
    void anonymousIdToken()
      .then((token) =>
        fetch(`/api/missions/${missionId}/technical-run`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        })
      )
      .then(async (response) => {
        const result = (await response.json()) as { steps?: TechnicalStep[] };
        if (!response.ok || !result.steps) throw new Error("TECHNICAL_RUN_FAILED");
        setSteps(result.steps);
        setOpen(true);
      })
      .catch(() => {
        setError("Telemetry trace data is unavailable for this mission.");
      })
      .finally(() => {
        setBusy(false);
      });
  };
  return (
    <section className="card technical-run">
      <h2>Execution Telemetry</h2>
      <p>Inspect raw execution telemetry. Missing spans remain unrecorded.</p>
      <button
        type="button"
        className="secondary"
        disabled={busy}
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          if (steps) {
            setOpen(true);
            return;
          }
          load();
        }}
      >
        {busy ? "Fetching trace telemetry…" : open ? "Hide telemetry trace" : "Show telemetry trace"}
      </button>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {open && steps ? (
        <ol className="technical-steps">
          {steps.map((step) => (
            <li key={step.stepId}>
              <strong>
                {step.stage} · {step.status}
              </strong>
              <span>{step.systemLabel}</span>
              {step.occurredAt ? (
                <small>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "medium"
                  }).format(new Date(step.occurredAt))}
                </small>
              ) : null}
              {step.correlationSuffix ? (
                <small>
                  Trace suffix · <code>…{step.correlationSuffix}</code>
                </small>
              ) : null}
              {step.reasonCodes.length > 0 ? <code>{step.reasonCodes.join(" · ")}</code> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
