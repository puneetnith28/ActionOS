import { AppHeader } from "../../components/app-header";
import { getRequestMessages } from "../../lib/i18n-server";
import { firestore } from "../../lib/firebase-admin";
import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { FirestoreTelemetryStore } from "@actionos/persistence/telemetry-store";
import "./status.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SystemStatusPage() {
  const copy = await getRequestMessages();
  const runtimeStore = new FirestoreRuntimeStore(firestore);
  const telemetryStore = new FirestoreTelemetryStore(firestore);

  const [activeMissions, telemetry] = await Promise.all([
    runtimeStore.listActiveMissions(10),
    telemetryStore.listAllTelemetry(50)
  ]);

  const modelCalls = telemetry.filter((t) => t.kind === "MODEL_CALL" && t.model);
  const recentErrors = telemetry.filter((t) => t.error || (t.capability && t.capability.status === "FAILED"));

  const avgLatency = modelCalls.length > 0 
    ? Math.round(modelCalls.reduce((acc, curr) => acc + (curr.model?.latencyMs ?? 0), 0) / modelCalls.length)
    : 0;

  return (
    <main className="shell">
      <AppHeader />
      <section className="hero compact">
        <div className="eyebrow">Platform Health</div>
        <h1>{copy.header.systemStatus ?? "System Status"}</h1>
        <p className="lede">Monitor ActionOS background workers, metrics, and API health.</p>
      </section>
      
      <div className="status-grid">
        <div className="status-card">
          <h3>Active Missions</h3>
          <div className="status-metric">{activeMissions.length}</div>
          <p className="status-caption">Currently running or waiting</p>
        </div>
        <div className="status-card">
          <h3>Model Latency</h3>
          <div className="status-metric">{avgLatency} ms</div>
          <p className="status-caption">Average over recent inference calls</p>
        </div>
        <div className="status-card">
          <h3>Recent Errors</h3>
          <div className="status-metric">{recentErrors.length}</div>
          <p className="status-caption">Errors in recent telemetry</p>
        </div>
      </div>

      <div className="telemetry-feed">
        <h2>Live Telemetry Stream</h2>
        <table className="telemetry-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Mission ID</th>
              <th>Event</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {telemetry.map((t) => (
              <tr key={`${t.missionId}-${t.correlationId}-${t.occurredAt}-${t.kind}`} className={t.error ? "row-error" : ""}>
                <td>{new Date(t.occurredAt).toLocaleTimeString()}</td>
                <td className="mono">{t.missionId}</td>
                <td>{t.kind.replace("_", " ")}</td>
                <td>
                  {t.model ? `Model: ${t.model.modelId} (${t.model.latencyMs}ms)` : ""}
                  {t.capability ? `Cap: ${t.capability.capabilityId} (${t.capability.status})` : ""}
                  {t.lifecycle ? `State: ${t.lifecycle.fromState} → ${t.lifecycle.toState}` : ""}
                  {t.error ? <span className="error-text"> Error: {t.error}</span> : ""}
                </td>
              </tr>
            ))}
            {telemetry.length === 0 && (
              <tr><td colSpan={4}>No telemetry data found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
