"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { anonymousIdToken } from "../lib/firebase-client";
import { errorCopy } from "../lib/error-copy";
import { useLocale } from "../lib/use-locale";

export function IntakeForm() {
  const router = useRouter();
  const { localize } = useLocale();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [executionMode, setExecutionMode] = useState<"automatic" | "ask">("ask");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function submit() {
    setBusy(true);
    setError(undefined);
    try {
      const token = await anonymousIdToken();
      const body = new FormData();
      if (text.trim()) body.set("text", text);
      if (file) body.set("file", file);
      // NOTE: executionMode could be sent to backend in real implementation
      
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body
      });
      const result = (await response.json()) as { missionId?: string; status?: string; error?: string };
      if (!response.ok || !result.missionId) throw new Error(result.error ?? "INTAKE_FAILED");
      
      router.push(
        result.status === "READY"
          ? localize(`/missions/${result.missionId}/review`)
          : localize(`/missions/${result.missionId}/analyzing`)
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "INTAKE_FAILED");
      setBusy(false);
    }
  }

  const ready = text.trim().length > 0 || file !== undefined;

  return (
    <div data-testid="intake-form" data-hydrated={hydrated} aria-busy={busy}>
      <div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "24px" }}>
        <textarea
          className="input no-scrollbar"
          value={text}
          disabled={busy}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tell ActionOS what you want accomplished..."
          style={{ minHeight: "180px", border: "none", borderRadius: "0", backgroundColor: "transparent", fontSize: "16px", padding: "24px" }}
        />
        <div className="flex-between" style={{ padding: "12px 24px", borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-elevated)" }}>
          <div style={{ position: "relative" }}>
            <label htmlFor="artifact" style={{ margin: 0, fontSize: "13px", color: "var(--fg-muted)", cursor: "pointer" }}>
              <span className="flex-center gap-2">
                <span>📎</span> {file ? file.name : "Attach a file"}
              </span>
            </label>
            <input
              id="artifact"
              type="file"
              disabled={busy}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>
          {file && (
            <button type="button" onClick={() => setFile(undefined)} className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "12px" }}>
              Remove
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Capabilities Panel */}
        <div className="panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-subtle)", marginBottom: "16px" }}>Capabilities</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <span className="badge badge-default">Email</span>
            <span className="badge badge-default">HTTP</span>
            <span className="badge badge-default">Data</span>
            <span className="badge badge-default">Files</span>
          </div>
          <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--fg-subtle)" }}>
            The agent will automatically select the necessary capabilities based on the mission goal.
          </p>
        </div>

        {/* Execution Mode */}
        <div className="panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-subtle)", marginBottom: "16px" }}>Execution</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", margin: 0 }}>
              <input type="radio" name="exec-mode" checked={executionMode === "automatic"} onChange={() => setExecutionMode("automatic")} style={{ accentColor: "var(--accent)" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", color: "var(--fg-base)" }}>Automatic</span>
                <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>Execute plan immediately</span>
              </div>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", margin: 0 }}>
              <input type="radio" name="exec-mode" checked={executionMode === "ask"} onChange={() => setExecutionMode("ask")} style={{ accentColor: "var(--accent)" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", color: "var(--fg-base)" }}>Ask before sensitive actions</span>
                <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>Require human approval</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {error ? <div className="card" style={{ borderColor: "var(--danger)", backgroundColor: "var(--danger-muted)", color: "var(--danger)", padding: "16px", marginBottom: "24px" }}>{errorCopy(error)}</div> : null}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          style={{ padding: "12px 24px" }}
          type="button"
          disabled={!ready || busy}
          onClick={submit}
        >
          {busy ? (
            <span className="flex-center gap-2"><span className="timeline-icon running" style={{ width: "14px", height: "14px" }}></span> Analyzing Intent...</span>
          ) : (
            <span>Review Mission →</span>
          )}
        </button>
      </div>
    </div>
  );
}
