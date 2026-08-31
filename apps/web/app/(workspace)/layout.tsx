import { AppSidebar } from "../../components/app-sidebar";
import { CommandPalette } from "../../components/command-palette";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <AppSidebar />
      <div className="app-main">
        <div className="app-topbar flex-between">
          <span style={{ fontSize: "12px", color: "var(--fg-muted)", fontWeight: 500 }}>ActionOS / Workspace</span>
          <div className="flex-center gap-4">
            <span className="badge badge-success">● SYSTEM ONLINE</span>
          </div>
        </div>
        <main className="app-content no-scrollbar">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
