"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Activity, LogOut } from "lucide-react";
import NeonMesh from "../../components/ui/neon-mesh";
import InteractiveCard from "../../components/ui/InteractiveCard";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/button";
import { recoverableIdentity, signOutUser, reloadUser } from "../../lib/firebase-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("your email");

  useEffect(() => {
    recoverableIdentity().then((identity) => {
      if (identity.email) setEmail(identity.email);
    }).catch(console.error);
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/login");
  };

  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await reloadUser();
      // After reloading, simply refresh the window to let AuthGuard check again
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
      </div>
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

      <main className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-lg">
          <InteractiveCard delay={0.1} hoverScale={1.02}>
            <GlassCard className="p-8 md:p-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl relative overflow-hidden group text-center">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#BEF202] rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
              
              <div className="mx-auto w-16 h-16 bg-[#BEF202]/10 border border-[#BEF202]/20 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-[#BEF202]" />
              </div>

              <h1 className="text-3xl font-bold mb-3 text-white tracking-tight">
                Verify Your Email
              </h1>
              <p className="text-white/60 mb-8 leading-relaxed">
                We just sent a secure verification link to <strong className="text-white font-semibold">{email}</strong>. 
                <br /><br />
                Please click the link in that email to prove you own it and unlock your dashboard.
              </p>

              <div className="flex flex-col gap-4">
                <Button disabled={loading} onClick={handleRefresh} className="w-full bg-[#BEF202] text-black hover:bg-[#a5d202] font-bold py-6 rounded-xl text-base flex items-center justify-center gap-2 group disabled:opacity-50">
                  {loading ? "Checking..." : "I've verified my email"}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </Button>
                
                <Button disabled={loading} onClick={handleSignOut} variant="ghost" className="w-full text-white/50 hover:text-white hover:bg-white/5 py-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </Button>
              </div>

            </GlassCard>
          </InteractiveCard>
        </div>
      </main>
    </div>
  );
}
