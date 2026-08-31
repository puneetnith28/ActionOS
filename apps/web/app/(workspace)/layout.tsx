import { AppSidebar } from "../../components/app-sidebar";
import { CommandPalette } from "../../components/command-palette";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../../components/ui/sidebar";
import { GridBackground } from "../../components/ui/GridBackground";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex w-full h-screen overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="relative flex-1 bg-transparent">
          <GridBackground className="h-full flex flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/50 backdrop-blur px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1 flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">ActionOS / Workspace</span>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20 shadow-sm">
                    ● SYSTEM ONLINE
                  </span>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto no-scrollbar">
              {children}
            </main>
          </GridBackground>
        </SidebarInset>
        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}
