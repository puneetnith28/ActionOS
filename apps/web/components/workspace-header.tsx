"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "./ui/sidebar";
import { useEffect, useState } from "react";

export function WorkspaceHeader() {
  const pathname = usePathname();
  const [status, setStatus] = useState<"ONLINE" | "CHECKING" | "OFFLINE">("CHECKING");

  let title = "Workspace";
  if (pathname && pathname !== "/" && pathname !== "/dashboard") {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      title = lastPart.replace(/-/g, " ");
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
  } else if (pathname === "/dashboard") {
    title = "Overview";
  }

  useEffect(() => {
    // Ping API to check if backend is actually reachable
    fetch("/api/config/firebase")
      .then((res) => {
        if (res.ok) setStatus("ONLINE");
        else setStatus("OFFLINE");
      })
      .catch(() => setStatus("OFFLINE"));
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/50 backdrop-blur px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1 flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground capitalize">
          ActionOS <span className="text-white/20 mx-1">/</span> <span className="text-white/80">{title}</span>
        </span>
        <div className="flex items-center gap-4">
          {status === "ONLINE" && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20 shadow-sm transition-all">
              <span className="mr-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></span> SYSTEM ONLINE
            </span>
          )}
          {status === "CHECKING" && (
            <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-500 border border-yellow-500/20 shadow-sm animate-pulse transition-all">
              <span className="mr-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500"></span> CONNECTING...
            </span>
          )}
          {status === "OFFLINE" && (
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500 border border-red-500/20 shadow-sm transition-all">
              <span className="mr-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></span> SYSTEM OFFLINE
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
