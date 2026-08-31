"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ConsumerCaseDetail } from "../lib/mission-projection";
import { anonymousIdToken } from "../lib/firebase-client";
import { errorCopy } from "../lib/error-copy";

export function MissionResult({ missionId }: { readonly missionId: string }) {
  const [detail, setDetail] = useState<ConsumerCaseDetail>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const token = await anonymousIdToken();
        const response = await fetch(`/api/missions/${missionId}/detail`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const body = await response.json() as ConsumerCaseDetail & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "DETAIL_FAILED");
        if (cancelled) return;
        setDetail(body); setError(undefined);
        if (!["DONE", "CANCELLED", "FAILED", "EXPIRED", "NEEDS_ATTENTION"].includes(body.state)) {
          timeout = setTimeout(() => void load(), 2000);
        }
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "DETAIL_FAILED"); }
    };
    void load();
    return () => { cancelled = true; if (timeout) clearTimeout(timeout); };
  }, [missionId]);

  if (error && !detail) {
    return (
      <div className="card" style={{ maxWidth: "600px", margin: "40px auto", borderColor: "var(--danger)" }}>
        <h2 style={{ color: "var(--danger)", marginBottom: "8px" }}>Access Denied</h2>
        <p style={{ color: "var(--fg-muted)" }}>{errorCopy(error)}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ width: "200px", height: "24px", backgroundColor: "var(--bg-surface-elevated)", borderRadius: "var(--radius-sm)", animation: "pulse-border 2s infinite" }} />
        <div style={{ width: "100%", height: "400px", backgroundColor: "var(--bg-surface-elevated)", borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  const isRunning = !["DONE", "CANCELLED", "FAILED", "EXPIRED", "NEEDS_ATTENTION"].includes(detail.state);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <header style={{ paddingBottom: "24px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Link href="/missions" className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "14px", marginLeft: "-8px" }}>← Missions</Link>
            <span style={{ color: "var(--border-subtle)" }}>/</span>
            <h1 style={{ fontSize: "var(--text-xl)", margin: 0 }}>{detail.outcome?.accepted ? "Prepare Weekly Report" : "Active Mission"}</h1>
          </div>
          <p style={{ color: "var(--fg-muted)", fontSize: "var(--text-sm)" }}>Mission ID: <span className="text-mono">{missionId}</span></p>
        </div>
        <div>
          <span className={`badge ${isRunning ? 'badge-accent' : detail.state === 'DONE' ? 'badge-success' : 'badge-warning'}`}>
            {isRunning ? '● RUNNING' : detail.state}
          </span>
        </div>
      </header>

      {/* Split Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "32px", alignItems: "start" }}>
        
        {/* Left Column: Execution Timeline (Commits 74 & 75) */}
        <div>
          <h2 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)", marginBottom: "24px" }}>EXECUTION TIMELINE</h2>
          <div className="panel" style={{ padding: "32px" }}>
            <div className="timeline">
              {detail.timeline.length > 0 ? (
                detail.timeline.map((event, index) => {
                  const isLast = index === detail.timeline.length - 1;
                  const isExecuting = isRunning && isLast;
                  return (
                    <div className="timeline-item" key={event.id}>
                      <div className={`timeline-icon ${isExecuting ? 'running' : 'success'}`}>
                        {isExecuting ? '●' : '✓'}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-title">{event.transition.replaceAll("_", " ")}</span>
                          {event.occurredAt && (
                            <span className="timeline-time">
                              {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(event.occurredAt))}
                            </span>
                          )}
                        </div>
                        <div className="timeline-body">
                          {event.reason || "System state transition."}
                        </div>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="timeline-metadata">
                            {JSON.stringify(event.metadata, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="timeline-item">
                  <div className="timeline-icon running">●</div>
                  <div className="timeline-content">
                    <div className="timeline-header"><span className="timeline-title">Initializing Agent</span></div>
                    <div className="timeline-body">Connecting to runtime environment...</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <h2 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)", margin: "32px 0 24px" }}>CAPABILITY LOGS</h2>
          <div className="panel" style={{ padding: "0" }}>
            {detail.conversation.length > 0 ? (
              detail.conversation.map((entry, idx) => (
                <div key={entry.id} style={{ padding: "16px 24px", borderBottom: idx < detail.conversation.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div className="flex-between" style={{ marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--fg-base)" }}>{entry.title}</span>
                    <span className="text-mono" style={{ fontSize: "11px", color: "var(--fg-subtle)" }}>
                      {entry.occurredAt ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(entry.occurredAt)) : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--fg-muted)", marginBottom: "8px" }}>{entry.safeBody}</p>
                  <div style={{ display: "inline-flex", gap: "8px", alignItems: "center", backgroundColor: "var(--bg-base)", padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: "11px", border: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: entry.status === "COMPLETED" ? "var(--success)" : "var(--fg-subtle)" }}>{entry.status}</span>
                    {entry.reason && <span style={{ color: "var(--fg-muted)" }}>— {entry.reason}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--fg-subtle)", fontSize: "13px" }}>
                No capability logs generated yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mission Metadata */}
        <div>
          <h2 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-subtle)", marginBottom: "24px" }}>MISSION DETAILS</h2>
          <div className="panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--fg-subtle)", textTransform: "uppercase", marginBottom: "8px" }}>Goal</div>
              <div style={{ fontSize: "14px", color: "var(--fg-base)", lineHeight: 1.6 }}>
                {detail.promise || "No explicit goal provided."}
              </div>
            </div>
            
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
              <div style={{ fontSize: "11px", color: "var(--fg-subtle)", textTransform: "uppercase", marginBottom: "8px" }}>Status</div>
              <div style={{ fontSize: "14px", color: "var(--fg-base)" }}>
                {detail.state.replaceAll("_", " ")}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--fg-subtle)", textTransform: "uppercase", marginBottom: "4px" }}>Created</div>
                <div className="text-mono" style={{ fontSize: "13px", color: "var(--fg-muted)" }}>
                  {detail.timeline[0]?.occurredAt 
                    ? new Intl.DateTimeFormat('en-US', { timeStyle: "medium" }).format(new Date(detail.timeline[0].occurredAt))
                    : "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--fg-subtle)", textTransform: "uppercase", marginBottom: "4px" }}>Identity</div>
                <div className="text-mono" style={{ fontSize: "13px", color: "var(--fg-muted)", wordBreak: "break-all" }}>
                  {detail.channel.contact}
                </div>
              </div>
            </div>
          </div>
          
          {detail.outcome.accepted === false && (
            <div className="card" style={{ marginTop: "24px", borderColor: "var(--danger)", backgroundColor: "var(--danger-muted)" }}>
              <h3 style={{ fontSize: "13px", color: "var(--danger)", marginBottom: "8px" }}>Intervention Required</h3>
              <p style={{ fontSize: "13px", color: "var(--fg-muted)", marginBottom: "16px" }}>The agent encountered an exception and requires human intervention to proceed.</p>
              <Link href={`/missions/${missionId}/exception`} className="btn btn-secondary" style={{ width: "100%" }}>Resolve Exception</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
