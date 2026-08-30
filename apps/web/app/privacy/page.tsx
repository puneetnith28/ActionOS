import { AppHeader } from "../../components/app-header";
import { getRequestMessages } from "../../lib/i18n-server";

export default async function PrivacyPage() {
  const copy = (await getRequestMessages()).privacy;
  return (
    <main className="shell narrow-shell">
      <AppHeader />
      <section className="hero compact">
        <p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="lede">{copy.lede}</p>
      </section>
      <section className="card boundaries">
        <div><strong>{copy.before}</strong><p>{copy.beforeText}</p></div><div><strong>{copy.activated}</strong><p>{copy.activatedText}</p></div>
        <div><strong>{copy.gemini}</strong><p>{copy.geminiText}</p></div><div><strong>{copy.deletion}</strong><p>{copy.deletionText}</p></div>
        <div><strong>{copy.logs}</strong><p>{copy.logsText}</p></div><div><strong>{copy.limitation}</strong><p>{copy.limitationText}</p></div>
      </section>
    </main>
  );
}
