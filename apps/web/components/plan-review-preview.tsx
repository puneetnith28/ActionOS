"use client";

import { useState } from "react";
import { ApprovalPanel } from "./approval-panel";

export function PlanReviewPreview() {
  const [authorized, setAuthorized] = useState(false);
  return <div className="review-grid">
    <nav className="review-steps" aria-label="Follow-up progress"><div data-complete="true"><span>✓</span><strong>Evidence read</strong></div><div data-current="true"><span>2</span><strong>Review and approve</strong></div><div><span>3</span><strong>DueBack follows through</strong></div></nav>
    <section className="card contract-card">
      <div className="review-readiness" data-ready="true"><span aria-hidden="true">✓</span><div><strong>Ready for your approval</strong><p>Gemini found the critical details. Check them before delegating.</p></div></div>
      <div className="contract-heading"><div><span className="status-dot" /> What success looks like · v1</div></div>
      <h2 className="contract-outcome">Refund USD 59.00 for order ORDER-1842</h2>
      <p className="contract-owner">Responsible party · <strong>Northstar Store</strong></p>
      <dl className="facts"><div><dt>Amount</dt><dd>USD 59.00</dd></div><div><dt>Reference</dt><dd>ORDER-1842</dd></div><div><dt>Due</dt><dd>Aug 21, 2026</dd></div><div><dt>Follow-up</dt><dd>Accelerated after approval</dd></div></dl>
      <div className="proof-callout"><span aria-hidden="true">✓</span><div><strong>What counts as done</strong><p>Signed merchant evidence must match this case, amount, currency, and reference.</p></div></div>
      <details className="contract-editor"><summary>Edit what Gemini understood</summary></details>
    </section>
    <section className="card boundaries">
      <div className="delegate-heading"><span>Your approval</span><h2>Set the exact authority</h2><p>Gemini cannot contact anyone, approve this version, or decide that the case is done.</p></div>
      <ApprovalPanel
        planVersion={1}
        outcome="Refund USD 59.00 for order ORDER-1842"
        company="Northstar Store"
        channel="Accelerated proof demo"
        maximumFollowUps={3}
        proofRequired="Signed merchant evidence matching case, amount, currency, and reference."
        controlled
        legitimateContact={authorized}
        onLegitimateContactChange={setAuthorized}
        actionLabel="Approve and start follow-up"
        busy={false}
        disabled={!authorized}
        blockerReason={authorized ? null : "contact"}
        onApprove={() => undefined}
      />
      <details className="approval-details"><summary>Review channel, exact message and shared data</summary><p>Controlled endpoint · up to 3 approved follow-ups · no bulk outreach.</p></details>
    </section>
  </div>;
}
