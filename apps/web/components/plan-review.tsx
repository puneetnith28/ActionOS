"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DraftMission } from "@actionos/runtime/intake-service";
import type { PlanSimulation } from "@actionos/runtime/plan-service";
import type { ChannelCapability } from "@actionos/contracts";
import { anonymousIdToken } from "../lib/firebase-client";
import { errorCopy } from "../lib/error-copy";
import { RecoverableIdentity } from "./recoverable-identity";
import { getReviewCopy } from "../lib/review-copy";
import { useLocale } from "../lib/use-locale";
import { ApprovalPanel } from "./boundary.panel";

type PlanResponse = DraftMission & { error?: string };

export function PlanReview({
  missionId,
  contactMode
}: {
  readonly missionId: string;
  readonly contactMode: "sandbox" | "email";
}) {
  const { locale, localize } = useLocale();
  const copy = getReviewCopy(locale);
  const tr = (english: string, spanish: string, portuguese: string) =>
    locale === "es" ? spanish : locale === "pt" ? portuguese : english;
  const [draft, setDraft] = useState<DraftCase>();
  const [simulation, setSimulation] = useState<PlanSimulation>();
  const [amount, setAmount] = useState("");
  const [company, setCompany] = useState("");
  const [result, setResult] = useState("");
  const [currency, setCurrency] = useState("");
  const [reference, setReference] = useState("");
  const [promisedDueAt, setPromisedDueAt] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [recipient, setRecipient] = useState("");
  const [notificationRecipient, setNotificationRecipient] = useState("");
  const [legitimateContact, setLegitimateContact] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState("");
  const [recoverable, setRecoverable] = useState(false);
  const [verifiedOwnerEmail, setVerifiedOwnerEmail] = useState<string>();
  const [capabilities, setCapabilities] = useState<ChannelCapability[]>([]);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const identityChange = useCallback((value: boolean, email?: string) => {
    setRecoverable(value);
    setVerifiedOwnerEmail(email);
    if (email) setNotificationRecipient(email);
  }, []);

  async function api(method: "GET" | "POST", body?: object): Promise<PlanResponse> {
    const token = await anonymousIdToken();
    const response = await fetch(`/api/cases/${missionId}/plan`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const result = (await response.json()) as PlanResponse;
    if (!response.ok) throw new Error(result.error ?? "PLAN_REQUEST_FAILED");
    return result;
  }

  useEffect(() => {
    void api("GET")
      .then(setDraft)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "PLAN_REQUEST_FAILED");
      });
  }, [missionId]);

  useEffect(() => {
    void fetch("/api/channels", { cache: "no-store" })
      .then(async (response) => response.ok ? await response.json() as ChannelCapability[] : [])
      .then(setCapabilities);
  }, []);

  useEffect(() => {
    if (!draft) return;
    const localDateTime = (value: string | undefined) => {
      if (!value) return "";
      const date = new Date(value);
      const offset = date.getTimezoneOffset() * 60_000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };
    setCompany(draft.promiseDraft.promisor.value);
    setResult(draft.promiseDraft.result.value);
    setAmount(draft.promiseDraft.amountMinor
      ? (draft.promiseDraft.amountMinor.value / 100).toFixed(2)
      : "");
    setCurrency(draft.promiseDraft.currency?.value ?? "");
    setReference(draft.promiseDraft.transactionRef.value);
    setPromisedDueAt(localDateTime(draft.promiseDraft.dueAt?.value));
    setFollowUpAt(localDateTime(draft.plan.followUpAt ?? draft.promiseDraft.dueAt?.value));
    setRecipient(draft.plan.allowedRecipient);
    setNotificationRecipient(draft.plan.notificationRecipient ?? "");
  }, [draft?.plan.version]);

  async function command(body: object) {
    setBusy(true);
    setError(undefined);
    try {
      const next = await api("POST", body);
      setDraft(next);
      if ("action" in body && body.action === "revise") {
        setStatus(
          `Plan updated to version ${String(next.plan.version)}. Review the remaining highlighted fields.`
        );
        window.setTimeout(() => statusRef.current?.focus(), 0);
      }
      if ("action" in body && body.action === "select-channel") {
        setStatus(`Contact channel changed. Plan updated to version ${String(next.plan.version)}; review the new sender, recipient, and return path.`);
        window.setTimeout(() => statusRef.current?.focus(), 0);
      }
      if ("action" in body && body.action === "approve" && next.state === "READY") {
        window.location.assign(localize(`/cases/${missionId}/result`));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PLAN_REQUEST_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function deleteDraft() {
    setBusy(true);
    setError(undefined);
    try {
      const token = await anonymousIdToken();
      const response = await fetch(`/api/cases/${missionId}/plan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" })
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "DRAFT_DELETE_FAILED");
      }
      window.location.assign(localize("/intake"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "DRAFT_DELETE_FAILED");
      setBusy(false);
    }
  }

  async function simulate() {
    setBusy(true);
    setError(undefined);
    setStatus(tr("Building a safe preview. Nothing is being sent.", "Creando una vista previa segura. No se está enviando nada.", "Criando uma visualização segura. Nada está sendo enviado."));
    try {
      const token = await anonymousIdToken();
      const response = await fetch(`/api/cases/${missionId}/plan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate" })
      });
      const body = (await response.json()) as PlanSimulation & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "PLAN_REQUEST_FAILED");
      setSimulation(body);
      setStatus(tr("Preview ready. Nothing was sent.", "Vista previa lista. No se envió nada.", "Visualização pronta. Nada foi enviado."));
      window.setTimeout(() => statusRef.current?.focus(), 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PLAN_REQUEST_FAILED");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  if (error && !draft)
    return (
      <div className="card error" role="alert">
        {errorCopy(error)}{" "}
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
        >
          Retry
        </button>
      </div>
    );
  if (!draft) return <div className="card">{tr("Building the cited Outcome Contract…", "Creando el Contrato de Resultado con citas…", "Criando o Contrato de Resultado com citações…")}</div>;
  const outcome = draft.outcomeContract;
  const dateTime = (value: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value)
    );
  const fieldLabels: Record<string, string> = {
    promisor: tr("company name", "nombre de la empresa", "nome da empresa"),
    result: tr("promised result", "resultado prometido", "resultado prometido"),
    amountMinor: tr("amount", "monto", "valor"),
    currency: tr("currency", "moneda", "moeda"),
    transactionRef: tr("order or mission reference", "referencia del pedido o caso", "referência do pedido ou caso"),
    dueAt: tr("company deadline", "fecha límite de la empresa", "prazo da empresa"),
    followUpAt: tr("follow-up date", "fecha de seguimiento", "data de acompanhamento"),
    allowedRecipient: tr("company support email", "correo de soporte de la empresa", "e-mail de suporte da empresa")
  };
  const uncertainty = (field: { uncertainty: string; provenance: readonly { locator: string; excerpt?: string | undefined; confidence: string }[] } | undefined) =>
    field && field.uncertainty !== "NONE" ? (
      <div className="field-warning" role="note">
        <strong>{field.uncertainty === "CONTRADICTORY" ? tr("Conflicting information", "Información contradictoria", "Informações contraditórias") : tr("Needs confirmation", "Necesita confirmación", "Precisa de confirmação")}</strong>
        <span>{tr("Choose using the exact source evidence below.", "Elegí usando la evidencia exacta de la fuente.", "Escolha usando a evidência exata da fonte.")}</span>
        {field.provenance.some((item) => item.excerpt) ? (
          <ul className="source-excerpts">
            {field.provenance.filter((item) => item.excerpt).map((item) => (
              <li key={`${item.locator}:${item.excerpt ?? ""}`}>“{item.excerpt}”</li>
            ))}
          </ul>
        ) : (
          <span>{tr("Open the original promise and confirm this value before continuing.", "Abrí la promesa original y confirmá este valor antes de continuar.", "Abra a promessa original e confirme este valor antes de continuar.")}</span>
        )}
      </div>
    ) : null;
  const saveRevision = (revision: Record<string, unknown>) =>
    command({ action: "revise", expectedPlanVersion: draft.plan.version, revision });
  const parsedAmount = Number(amount);
  const monetaryPromise = Boolean(draft.promiseDraft.amountMinor && draft.promiseDraft.currency);
  const contractEditValid = Boolean(
    company.trim() && result.trim() && reference.trim() && (followUpAt || promisedDueAt) &&
    (!monetaryPromise || amount) &&
    (!amount || (Number.isFinite(parsedAmount) && parsedAmount >= 0 && /^[A-Z]{3}$/.test(currency)))
  );
  const saveContract = () => void saveRevision({
    promisor: company.trim(),
    result: result.trim(),
    amountMinor: amount ? Math.round(parsedAmount * 100) : null,
    currency: amount ? currency : null,
    transactionRef: reference.trim(),
    dueAt: promisedDueAt ? new Date(promisedDueAt).toISOString() : null,
    followUpAt: new Date(followUpAt || promisedDueAt).toISOString()
  });
  const referenceValue = draft.promiseDraft.transactionRef.value;
  const amountValue = draft.promiseDraft.amountMinor && draft.promiseDraft.currency
    ? `${draft.promiseDraft.currency.value} ${(draft.promiseDraft.amountMinor.value / 100).toFixed(2)}`
    : tr("No monetary amount in this promise", "Esta promesa no tiene un monto", "Esta promessa não possui valor monetário");
  const followUpSubject = draft.plan.messageSubject ?? `Follow-up for ${referenceValue}`;
  const followUpBody = draft.plan.messageBody;
  const activeChannelType = draft.plan.channelType ??
    (contactMode === "email" ? "MANAGED_EMAIL" : "CONTROLLED_SANDBOX");
  const activeCapability = capabilities.find((item) => item.channelType === activeChannelType);
  const boundary.locker: "facts" | "channel" | "contact" | "identity" | null = draft.activationBlocked ? "facts" : activeCapability?.status !== "AVAILABLE" ? "channel" : !legitimateContact ? "contact" : activeChannelType === "MANAGED_EMAIL" && !recoverable ? "identity" : null;
  const chooseChannel = (channelType: "CONTROLLED_SANDBOX" | "MANAGED_EMAIL") => {
    if (channelType === activeChannelType) return;
    void command({
      action: "select-channel",
      expectedPlanVersion: draft.plan.version,
      revision: { channelType }
    });
  };

  return (
    <div className="review-grid">
      <nav className="review-steps" aria-label={copy.progress}>
        <div data-complete="true"><span>✓</span><strong>{copy.read}</strong></div>
        <div data-current="true"><span>2</span><strong>{copy.review}</strong></div>
        <div><span>3</span><strong>{copy.follows}</strong></div>
      </nav>
      <section className="card contract-card">
        <div className="review-readiness" data-ready={!draft.activationBlocked}>
          <span aria-hidden="true">{draft.activationBlocked ? "!" : "✓"}</span>
          <div>
            <strong>{draft.activationBlocked ? `${String(draft.blockingFields.length)} ${tr("details need you", "datos necesitan tu confirmación", "dados precisam da sua confirmação")}` : tr("Ready for your boundary., "Listo para tu aprobación", "Pronto para sua aprovação")}</strong>
            <p>{draft.activationBlocked ? tr("Confirm the highlighted information below.", "Confirmá la información resaltada.", "Confirme as informações destacadas.") : tr("Gemini found the critical details. Check them before delegating.", "Gemini encontró los datos críticos. Revisalos antes de delegar.", "O Gemini encontrou os dados críticos. Revise-os antes de delegar.")}</p>
          </div>
        </div>
        <div className="contract-heading">
          <div>
            <span className="status-dot" /> Outcome Contract · v{draft.plan.version}
          </div>
        </div>
        <h2 className="contract-outcome">{outcome?.outcome ?? draft.plan.goal}</h2>
        <p className="contract-owner">{tr("Responsible party", "Parte responsable", "Parte responsável")} · <strong>{outcome?.responsibleParty ?? draft.promiseDraft.promisor.value}</strong></p>
        <dl className="facts">
          <div>
            <dt>{tr("Amount", "Monto", "Valor")}</dt>
            <dd>
              {draft.promiseDraft.amountMinor && draft.promiseDraft.currency
                ? `${draft.promiseDraft.currency.value} ${(draft.promiseDraft.amountMinor.value / 100).toFixed(2)}`
                : tr("Not applicable", "No corresponde", "Não se aplica")}
              {uncertainty(draft.promiseDraft.amountMinor)}
            </dd>
          </div>
          <div>
            <dt>{tr("Reference", "Referencia", "Referência")}</dt>
            <dd>{draft.promiseDraft.transactionRef.value}{uncertainty(draft.promiseDraft.transactionRef)}</dd>
          </div>
          <div>
            <dt>{tr("Due", "Vencimiento", "Prazo")}</dt>
            <dd>
              {draft.promiseDraft.dueAt?.value
                ? dateTime(draft.promiseDraft.dueAt.value)
                : draft.promiseDraft.dueCondition?.value ?? tr("No company deadline found", "No se encontró una fecha límite", "Nenhum prazo da empresa encontrado")}
              {uncertainty(draft.promiseDraft.dueAt ?? draft.promiseDraft.dueCondition)}
            </dd>
          </div>
          <div>
            <dt>{tr("Follow-up", "Seguimiento", "Acompanhamento")}</dt>
            <dd>
              {draft.plan.executionMode === "ACCELERATED_DEMO"
                ? tr("Accelerated after boundary., "Acelerado después de aprobar", "Acelerado após a aprovação")
                : draft.plan.followUpAt
                  ? dateTime(draft.plan.followUpAt)
                : tr("Choose when ActionOS should follow up", "Elegí cuándo debe hacer el seguimiento", "Escolha quando o ActionOS deve acompanhar")}
            </dd>
          </div>
        </dl>
        {uncertainty(draft.promiseDraft.promisor)}
        {uncertainty(draft.promiseDraft.result)}
        <div className="proof-callout">
          <span aria-hidden="true">✓</span>
          <div><strong>{tr("What counts as done", "Qué cuenta como terminado", "O que conta como concluído")}</strong><p>{outcome?.proofRequired ?? tr("The merchant confirms the promised refund in signed evidence.", "El comercio confirma el reembolso prometido mediante evidencia firmada.", "O comerciante confirma o reembolso prometido com evidência assinada.")}</p></div>
        </div>
        <details className="technical-details">
          <summary>{tr("Technical contract details", "Detalles técnicos del contrato", "Detalhes técnicos do contrato")}</summary>
          <code>Plan v{draft.plan.version} · {draft.plan.planHash}</code>
        </details>
        {draft.blockingFields.length > 0 ? (
          <p className="warning">{tr("Before activation, confirm", "Antes de activar, confirmá", "Antes de ativar, confirme")}: {draft.blockingFields.map((field) => fieldLabels[field] ?? field).join(", ")}.</p>
        ) : null}
        <details className="contract-editor" open={draft.activationBlocked}>
          <summary>{draft.activationBlocked ? tr("Fix the details Gemini could not confirm", "Corregí los datos que Gemini no pudo confirmar", "Corrija os dados que o Gemini não conseguiu confirmar") : tr("Edit what Gemini understood", "Editá lo que Gemini entendió", "Edite o que o Gemini entendeu")}</summary>
          <p>{tr("Correct any detail before delegating. Saving creates a new version and invalidates the previous boundary.hash.", "Corregí cualquier dato antes de delegar. Guardar crea una versión nueva e invalida la aprobación anterior.", "Corrija qualquer dado antes de delegar. Salvar cria uma nova versão e invalida a aprovação anterior.")}</p>
          <div className="contract-editor-grid">
            <label>{tr("Company", "Empresa", "Empresa")}<input aria-label={fieldLabels.promisor} value={company} onChange={(event) => { setCompany(event.target.value); }} /></label>
            <label>{fieldLabels.result}<input aria-label={fieldLabels.result} value={result} onChange={(event) => { setResult(event.target.value); }} /></label>
            <label>{fieldLabels.amountMinor}<input aria-label={fieldLabels.amountMinor} inputMode="decimal" placeholder={monetaryPromise ? tr("Required", "Obligatorio", "Obrigatório") : tr("Not applicable", "No corresponde", "Não se aplica")} value={amount} onChange={(event) => { setAmount(event.target.value); }} /></label>
            <label>{fieldLabels.currency}<input aria-label={fieldLabels.currency} value={currency} maxLength={3} placeholder={monetaryPromise ? tr("Required", "Obligatorio", "Obrigatório") : tr("Not applicable", "No corresponde", "Não se aplica")} onChange={(event) => { setCurrency(event.target.value.toUpperCase()); }} /></label>
            <label>{fieldLabels.transactionRef}<input aria-label={fieldLabels.transactionRef} value={reference} onChange={(event) => { setReference(event.target.value); }} /></label>
            <label>{fieldLabels.dueAt}<input aria-label={fieldLabels.dueAt} type="datetime-local" value={promisedDueAt} onChange={(event) => { setPromisedDueAt(event.target.value); }} /></label>
            <label>{fieldLabels.followUpAt}<input aria-label={fieldLabels.followUpAt} type="datetime-local" value={followUpAt} onChange={(event) => { setFollowUpAt(event.target.value); }} /></label>
          </div>
          <button className="secondary save-contract" type="button" disabled={busy || !contractEditValid} onClick={saveContract}>{tr("Save corrected contract", "Guardar contrato corregido", "Salvar contrato corrigido")}</button>
          {!contractEditValid ? <p className="button-help">{tr("Company, result, reference, and follow-up date are required. Refunds also require an amount and three-letter currency.", "Empresa, resultado, referencia y fecha de seguimiento son obligatorios. Los reembolsos también requieren monto y moneda de tres letras.", "Empresa, resultado, referência e data de acompanhamento são obrigatórios. Reembolsos também exigem valor e moeda de três letras.")}</p> : null}
        </details>
      </section>

      <section className="card boundaries">
        <div className="delegate-heading">
          <span>{copy.delegation}</span><h2>{copy.approve}</h2><p>{copy.intro}</p>
        </div>
        <ApprovalPanel
          planVersion={draft.plan.version}
          outcome={outcome?.outcome ?? draft.plan.goal}
          company={outcome?.responsibleParty ?? draft.promiseDraft.promisor.value}
          channel={activeChannelType === "MANAGED_EMAIL" ? copy.email : copy.demo}
          maximumFollowUps={draft.plan.maxLogicalSends ?? 3}
          proofRequired={outcome?.proofRequired ?? draft.plan.goal}
          controlled={activeChannelType === "CONTROLLED_SANDBOX"}
          legitimateContact={legitimateContact}
          onLegitimateContactChange={setLegitimateContact}
          actionLabel={draft.state === "READY" ? copy.activated : copy.start}
          busy={busy}
          disabled={draft.state === "READY" || boundary.locker !== null}
          blockerReason={boundary.locker}
          onApprove={() => { void command({ action: "approve", expectedPlanVersion: draft.plan.version, expectedPlanHash: draft.plan.planHash }); }}
        />
        <div className="channel-plan">
          <div className="channel-plan-heading">
            <span>1</span><div><strong>{copy.how}</strong><p>{copy.oneChannel}</p></div>
          </div>
          <div className="channel-options" role="group" aria-label={copy.choose}>
            {(["MANAGED_EMAIL", "CONTROLLED_SANDBOX"] as const).map((channelType) => {
              const capability = capabilities.find((item) => item.channelType === channelType);
              const selected = activeChannelType === channelType;
              const available = capability?.status === "AVAILABLE" && capability.canSend;
              return <button
                key={channelType}
                type="button"
                className="channel-option"
                aria-pressed={selected}
                disabled={busy || !available}
                data-active={selected}
                onClick={() => { chooseChannel(channelType); }}
              >
                <span aria-hidden="true">{channelType === "MANAGED_EMAIL" ? "✉" : "↗"}</span>
                <strong>{channelType === "MANAGED_EMAIL" ? copy.email : copy.demo}</strong>
                <small>{selected ? copy.selected : available ? copy.available : copy.unavailable}</small>
              </button>;
            })}
          </div>
          <p className="button-help">{copy.channelHelp}</p>
        </div>
        <div className="message-preview">
          <div className="message-preview-heading"><span>2</span><div><strong>{copy.first}</strong><p>{copy.bound}</p></div></div>
          <dl>
            <div><dt>{copy.to}</dt><dd>{draft.plan.allowedRecipient}</dd></div>
            <div><dt>{copy.from}</dt><dd>{draft.plan.senderIdentity ?? "ActionOS controlled demo"}</dd></div>
            <div><dt>{copy.replies}</dt><dd>{draft.plan.replyRoute ?? "Signed callback"}</dd></div>
            <div><dt>{copy.subject}</dt><dd>{followUpSubject}</dd></div>
          </dl>
          <div className="email-body">
            {followUpBody ? <p className="preserve-lines">{followUpBody}</p> : <>
              <p>{tr("Hello,", "Hola,", "Olá,")}</p>
              <p>{tr("ActionOS is following up on an outcome requested by your customer.", "ActionOS está haciendo seguimiento de un resultado solicitado por su cliente.", "O ActionOS está acompanhando um resultado solicitado por seu cliente.")}</p>
              <p><strong>{tr("Reference", "Referencia", "Referência")}:</strong> {referenceValue}<br /><strong>{tr("Amount", "Monto", "Valor")}:</strong> {amountValue}</p>
              <p>{tr("Please reply with the current status and verifiable confirmation when the outcome is complete.", "Responda con el estado actual y una confirmación verificable cuando se complete el resultado.", "Responda com o estado atual e uma confirmação verificável quando o resultado estiver concluído.")}</p>
              <p className="email-rule">{tr("An acknowledgement that the request was received will not be treated as completion.", "Un acuse de recibo no se considerará cumplimiento.", "Uma confirmação de recebimento não será considerada conclusão.")}</p>
            </>}
          </div>
          <div className="follow-up-policy"><span>{draft.plan.maxLogicalSends ?? 3} {copy.sends}</span><span>{draft.plan.executionMode === "ACCELERATED_DEMO" ? copy.seconds : `Every ${String(Math.round((draft.plan.followUpIntervalSeconds ?? 172800) / 86400))} days`}</span><span>{copy.stops}</span></div>
          {activeChannelType === "MANAGED_EMAIL" ? (
            <details><summary>{tr("Change the company email", "Cambiar el correo de la empresa", "Alterar o e-mail da empresa")}</summary><div className="inline-edit"><input type="email" aria-label={fieldLabels.allowedRecipient} value={recipient} placeholder={draft.plan.allowedRecipient} onChange={(event) => { setRecipient(event.target.value); }} /><button type="button" disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)} onClick={() => void saveRevision({ allowedRecipient: recipient.trim() })}>{tr("Save recipient", "Guardar destinatario", "Salvar destinatário")}</button></div></details>
          ) : null}
        </div>
        <div className="boundary.decision" aria-label={copy.before}>
          <strong>{copy.before}</strong>
          <p>{locale === "es" ? "ActionOS contactará a" : locale === "pt" ? "O ActionOS entrará em contato com" : "ActionOS will contact"} {activeChannelType === "MANAGED_EMAIL" ? draft.plan.allowedRecipient : copy.merchant}, {locale === "es" ? "compartirá" : locale === "pt" ? "compartilhará" : "share"} {monetaryPromise ? copy.dataMoney : copy.dataOutcome}, {locale === "es" ? "hará hasta" : locale === "pt" ? "fará até" : "make up to"} {draft.plan.maxLogicalSends ?? 3} {copy.decisionEnd}</p>
        </div>
        <details className="boundary.details">
          <summary>{copy.reviewLimits}</summary>
          <div className="permission-list boundary.summary" aria-label={copy.limitsLabel}>
          <div><span className="permission-icon">1</span><div><strong>{copy.request}</strong><p>{draft.plan.goal}</p></div></div>
          <div><span className="permission-icon">2</span><div><strong>{copy.contact}</strong><p>{draft.plan.allowedRecipient} via {activeChannelType === "MANAGED_EMAIL" ? copy.email : copy.demo}.</p></div></div>
          <div><span className="permission-icon">3</span><div><strong>{copy.timing}</strong><p>{draft.plan.executionMode === "ACCELERATED_DEMO" ? copy.seconds : draft.plan.followUpAt ? dateTime(draft.plan.followUpAt) : "—"}</p></div></div>
          <div><span className="permission-icon">4</span><div><strong>{copy.limits}</strong><p>{draft.plan.maxLogicalSends ?? 3} {copy.sends}. {copy.noExtra}</p></div></div>
          <div><span className="permission-icon">5</span><div><strong>{copy.proof}</strong><p>{outcome?.proofRequired ?? draft.plan.goal}</p></div></div>
          </div>
        </details>
        <details className="shared-data" open><summary>{copy.shared}</summary><p>{monetaryPromise ? copy.dataMoney : copy.dataOutcome}: {activeChannelType === "MANAGED_EMAIL" ? draft.plan.allowedRecipient : copy.merchant}. {copy.noExtra}</p></details>
        {activeChannelType === "CONTROLLED_SANDBOX" ? <p className="demo-warning"><strong>{tr("Accelerated controlled demo", "Demo controlada acelerada", "Demonstração controlada acelerada")}:</strong> {tr("after boundary. real Cloud Tasks and the isolated merchant adapter run in seconds. The action goes to ActionOS’s simulator; no real company will be contacted.", "después de aprobar, Cloud Tasks y el adaptador aislado se ejecutan en segundos. La acción va al simulador de ActionOS; no se contactará a una empresa real.", "após a aprovação, Cloud Tasks e o adaptador isolado executam em segundos. A ação vai para o simulador do ActionOS; nenhuma empresa real será contatada.")}</p> : null}
        <div className="return-promise">
          <strong>{copy.resultReturn}</strong><p>{copy.returnText}</p>
          <div className="inline-edit">
            <input
              type="email"
              aria-label={tr("Email for ActionOS mission updates", "Correo para novedades del caso", "E-mail para atualizações do caso")}
              value={notificationRecipient}
              placeholder={draft.plan.notificationRecipient ?? "you@example.com"}
              onChange={(event) => { setNotificationRecipient(event.target.value); }}
              readOnly={activeChannelType === "MANAGED_EMAIL" && Boolean(verifiedOwnerEmail)}
            />
            <button
              type="button"
              disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationRecipient) || (activeChannelType === "MANAGED_EMAIL" && notificationRecipient.toLowerCase() !== verifiedOwnerEmail?.toLowerCase())}
              onClick={() => void saveRevision({ notificationRecipient: notificationRecipient.trim() })}
            >{copy.saveEmail}</button>
          </div>
          <small>{draft.plan.notificationRecipient ? `${tr("Updates configured for", "Novedades configuradas para", "Atualizações configuradas para")} ${draft.plan.notificationRecipient}.` : activeChannelType === "MANAGED_EMAIL" ? tr("Link Google, then save its verified email for updates.", "Vinculá Google y guardá su correo verificado para novedades.", "Vincule o Google e salve o e-mail verificado para atualizações.") : tr("Optional for the controlled demo.", "Opcional para la demo controlada.", "Opcional para a demonstração controlada.")}</small>
        </div>
        <RecoverableIdentity
          required={activeChannelType === "MANAGED_EMAIL"}
          onChange={identityChange}
        />
        <button
          className="secondary"
          type="button"
          disabled={busy}
          onClick={() => {
            void simulate();
          }}
        >
          {copy.preview}
        </button>
        {simulation ? (
          <p className="simulation">
            {copy.previewOnly} {simulation.recipient}.
          </p>
        ) : null}
        <button
          className="text-button"
          type="button"
          disabled={busy || draft.state !== "AWAITING_APPROVAL"}
          onClick={() => {
            void command({ action: "reject", expectedPlanVersion: draft.plan.version });
          }}
        >
          {copy.reject}
        </button>
        <button
          className="text-button danger"
          type="button"
          disabled={busy || draft.state === "READY"}
          onClick={() => {
            if (window.confirm(copy.confirmDelete)) void deleteDraft();
          }}
        >
          {copy.delete}
        </button>
        {error ? <p className="error" role="alert">{errorCopy(error)}</p> : null}
        <p className="sr-status" role="status" aria-live="polite" tabIndex={-1} ref={statusRef}>{status}</p>
      </section>
    </div>
  );
}
