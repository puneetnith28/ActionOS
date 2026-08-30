"use client";

import { useState } from "react";
import type { NotificationRecord } from "@actionos/runtime/notifications";
import { anonymousIdToken } from "../lib/firebase-client";
import { notificationPresentation } from "../lib/notification-presentation";
import { useLocale } from "../lib/use-locale";

export function NotificationStatus({
  missionId,
  notification,
  onRetried
}: {
  readonly missionId: string;
  readonly notification: NotificationRecord;
  readonly onRetried: () => void;
}) {
  const { locale } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const presentation = notificationPresentation(notification);
  return <section className="card notification-status" aria-label={tr("System Notification State", "Estado de notificaciones", "Estado das notificações")}>
    <div className="eyebrow">{tr("Notification Routing", "Enrutamiento de notificaciones", "Roteamento de notificações")}</div>
    <h2>{presentation.copy}</h2>
    {presentation.inAppOnly
      ? <p>{tr("Execution updates are restricted to the Live Mission Console. External webhooks and email routing are disabled.", "Las actualizaciones de estado están restringidas a la consola. Los webhooks externos y notificaciones por correo están desactivados.", "As atualizações de estado estão restritas ao Console. Webhooks externos e notificações por e-mail estão desativados.")}</p>
      : <p>{tr("Destination", "Destino", "Destino")}: {presentation.destination}. {tr("Attempts", "Intentos", "Tentativas")}: {presentation.attempts} {tr("of 3", "de 3", "de 3")}.</p>}
    <p>{presentation.inAppOnly ? tr("Verification results are preserved locally.", "Los resultados de verificación se preservan aquí.", "Os resultados de verificação são preservados aqui.") : tr("Outbound notification transport failures do not impact autonomous execution state.", "Fallos en el transporte de notificaciones no impactan el estado de ejecución autónoma.", "Falhas no transporte de notificações não impactam o estado de execução autônoma.")}</p>
    {presentation.canRetry ? <button type="button" className="secondary" disabled={busy} onClick={() => {
      setBusy(true); setError(undefined);
      void anonymousIdToken().then((token) => fetch(`/api/cases/${missionId}/notifications/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.notificationId })
      })).then((response) => {
        if (!response.ok) throw new Error("RETRY_FAILED");
        onRetried();
      }).catch(() => { setError(tr("ActionOS could not retry this notification. Your mission state is unchanged.", "ActionOS no pudo reintentar la notificación. El estado de la misión no cambió.", "O ActionOS não conseguiu tentar esta notificação novamente. O estado da missão não mudou.")); })
        .finally(() => { setBusy(false); });
    }}>{busy ? tr("Retrying…", "Reintentando…", "Tentando novamente…") : tr("Retry notification", "Reintentar notificación", "Tentar notificação novamente")}</button> : null}
    {error ? <p className="error" role="alert">{error}</p> : null}
  </section>;
}
