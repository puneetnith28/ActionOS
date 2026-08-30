import { IntakeForm } from "../../components/intake-form";
import { AppHeader } from "../../components/app-header";
import { getRequestMessages } from "../../lib/i18n-server";

export default async function IntakePage() {
  const copy = (await getRequestMessages()).intake;
  return (
    <main className="shell">
      <AppHeader />
      <div className="intake-layout">
        <section className="hero">
          <div className="eyebrow">{copy.eyebrow}</div><h1>{copy.title}</h1><p className="lede">{copy.lede}</p>
          <p className="trust-line">{copy.trust} <span>•</span> {copy.rules}</p>
          <div className="use-mission-row" aria-label={copy.useCases}>
            <span data-live="true">{copy.followup}</span><span>{copy.appointments}</span><span>{copy.documents}</span>
          </div>
          <details className="after-boundary.intake-process">
            <summary>{copy.after}</summary>
            <ol>
              <li><span>1</span><p><b>{copy.contactTitle}</b> {copy.contactText}</p></li>
              <li><span>2</span><p><b>{copy.openTitle}</b> {copy.openText}</p></li>
              <li><span>3</span><p><b>{copy.returnTitle}</b> {copy.returnText}</p></li>
            </ol>
            <p className="channel-disclosure"><b>{copy.demoTitle}</b> {copy.demoText}</p>
          </details>
        </section>
        <IntakeForm />
      </div>
    </main>
  );
}
