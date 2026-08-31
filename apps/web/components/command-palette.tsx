"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  const runCommand = (action: () => void) => {
    action();
    setOpen(false);
    setQuery("");
  };

  const commands = [
    { name: "Create Mission", action: () => router.push("/intake") },
    { name: "Open Active Missions", action: () => router.push("/missions") },
    { name: "Check System Health", action: () => router.push("/status") },
    { name: "View Activity Logs", action: () => router.push("/activity") },
  ];

  const filtered = query === "" ? commands : commands.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="dialog-overlay" onClick={() => setOpen(false)}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <input 
          autoFocus
          placeholder="Search commands..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", padding: "16px 24px", border: "none", borderBottom: "1px solid var(--border-subtle)", background: "transparent", color: "var(--fg-base)", fontSize: "16px", outline: "none" }}
        />
        <div style={{ padding: "8px" }}>
          {filtered.length > 0 ? filtered.map((cmd) => (
            <button
              key={cmd.name}
              className="nav-link"
              onClick={() => runCommand(cmd.action)}
              style={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", fontSize: "14px" }}
            >
              <span>{cmd.name}</span>
              <span className="text-mono" style={{ color: "var(--fg-subtle)", fontSize: "11px" }}>Action</span>
            </button>
          )) : (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--fg-muted)", fontSize: "13px" }}>
              No commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
