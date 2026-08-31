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
    
    recoverableIdentity()
      .then((identity) => {
        if (!mounted) return;
        
        if (identity.isAnonymous) {
          router.replace("/login");
        } else {
          setAuthorized(true);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Auth Guard Error:", error);
        if (mounted) router.replace("/login");
      });

    return () => {
      mounted = false;
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
