"use client";

import * as React from "react";
import { useEffect, useState } from "react";
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
  Search,
  LogOut,
  LogIn
} from "lucide-react"
import { recoverableIdentity, signOutUser } from "../lib/firebase-client";

export function AppSidebar() {
  const pathname = usePathname();
  const [identity, setIdentity] = useState<{ isAnonymous: boolean; email?: string; name?: string }>();

  useEffect(() => {
    recoverableIdentity().then(setIdentity).catch(console.error);
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    window.location.reload();
  };

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
            {identity && !identity.isAnonymous ? (
              <div className="flex items-center justify-between mt-2 h-12 px-2 bg-sidebar-accent/50 rounded-lg">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <span className="text-xs font-bold uppercase">{identity.name?.[0] || identity.email?.[0] || 'U'}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{identity.name || "User"}</span>
                    <span className="text-xs text-sidebar-foreground/50 truncate">{identity.email}</span>
                  </div>
                </div>
                <button onClick={handleSignOut} className="p-2 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors ml-2" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <SidebarMenuButton asChild className="mt-2 h-12">
                <Link href="/login" className="flex items-center justify-center gap-2 text-primary bg-primary/5 hover:bg-primary/10">
                  <LogIn className="w-4 h-4" />
                  <span className="font-semibold">Sign In</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
