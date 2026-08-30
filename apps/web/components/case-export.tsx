"use client";

import { useState } from "react";
import { anonymousIdToken } from "../lib/firebase-client";

export function CaseExport({ missionId }: { readonly missionId: string }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>();
  const load = async () => {
    const token = await anonymousIdToken();
    const response = await fetch(`/api/cases/${missionId}/export`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
    });
    if (!response.ok) throw new Error("CASE_EXPORT_FAILED");
    return response.text();
  };
  const run = (action: (text: string) => Promise<void> | void, done: string) => {
    setBusy(true); setStatus(undefined);
    void load().then(action).then(() => { setStatus(done); })
      .catch(() => { setStatus("ActionOS could not create the redacted summary."); })
      .finally(() => { setBusy(false); });
  };
  return <section className="card case-export">
    <h2>Keep a safe summary</h2>
    <p>Copy or download a static redacted record. It contains no link or mission-control authority.</p>
    <div className="button-row">
      <button type="button" className="secondary" disabled={busy} onClick={() => {
        run((text) => navigator.clipboard.writeText(text), "Summary copied.");
      }}>Copy summary</button>
      <button type="button" className="secondary" disabled={busy} onClick={() => {
        run((text) => {
          const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
          const anchor = document.createElement("a");
          anchor.href = url; anchor.download = "actionos-case-summary.txt"; anchor.click();
          URL.revokeObjectURL(url);
        }, "Summary downloaded.");
      }}>Download summary</button>
    </div>
    {status ? <p role="status">{status}</p> : null}
  </section>;
}
