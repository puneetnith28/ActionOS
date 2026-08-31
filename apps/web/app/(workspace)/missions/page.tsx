import { MissionInbox } from "../../../components/mission-inbox";
import { getRequestMessages } from "../../../lib/i18n-server";

export default async function MissionsPage() {
  const copy = (await getRequestMessages()).cases;
  return (
    <main className="shell" style={{ padding: "40px 0" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "8px", fontWeight: 600 }}>{copy.title}</h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "var(--text-base)" }}>{copy.lede}</p>
      </header>
      <MissionInbox />
    </main>
  );
}
