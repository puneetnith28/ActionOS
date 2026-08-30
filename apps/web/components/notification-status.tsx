"use client";

import { useState } from "react";
import type { NotificationRecord } from "@dueback/runtime/notifications";
import { anonymousIdToken } from "../lib/firebase-client";
import { notificationPresentation } from "../lib/notification-presentation";
import { useLocale } from "../lib/use-locale";

export function NotificationStatus({
  caseId,
  notification,
  onRetried
}: {
  readonly caseId: string;
  readonly notification: NotificationRecord;
  readonly onRetried: () => void;
}) {
  const { locale } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const presentation = notificationPresentation(notification);
  return <section className="card notification-status" aria-label={tr("Your return notification", "Tu notificación de retorno", "Sua notificação de retorno")}>
    <div className="eyebrow">{tr("Return notification", "Notificación de retorno", "Notificação de retorno")}</div>
    <h2>{presentation.copy}</h2>
    {presentation.inAppOnly
      ? <p>{tr("This case page is your return path. No email update was requested.", "Esta página es tu vía de retorno. No se solicitó un correo.", "Esta página é seu caminho de retorno. Nenhum e-mail foi solicitado.")}</p>
      : <p>{tr("Destination", "Destino", "Destino")}: {presentation.destination}. {tr("Attempts", "Intentos", "Tentativas")}: {presentation.attempts} {tr("of 3", "de 3", "de 3")}.</p>}
    <p>{presentation.inAppOnly ? tr("The proof decision is saved here.", "La decisión de prueba queda guardada aquí.", "A decisão de prova fica salva aqui.") : tr("Notification delivery never changes whether the company promise has enough proof.", "La entrega de la notificación nunca cambia si la promesa tiene prueba suficiente.", "A entrega da notificação nunca muda se a promessa possui prova suficiente.")}</p>
    {presentation.canRetry ? <button type="button" className="secondary" disabled={busy} onClick={() => {
      setBusy(true); setError(undefined);
      void anonymousIdToken().then((token) => fetch(`/api/cases/${caseId}/notifications/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.notificationId })
      })).then((response) => {
        if (!response.ok) throw new Error("RETRY_FAILED");
        onRetried();
      }).catch(() => { setError(tr("DueBack could not retry this notification. Your case is unchanged.", "DueBack no pudo reintentar esta notificación. Tu caso no cambió.", "O DueBack não conseguiu tentar esta notificação novamente. Seu caso não mudou.")); })
        .finally(() => { setBusy(false); });
    }}>{busy ? tr("Retrying…", "Reintentando…", "Tentando novamente…") : tr("Retry notification", "Reintentar notificación", "Tentar notificação novamente")}</button> : null}
    {error ? <p className="error" role="alert">{error}</p> : null}
  </section>;
}
