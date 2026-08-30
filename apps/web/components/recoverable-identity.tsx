"use client";

import { useEffect, useState } from "react";
import {
  linkCurrentIdentityWithGoogle,
  recoverableIdentity
} from "../lib/firebase-client";
import { useLocale } from "../lib/use-locale";

export function RecoverableIdentity({
  required,
  onChange
}: {
  readonly required: boolean;
  readonly onChange: (recoverable: boolean, email?: string) => void;
}) {
  const { locale } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const [state, setState] = useState<"LOADING" | "ANONYMOUS" | "RECOVERABLE">("LOADING");
  const [email, setEmail] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void recoverableIdentity().then((identity) => {
      setState(identity.isAnonymous ? "ANONYMOUS" : "RECOVERABLE");
      setEmail(identity.email);
      onChange(!identity.isAnonymous, identity.email);
    }).catch(() => {
      setState("ANONYMOUS"); onChange(false);
    });
  }, [onChange]);

  if (state === "LOADING") return <div className="identity-gate" role="status">{tr("Checking how you can return to this case…", "Verificando cómo podés volver a este caso…", "Verificando como você pode voltar a este caso…")}</div>;
  if (state === "RECOVERABLE") return <div className="identity-gate ready"><span aria-hidden="true">✓</span><div><strong>{tr("Access saved", "Acceso guardado", "Acesso salvo")}</strong><p>{email ? `${tr("Continue with", "Continuar con", "Continuar com")} ${email}.` : tr("This mission can be reopened after sign-in on another device.", "Este caso puede reabrirse después de iniciar sesión en otro dispositivo.", "Este caso pode ser reaberto após entrar em outro dispositivo.")}</p></div></div>;
  return <div className="identity-gate" data-required={required}>
    <span aria-hidden="true">↗</span><div><strong>{required ? tr("Save access before ActionOS sends", "Guardá el acceso antes de que ActionOS envíe", "Salve o acesso antes do envio") : tr("Save access to your follow-ups", "Guardá el acceso a tus seguimientos", "Salve o acesso aos seus acompanhamentos")}</strong>
      <p>{required ? tr("Real email continues after this tab closes. Link Google so only you can return on another device.", "El correo real continúa después de cerrar la pestaña. Vinculá Google para volver de forma segura.", "O e-mail real continua após fechar a aba. Vincule o Google para voltar com segurança.") : tr("Optional for the controlled demo. Your current anonymous access stays in this browser.", "Opcional para la demo controlada. El acceso anónimo permanece en este navegador.", "Opcional para a demonstração controlada. O acesso anônimo permanece neste navegador.")}</p>
      <button type="button" className="secondary" disabled={busy} onClick={() => {
        setBusy(true); setError(undefined);
        void linkCurrentIdentityWithGoogle().then((result) => {
          setEmail(result.email); setState("RECOVERABLE"); onChange(true, result.email);
        }).catch((cause: unknown) => {
          const code = cause instanceof Error ? cause.message : "RECOVERABLE_SIGN_IN_FAILED";
          setError(code === "RECOVERABLE_ACCOUNT_ALREADY_EXISTS"
            ? tr("That Google account already has ActionOS access. This draft remains safely in this browser; automatic mission merging is not enabled yet.", "Esa cuenta Google ya tiene acceso a ActionOS. El borrador permanece seguro en este navegador; todavía no se combinan casos automáticamente.", "Essa conta Google já possui acesso ao ActionOS. O rascunho permanece seguro neste navegador; os casos ainda não são combinados automaticamente.")
            : code === "RECOVERABLE_SIGN_IN_CANCELLED" ? tr("Sign-in was cancelled. Nothing was sent.", "Se canceló el inicio de sesión. No se envió nada.", "O login foi cancelado. Nada foi enviado.") : tr("ActionOS could not save access. Nothing was sent.", "ActionOS no pudo guardar el acceso. No se envió nada.", "O ActionOS não conseguiu salvar o acesso. Nada foi enviado."));
        }).finally(() => {
          setBusy(false);
        });
      }}>{busy ? tr("Connecting…", "Conectando…", "Conectando…") : tr("Continue with Google", "Continuar con Google", "Continuar com Google")}</button>
      {error ? <p className="error" role="alert">{error}</p> : null}
    </div>
  </div>;
}
