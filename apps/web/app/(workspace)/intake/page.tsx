import { IntakeForm } from "../../../components/intake-form";

export default function IntakePage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 0" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "8px", fontWeight: 600 }}>New Mission</h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "var(--text-base)" }}>What needs to get done?</p>
      </header>

      <IntakeForm />
    </div>
  );
}
