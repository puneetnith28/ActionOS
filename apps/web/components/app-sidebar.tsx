"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  return (
    <div className="app-sidebar">
      <div className="flex-center" style={{ height: "56px", borderBottom: "1px solid var(--border-subtle)", padding: "0 24px", justifyContent: "flex-start" }}>
        <strong style={{ fontSize: "14px", letterSpacing: "0.05em", color: "var(--fg-base)" }}>ACTIONOS</strong>
      </div>
      
      <div style={{ padding: "16px 8px" }}>
        <button className="input" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--fg-subtle)", cursor: "text", marginBottom: "24px", height: "32px", fontSize: "12px" }}>
          <span>Search...</span>
          <span className="badge" style={{ backgroundColor: "var(--bg-subtle)" }}>⌘K</span>
        </button>

        <div className="nav-group">
          <div className="nav-group-title">WORKSPACE</div>
          <Link href="/dashboard" className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}>
            <span style={{ fontSize: "16px", width: "20px", display: "inline-block" }}>▣</span> Overview
          </Link>
          <Link href="/missions" className={`nav-link ${isActive("/missions") ? "active" : ""}`}>
            <span style={{ fontSize: "16px", width: "20px", display: "inline-block" }}>◉</span> Missions
          </Link>
          <Link href="/activity" className={`nav-link ${isActive("/activity") ? "active" : ""}`}>
            <span style={{ fontSize: "16px", width: "20px", display: "inline-block" }}>◌</span> Activity
          </Link>
          <Link href="/status/completed" className={`nav-link ${isActive("/status/completed") ? "active" : ""}`}>
            <span style={{ fontSize: "16px", width: "20px", display: "inline-block" }}>✓</span> Completed
          </Link>
        </div>

        <div className="nav-group">
          <div className="nav-group-title">SYSTEM</div>
          <Link href="/capabilities" className={`nav-link ${isActive("/capabilities") ? "active" : ""}`}>
            <span style={{ fontSize: "16px", width: "20px", display: "inline-block" }}>⚡</span> Capabilities
          </Link>
          <Link href="/status/execution" className={`nav-link ${isActive("/status/execution") ? "active" : ""}`}>
            <span style={{ fontSize: "16px", width: "20px", display: "inline-block" }}>◫</span> Execution
          </Link>
          <Link href="/status/integrations" className={`nav-link ${isActive("/status/integrations") ? "active" : ""}`}>
            <span style={{ fontSize: "16px", width: "20px", display: "inline-block" }}>◈</span> Integrations
          </Link>
          <Link href="/status" className={`nav-link ${isActive("/status") && pathname === "/status" ? "active" : ""}`}>
            <span style={{ fontSize: "16px", width: "20px", display: "inline-block" }}>◉</span> Health
          </Link>
        </div>
      </div>
      
      <div style={{ flex: 1 }}></div>

      <div style={{ padding: "16px", borderTop: "1px solid var(--border-subtle)" }}>
        <Link href="/settings" className="nav-link" style={{ margin: 0, padding: "8px" }}>
          <span style={{ fontSize: "16px", width: "20px", display: "inline-block" }}>⚙</span> Settings
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 8px 4px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--accent-muted)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600 }}>
            P
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "12px", color: "var(--fg-base)", fontWeight: 500 }}>Puneet</span>
            <span style={{ fontSize: "10px", color: "var(--fg-subtle)" }}>Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
