import { AppHeader } from "../components/app-header";
import { getRequestLocale, getRequestMessages } from "../lib/i18n-server";
import { localizePath } from "../lib/i18n";

export default async function Home() {
  const [locale, messages] = await Promise.all([getRequestLocale(), getRequestMessages()]);
  const copy = messages.home;
  return (
    <main className="shell landing-shell">
      <AppHeader />
      <section className="landing-hero">
        <div>
          <div className="eyebrow landing-eyebrow">{copy.eyebrow}</div>
          <h1>{copy.title}</h1>
          <p className="lede">{copy.lede}</p>
          <div className="landing-actions">
            <a className="landing-primary" href={localizePath("/intake", locale)}>{copy.handoff} <span>→</span></a>
            <a className="landing-secondary" href="#how-it-works">{copy.how}</a>
          </div>
          <p className="landing-trust">{copy.trust}</p>
        </div>
        <div className="product-preview" aria-label={copy.example}>
          <div className="preview-top"><span>{copy.example}</span><strong>{copy.refund}</strong></div>
          <div className="preview-company"><span>N</span><div><strong>Northstar Store</strong><p>{copy.order}</p></div></div>
          <div className="preview-promise"><small>{copy.outcome}</small><strong>{copy.receive}</strong></div>
          <ol className="preview-timeline">
            <li data-done="true"><span>✓</span><div><strong>{copy.understood}</strong><p>{copy.extracted}</p></div></li>
            <li data-done="true"><span>✓</span><div><strong>{copy.approved}</strong><p>{copy.approvedDetail}</p></div></li>
            <li data-rejected="true"><span>×</span><div><strong>{copy.rejected}</strong><p>{copy.rejectedDetail}</p></div></li>
            <li data-current="true"><span>✓</span><div><strong>{copy.confirmed}</strong><p>{copy.confirmedDetail}</p></div></li>
          </ol>
          <div className="preview-proof">{copy.proof} <span>{copy.complete}</span></div>
        </div>
      </section>

      <section className="value-contrast">
        <p>{copy.contrast}</p><h2>{copy.contrastTitle}</h2>
      </section>

      <section className="benefit-grid" aria-label={copy.why}>
        <article><span>01</span><h3>{copy.giveTitle}</h3><p>{copy.giveText}</p></article>
        <article><span>02</span><h3>{copy.approveTitle}</h3><p>{copy.approveText}</p></article>
        <article><span>03</span><h3>{copy.attentionTitle}</h3><p>{copy.attentionText}</p></article>
      </section>

      <section className="how-section" id="how-it-works">
        <div><span className="eyebrow">{copy.difference}</span><h2>{copy.notChat}</h2></div>
        <div className="comparison-card">
          <div><small>{copy.reminder}</small><strong>{copy.reminderQuote}</strong><p>{copy.reminderText}</p></div>
          <div data-actionos="true"><small>ACTIONOS</small><strong>{copy.duebackQuote}</strong><p>{copy.duebackText}</p></div>
        </div>
      </section>

      <section className="landing-final">
        <span className="eyebrow">{copy.recipe}</span><h2>{copy.tired}</h2><p>{copy.start}</p>
        <a className="landing-primary" href={localizePath("/intake", locale)}>{copy.live} <span>→</span></a>
      </section>
    </main>
  );
}
