"use client";

import { useBuild } from "@/hooks/use-build";
import { cn } from "@/lib/utils";
import type { BuildPreset } from "@/lib/store/types";
import { Gamepad2, Palette, Volume2, Box, Wallet, Wrench } from "lucide-react";

const PRESETS: { id: BuildPreset; label: string; icon: React.ElementType }[] = [
  { id: "gaming-1080p", label: "Gaming 1080p", icon: Gamepad2 },
  { id: "gaming-1440p", label: "Gaming 1440p", icon: Gamepad2 },
  { id: "gaming-4k", label: "Gaming 4K", icon: Gamepad2 },
  { id: "creator", label: "Creator", icon: Palette },
  { id: "quiet", label: "Quiet", icon: Volume2 },
  { id: "sff", label: "SFF", icon: Box },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "custom", label: "Custom", icon: Wrench },
];

export function PresetSelector() {
  const { preset, setPreset } = useBuild();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">Use Case</h3>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPreset(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              preset === id
                ? "border-foreground bg-foreground/10 text-foreground"
                : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            )}
            tabIndex={0}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
