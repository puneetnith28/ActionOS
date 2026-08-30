"use client";

import { getReviewCopy } from "../lib/review-copy";
import { useLocale } from "../lib/use-locale";

type BlockerReason = "facts" | "channel" | "contact" | "identity" | null;

export function ApprovalPanel(props: {
  readonly planVersion: number;
  readonly outcome: string;
  readonly company: string;
  readonly channel: string;
  readonly maximumFollowUps: number;
  readonly proofRequired: string;
  readonly controlled: boolean;
  readonly legitimateContact: boolean;
  readonly onLegitimateContactChange: (checked: boolean) => void;
  readonly actionLabel: string;
  readonly busy: boolean;
  readonly disabled: boolean;
  readonly blockerReason: BlockerReason;
  readonly onApprove: () => void;
}) {
  const { locale } = useLocale();
  const copy = getReviewCopy(locale);
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const blockerCopy: Record<Exclude<BlockerReason, null>, string> = {
    facts: tr("Confirm the highlighted facts before activation.", "Confirmá los datos resaltados antes de activar.", "Confirme os dados destacados antes de ativar."),
    channel: tr("The selected channel is not available.", "El canal elegido no está disponible.", "O canal selecionado não está disponível."),
    contact: tr("Confirm the authorized contact to enable approval.", "Confirmá el contacto autorizado para habilitar la aprobación.", "Confirme o contato autorizado para habilitar a aprovação."),
    identity: tr("Link recoverable access before activating email.", "Vinculá acceso recuperable antes de activar el correo.", "Vincule o acesso recuperável antes de ativar o e-mail.")
  };
  return <div className="approval-primary-panel">
    <div className="approval-primary-heading"><span className="status-dot" aria-hidden="true" /><div><small>{tr("PLAN", "PLAN", "PLANO")} v{props.planVersion}</small><strong>{tr("Approve this follow-up", "Aprobá este seguimiento", "Aprove este acompanhamento")}</strong></div></div>
    <dl className="approval-primary-facts">
      <div><dt>{tr("Outcome", "Resultado", "Resultado")}</dt><dd>{props.outcome}</dd></div>
      <div><dt>{tr("Company", "Empresa", "Empresa")}</dt><dd>{props.company}</dd></div>
      <div><dt>{tr("Channel", "Canal", "Canal")}</dt><dd>{props.channel}</dd></div>
      <div><dt>{tr("Maximum follow-ups", "Máximo de seguimientos", "Máximo de acompanhamentos")}</dt><dd>{props.maximumFollowUps}</dd></div>
    </dl>
    <div className="approval-proof"><small>{tr("DONE ONLY WHEN", "TERMINA SÓLO CUANDO", "CONCLUI SOMENTE QUANDO")}</small><strong>{props.proofRequired}</strong></div>
    {props.controlled ? <p className="controlled-context"><strong>{tr("Controlled demo", "Demo controlada", "Demonstração controlada")}</strong><span>{tr("DueBack contacts its isolated simulator. No real company is contacted.", "DueBack contacta su simulador aislado. No se contacta ninguna empresa real.", "O DueBack contata seu simulador isolado. Nenhuma empresa real é contatada.")}</span></p> : null}
    <label className="legitimate-contact"><input type="checkbox" checked={props.legitimateContact} onChange={(event) => { props.onLegitimateContactChange(event.target.checked); }} /><span><strong>{copy.authorized}</strong><small>{copy.authorizedHelp}</small></span></label>
    <button className="primary approval-primary-cta" type="button" disabled={props.busy || props.disabled} onClick={props.onApprove}>{props.actionLabel}</button>
    {props.blockerReason ? <p className="button-help">{blockerCopy[props.blockerReason]}</p> : <p className="button-help approval-ready">{tr("Nothing has been sent yet.", "Todavía no se envió nada.", "Nada foi enviado ainda.")}</p>}
  </div>;
}
