import { AppSidebar } from "../../components/app-sidebar";
import { CommandPalette } from "../../components/command-palette";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../../components/ui/sidebar";
import { GridBackground } from "../../components/ui/GridBackground";
import { AuthGuard } from "../../components/auth-guard";
import { WorkspaceHeader } from "../../components/workspace-header";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex w-full h-screen overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="relative flex-1 bg-transparent">
          <GridBackground className="h-full flex flex-col">
            <WorkspaceHeader />
            <main className="flex-1 overflow-auto no-scrollbar">
              <AuthGuard>
                {children}
              </AuthGuard>
            </main>
          </GridBackground>
        </SidebarInset>
        <CommandPalette />
      </div>
    </SidebarProvider>
  );
}
