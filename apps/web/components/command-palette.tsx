"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "./ui/command";
import {
  Activity,
  CheckCircle2,
  LayoutDashboard,
  Network,
  Server,
  Settings,
  Target,
  Zap,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Workspace">
          <CommandItem onSelect={() => runCommand(() => router.push("/intake"))}>
            <Zap className="mr-2 h-4 w-4 text-primary" />
            <span>Create New Mission</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/missions"))}>
            <Target className="mr-2 h-4 w-4" />
            <span>Active Missions</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/activity"))}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Activity Logs</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/status/completed"))}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            <span>Completed Missions</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandGroup heading="System">
          <CommandItem onSelect={() => runCommand(() => router.push("/status"))}>
            <Activity className="mr-2 h-4 w-4" />
            <span>System Health</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/capabilities"))}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Capabilities Registry</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/status/execution"))}>
            <Server className="mr-2 h-4 w-4" />
            <span>Execution Runtime</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/status/integrations"))}>
            <Network className="mr-2 h-4 w-4" />
            <span>Integrations</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
