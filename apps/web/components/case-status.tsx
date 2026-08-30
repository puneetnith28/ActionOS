import type { ConsumerCaseDetail } from "../lib/case-projection";

export function CaseStatus({ detail }: { readonly detail: ConsumerCaseDetail }) {
  const futureNextCheck = detail.nextCheckAt && Date.parse(detail.nextCheckAt) > Date.now()
    ? detail.nextCheckAt
    : undefined;
  return <section className="card case-status" aria-labelledby="case-status-title">
    <div className="case-status-top"><span className={`status-pill state-${detail.state.toLowerCase()}`}>{detail.statusLabel}</span><span>{detail.channel.label}</span></div>
    <p className="eyebrow">Following through with {detail.counterpartyName}</p>
    <h1 id="case-status-title">{detail.goal}</h1>
    <div className="next-action" role="status"><strong>What happens next</strong><p>{detail.nextAction}</p></div>
    <dl className="facts compact-facts">
      <div><dt>Last activity</dt><dd>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(detail.updatedAt))}</dd></div>
      {futureNextCheck && ["READY", "WAITING_EXTERNAL", "WAITING_RETRY"].includes(detail.state) ? <div><dt>Next follow-up</dt><dd>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(futureNextCheck))}</dd></div> : null}
      <div><dt>Return path</dt><dd>{detail.returnPath}</dd></div>
    </dl>
  </section>;
}
