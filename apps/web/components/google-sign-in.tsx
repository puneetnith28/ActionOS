"use client";

import { useState } from "react";
import { signInWithExistingGoogle } from "../lib/firebase-client";
import { useLocale } from "../lib/use-locale";

export function GoogleSignIn({
  onSignedIn,
  compact = false
}: {
  readonly onSignedIn: () => void;
  readonly compact?: boolean;
}) {
  const { locale } = useLocale();
  const tr = (en: string, es: string, pt: string) => locale === "es" ? es : locale === "pt" ? pt : en;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  return <div className={compact ? "google-sign-in compact" : "google-sign-in"}>
    {!compact ? <p>{tr("Already saved your access? Sign in to recover the same private cases on this device.", "¿Ya guardaste tu acceso? Iniciá sesión para recuperar los mismos casos privados.", "Já salvou seu acesso? Entre para recuperar os mesmos casos privados.")}</p> : null}
    <button type="button" className="secondary" disabled={busy} onClick={() => {
      setBusy(true); setError(undefined);
      void signInWithExistingGoogle().then(() => { onSignedIn(); }).catch((cause: unknown) => {
        setError(cause instanceof Error && cause.message === "RECOVERABLE_SIGN_IN_CANCELLED"
          ? tr("Sign-in was cancelled. No mission was changed.", "Se canceló el inicio de sesión. Ningún caso cambió.", "O login foi cancelado. Nenhum caso foi alterado.")
          : tr("Google sign-in did not finish. Check that popups are allowed and try again.", "El inicio con Google no terminó. Permití ventanas emergentes e intentá nuevamente.", "O login com Google não terminou. Permita pop-ups e tente novamente."));
      }).finally(() => { setBusy(false); });
    }}>{busy ? tr("Signing in…", "Iniciando sesión…", "Entrando…") : tr("Sign in with Google", "Iniciar sesión con Google", "Entrar com Google")}</button>
    {error ? <p className="error" role="alert">{error}</p> : null}
  </div>;
}
