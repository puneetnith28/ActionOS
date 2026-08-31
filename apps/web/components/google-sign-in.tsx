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
  return (
    <div className={`flex flex-col items-center gap-3 ${compact ? "w-auto" : "w-full max-w-sm"}`}>
      {!compact && (
        <p className="text-white/60 text-sm text-center mb-2">
          {tr("Already saved your access? Sign in to recover the same private cases on this device.", "¿Ya guardaste tu acceso? Iniciá sesión para recuperar los mismos casos privados.", "Já salvou seu acesso? Entre para recuperar os mesmos casos privados.")}
        </p>
      )}
      
      <button 
        type="button" 
        disabled={busy} 
        onClick={() => {
          setBusy(true); setError(undefined);
          void signInWithExistingGoogle().then(() => { onSignedIn(); }).catch((cause: unknown) => {
            setError(cause instanceof Error && cause.message === "RECOVERABLE_SIGN_IN_CANCELLED"
              ? tr("Sign-in was cancelled. No mission was changed.", "Se canceló el inicio de sesión. Ningún caso cambió.", "O login foi cancelado. Nenhum caso foi alterado.")
              : tr("Google sign-in did not finish. Check that popups are allowed and try again.", "El inicio con Google no terminó. Permití ventanas emergentes e intentá nuevamente.", "O login com Google não terminou. Permita pop-ups e tente novamente."));
          }).finally(() => { setBusy(false); });
        }}
        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-black hover:bg-gray-200 font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {busy ? tr("Signing in…", "Iniciando sesión…", "Entrando…") : tr("Sign in with Google", "Iniciar sesión con Google", "Entrar com Google")}
      </button>

      {error && (
        <p className="text-red-400 text-sm font-medium text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
