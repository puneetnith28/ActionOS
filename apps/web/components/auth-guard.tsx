"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recoverableIdentity } from "../lib/firebase-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    let timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.error("Auth Guard Error: recoverableIdentity timed out");
        router.replace("/login");
      }
    }, 15000);

    recoverableIdentity()
      .then((identity) => {
        if (!mounted) return;
        clearTimeout(timeoutId);
        console.log("AuthGuard identity:", identity);
        if (identity.isAnonymous) {
          router.replace("/login");
        } else if (identity.email && !identity.emailVerified) {
          router.replace("/verify-email");
        } else {
          setAuthorized(true);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Auth Guard Error:", error);
        clearTimeout(timeoutId);
        if (mounted) router.replace("/login");
      });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [router]);

  if (loading || !authorized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#BEF202] animate-ping"></div>
          <span className="text-white/50 text-sm tracking-widest uppercase">Authenticating...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
