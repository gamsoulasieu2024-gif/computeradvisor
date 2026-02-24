"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { BuildPreset } from "@/lib/store/types";
import { getPresetDefinition } from "@/lib/presets/definitions";
import {
  Gamepad2,
  Palette,
  Volume2,
  Box,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Gamepad2,
  Palette,
  Volume2,
  Box,
  Wallet,
  Wrench,
};

function formatSpecSummary(specs: ReturnType<typeof getPresetDefinition>["recommendedSpecs"]): string[] {
  const lines: string[] = [];
  if (specs.cpuTierMin != null || specs.cpuTierMax != null) {
    const range = [specs.cpuTierMin, specs.cpuTierMax].filter((x) => x != null).join("–");
    lines.push(`CPU tier ${range}`);
  }
  if (specs.gpuTierMin != null || specs.gpuTierMax != null) {
    const range = [specs.gpuTierMin, specs.gpuTierMax].filter((x) => x != null).join("–");
    lines.push(`GPU tier ${range}`);
  }
  if (specs.ramGbMin != null) lines.push(`RAM ${specs.ramGbMin}GB+`);
  if (specs.storageGbMin != null) lines.push(`Storage ${specs.storageGbMin}GB+`);
  if (specs.storageInterface) lines.push(specs.storageInterface);
  if (specs.cpuCoresMin != null) lines.push(`${specs.cpuCoresMin}+ cores`);
  if (specs.formFactors?.length) lines.push(specs.formFactors.join(", "));
  if (specs.maxGpuLengthMm != null) lines.push(`GPU ≤${specs.maxGpuLengthMm}mm`);
  if (specs.maxTdpTarget != null) lines.push(`TDP ≤${specs.maxTdpTarget}W`);
  return lines;
}

interface PresetCardProps {
  presetId: BuildPreset;
  selected: boolean;
  onSelect: () => void;
}

export function PresetCard({ presetId, selected, onSelect }: PresetCardProps) {
  const def = useMemo(() => getPresetDefinition(presetId), [presetId]);
  const Icon = ICON_MAP[def.icon] ?? Wrench;
  const specLines = useMemo(() => formatSpecSummary(def.recommendedSpecs), [def.recommendedSpecs]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all",
        "hover:border-foreground/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2",
        selected
          ? "border-foreground bg-foreground/10 shadow-sm"
          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
      )}
      aria-pressed={selected}
      aria-label={`Select ${def.name}: ${def.description}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "rounded-lg p-2 transition-colors",
            selected ? "bg-foreground/20" : "bg-zinc-100 dark:bg-zinc-800"
          )}
        >
          <Icon className={cn("h-5 w-5", selected ? "text-foreground" : "text-zinc-600 dark:text-zinc-400")} />
        </div>
        <div>
          <p className="font-semibold text-foreground">{def.name}</p>
          {def.targetResolution && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{def.targetResolution}</p>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{def.description}</p>

      {/* Recommended specs - visible on hover */}
      {specLines.length > 0 && (
        <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Recommended</p>
          <ul className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-zinc-600 dark:text-zinc-300">
            {specLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </button>
  );
}
