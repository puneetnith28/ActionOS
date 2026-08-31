"use client";

import * as React from "react"
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar"
import { 
  LayoutDashboard, 
  Target, 
  Activity, 
  CheckCircle2, 
  Zap, 
  Server, 
  Network, 
  ActivitySquare, 
  Settings, 
  Search
} from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex h-12 items-center px-4 border-b border-sidebar-border">
          <strong className="text-sm tracking-wider text-sidebar-foreground">ACTIONOS</strong>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-4 py-2">
          <button className="flex w-full items-center justify-between rounded-md border border-sidebar-border bg-background px-3 py-1.5 text-sm text-sidebar-foreground/50 shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search...
            </span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar-accent px-1.5 font-mono text-[10px] font-medium text-sidebar-accent-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/missions")}>
                  <Link href="/missions">
                    <Target />
                    <span>Missions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/activity")}>
                  <Link href="/activity">
                    <Activity />
                    <span>Activity</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/status/completed")}>
                  <Link href="/status/completed">
                    <CheckCircle2 />
                    <span>Completed</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/capabilities")}>
                  <Link href="/capabilities">
                    <Zap />
                    <span>Capabilities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/status/execution")}>
                  <Link href="/status/execution">
                    <Server />
                    <span>Execution</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/status/integrations")}>
                  <Link href="/status/integrations">
                    <Network />
                    <span>Integrations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/status") && pathname === "/status"}>
                  <Link href="/status">
                    <ActivitySquare />
                    <span>Health</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="mt-2 h-12">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xs font-bold">P</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Puneet</span>
                  <span className="text-xs text-sidebar-foreground/50">Admin</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
