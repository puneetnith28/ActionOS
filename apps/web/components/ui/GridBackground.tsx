import { cn } from "@/lib/utils";
import React from "react";

export function GridBackground({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative w-full bg-[#0c0c0e] dark:bg-black overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
          // Since Tracely is explicitly dark, we enforce a dark grid pattern here to match.
          "[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />
      {/* Radial gradient for the container to give a faded look */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0c0c0e] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)] dark:bg-black"></div>
      <div className="relative z-20 h-full w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
