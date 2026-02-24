"use client";

import { useState } from "react";
import { GAME_TARGETS, CREATOR_TARGETS } from "@/lib/presets/targets";
import { Badge } from "@/components/ui/Badge";
import { Monitor, Palette, X } from "lucide-react";

interface TargetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (targetId: string) => void;
  currentTarget?: string;
}

export function TargetSelector({
  isOpen,
  onClose,
  onSelect,
  currentTarget,
}: TargetSelectorProps) {
  const [category, setCategory] = useState<"gaming" | "creator">("gaming");

  if (!isOpen) return null;

  const targets = category === "gaming" ? GAME_TARGETS : CREATOR_TARGETS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-foreground">
            Select Your Target
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setCategory("gaming")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              category === "gaming"
                ? "border-b-2 border-foreground text-foreground"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            <Monitor className="mr-2 inline h-5 w-5" />
            Gaming
          </button>
          <button
            type="button"
            onClick={() => setCategory("creator")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              category === "creator"
                ? "border-b-2 border-foreground text-foreground"
                : "text-zinc-500 hover:text-foreground"
            }`}
          >
            <Palette className="mr-2 inline h-5 w-5" />
            Creator
          </button>
        </div>

        {/* Targets Grid */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="grid gap-3">
            {targets.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => {
                  onSelect(target.id);
                  onClose();
                }}
                className={`rounded-lg border-2 p-4 text-left transition-all hover:border-foreground/50 ${
                  currentTarget === target.id
                    ? "border-foreground bg-foreground/10"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-foreground">{target.name}</h3>
                  {currentTarget === target.id && (
                    <Badge variant="success">Current</Badge>
                  )}
                </div>
                <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {target.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {"resolution" in target && (
                    <>
                      <Badge variant="outline">{target.resolution}</Badge>
                      <Badge variant="outline">{target.refreshRate}Hz</Badge>
                      <Badge variant="outline">
                        Min GPU: Tier {target.minGpuTier}
                      </Badge>
                      <Badge variant="outline">
                        Min CPU: Tier {target.minCpuTier}
                      </Badge>
                    </>
                  )}
                  {"primaryApps" in target && (
                    <>
                      {target.primaryApps.slice(0, 3).map((app) => (
                        <Badge key={app} variant="outline">
                          {app}
                        </Badge>
                      ))}
                      <Badge variant="outline">{target.ramMin}GB+ RAM</Badge>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
