"use client";

import { useBuild } from "@/hooks/use-build";
import { cn } from "@/lib/utils";
import { getPresetDefinition } from "@/lib/presets/definitions";
import type { BuildPreset } from "@/lib/store/types";
import {
  Gamepad2,
  Palette,
  Volume2,
  Box,
  Wallet,
  Wrench,
  Monitor,
} from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  Gamepad2,
  Palette,
  Volume2,
  Box,
  Wallet,
  Wrench,
};

function formatSpecs(specs: Record<string, unknown>): string[] {
  const lines: string[] = [];
  if (specs.cpuTierMin != null) lines.push(`CPU tier ${specs.cpuTierMin}+`);
  if (specs.gpuTierMin != null) lines.push(`GPU tier ${specs.gpuTierMin}+`);
  if (specs.ramGbMin != null) lines.push(`${specs.ramGbMin}GB+ RAM`);
  if (specs.storageGbMin != null) lines.push(`${specs.storageGbMin}GB+ storage`);
  const ff = specs.formFactors as unknown[] | undefined;
  if (Array.isArray(ff) && ff.length) lines.push(`Form: ${ff.join(", ")}`);
  if (specs.maxGpuLengthMm != null) lines.push(`GPU <${specs.maxGpuLengthMm}mm`);
  return lines;
}

interface PresetCardProps {
  presetId: BuildPreset;
}

export function PresetCard({ presetId }: PresetCardProps) {
  const { preset, setPreset } = useBuild();
  const def = getPresetDefinition(presetId);
  const Icon = ICONS[def.icon] ?? Wrench;
  const isSelected = preset === presetId;

  return (
    <button
      type="button"
      onClick={() => setPreset(presetId)}
      className={cn(
        "group relative flex flex-col items-start rounded-xl border p-4 text-left transition-all",
        isSelected
          ? "border-foreground bg-foreground/5 shadow-md dark:bg-foreground/10"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
      )}
      tabIndex={0}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "rounded-lg p-2 transition-colors",
            isSelected ? "bg-foreground/15" : "bg-zinc-100 dark:bg-zinc-800"
          )}
        >
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{def.name}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {def.description}
          </p>
        </div>
      </div>
      {def.targetResolution && (
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
          <Monitor className="h-3.5 w-3.5" />
          {def.targetResolution}
        </div>
      )}
      <div
        className={cn(
          "absolute inset-x-4 bottom-4 mt-2 max-h-0 overflow-hidden opacity-0 transition-all group-hover:max-h-32 group-hover:opacity-100",
          isSelected && "max-h-32 opacity-100"
        )}
      >
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Recommended:
        </p>
        <ul className="mt-0.5 space-y-0.5 text-xs text-zinc-600 dark:text-zinc-500">
          {formatSpecs(def.recommendedSpecs as Record<string, unknown>).map(
            (line, i) => (
              <li key={i}>• {line}</li>
            )
          )}
          {formatSpecs(def.recommendedSpecs as Record<string, unknown>).length === 0 && (
            <li>No constraints</li>
          )}
        </ul>
      </div>
    </button>
  );
}
