"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "../../components/ui/GlassCard";
import InteractiveCard from "../../components/ui/InteractiveCard";
import { Button } from "../../components/ui/button";
import { Activity, ArrowRight, BrainCircuit, CheckCircle2, Workflow } from "lucide-react";
import NeonMesh from "../../components/ui/neon-mesh";

function AuthForm() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/dashboard";
  };

  return (
    <div className="relative z-10">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#BEF202] font-medium mb-6">
        <Activity className="w-3.5 h-3.5" /> System Access
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white tracking-tight">
        Welcome to ActionOS
      </h1>
      <p className="text-white/60 mb-8">
        {isLogin 
          ? "Sign in to continue your autonomous agent workflows." 
          : "Create an account to deploy your first agent."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#BEF202]/50 focus:border-[#BEF202] transition-all"
              required={!isLogin}
            />
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#BEF202]/50 focus:border-[#BEF202] transition-all"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#BEF202]/50 focus:border-[#BEF202] transition-all"
            required
          />
        </div>

        <Button type="submit" className="w-full bg-[#BEF202] text-black hover:bg-[#a5d202] font-bold py-6 rounded-xl mt-4 text-base flex items-center justify-center gap-2 group">
          {isLogin ? "Sign In" : "Create Account"}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-white/50">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button 
          type="button"
          onClick={() => setIsLogin(!isLogin)} 
          className="text-white hover:text-[#BEF202] font-medium transition-colors"
        >
          {isLogin ? "Sign up" : "Log in"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-center overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0">
        <NeonMesh title="" subtitle="" description="" className="opacity-40" />
      </div>
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

      {/* Navigation Bar (Minimal) */}
      <nav className="absolute top-0 w-full p-6 z-20 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-5 h-5 flex items-center justify-center">
            <span className="absolute w-1.5 h-1.5 rounded-full bg-white/60 top-0 left-1/2 transform -translate-x-1/2"></span>
            <span className="absolute w-1.5 h-1.5 rounded-full bg-white/60 left-0 top-1/2 transform -translate-y-1/2"></span>
            <span className="absolute w-1.5 h-1.5 rounded-full bg-white/60 right-0 top-1/2 transform -translate-y-1/2"></span>
            <span className="absolute w-1.5 h-1.5 rounded-full bg-[#BEF202] bottom-0 left-1/2 transform -translate-x-1/2 shadow-[0_0_8px_#BEF202]"></span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">ActionOS</span>
        </Link>
      </nav>

      <main className="relative z-10 container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-8 w-full max-w-6xl">
          
          {/* Left Side: Auth Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center max-w-md mx-auto lg:mx-0">
            <InteractiveCard delay={0.1} hoverScale={1.01} className="w-full">
              <GlassCard className="p-8 md:p-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl relative overflow-hidden group">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#BEF202] rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <Suspense fallback={<div className="h-64 flex items-center justify-center text-white/50">Loading interface...</div>}>
                  <AuthForm />
                </Suspense>
              </GlassCard>
            </InteractiveCard>
          </div>

          {/* Right Side: Agent Pipeline Preview */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center max-w-md mx-auto lg:mx-0">
            <InteractiveCard delay={0.2} hoverScale={1.01} className="w-full h-full">
              <GlassCard className="p-8 md:p-10 bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl h-full flex flex-col justify-center">
                
                <div className="flex items-center gap-3 mb-2">
                  <Workflow className="w-6 h-6 text-[#BEF202]" />
                  <h2 className="text-2xl font-bold text-white tracking-tight">Agent Pipeline Preview</h2>
                </div>
                <p className="text-white/50 mb-8 text-sm">What happens immediately after you log in</p>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="group p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="text-xs font-bold text-white/40 tracking-wider uppercase mb-2">Step 1</div>
                    <div className="flex gap-3">
                      <BrainCircuit className="w-5 h-5 text-white/50 mt-0.5 group-hover:text-[#BEF202] transition-colors" />
                      <div className="text-white/90 text-sm font-medium leading-relaxed">
                        Define Agent DNA and specific operational goals in the control center.
                      </div>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="group p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="text-xs font-bold text-white/40 tracking-wider uppercase mb-2">Step 2</div>
                    <div className="flex gap-3">
                      <Activity className="w-5 h-5 text-white/50 mt-0.5 group-hover:text-[#BEF202] transition-colors" />
                      <div className="text-white/90 text-sm font-medium leading-relaxed">
                        Autonomous worker dynamically loads necessary capabilities and begins environment analysis.
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="group p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="text-xs font-bold text-white/40 tracking-wider uppercase mb-2">Step 3</div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-white/50 mt-0.5 group-hover:text-[#BEF202] transition-colors" />
                      <div className="text-white/90 text-sm font-medium leading-relaxed">
                        Review deterministic state plans, approve execution, and monitor real-time outcomes.
                      </div>
                    </div>
                  </div>
                </div>

              </GlassCard>
            </InteractiveCard>
          </div>

        </div>
      </main>
    </div>
  );
}
