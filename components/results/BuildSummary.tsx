"use client";

import { useState } from "react";
import {
  Cpu,
  Gpu,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  Zap,
  Fan,
  Box,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectedParts } from "@/lib/store/types";
import type { PCComponent } from "@/lib/store/types";

const CATEGORIES = [
  { key: "cpu" as const, label: "CPU", icon: Cpu },
  { key: "gpu" as const, label: "GPU", icon: Gpu },
  { key: "motherboard" as const, label: "Motherboard", icon: CircuitBoard },
  { key: "ram" as const, label: "RAM", icon: MemoryStick },
  { key: "storage" as const, label: "Storage", icon: HardDrive },
  { key: "psu" as const, label: "PSU", icon: Zap },
  { key: "cooler" as const, label: "Cooler", icon: Fan },
  { key: "case" as const, label: "Case", icon: Box },
];

function formatSpecs(part: PCComponent): string {
  if (!("specs" in part) || !part.specs) return "";
  const s = part.specs as Record<string, unknown>;
  const parts: string[] = [];
  if (s.socket) parts.push(`Socket: ${s.socket}`);
  if (s.tier) parts.push(`Tier ${s.tier}`);
  if (s.tdp_w) parts.push(`${s.tdp_w}W TDP`);
  if (s.wattage_w) parts.push(`${s.wattage_w}W`);
  if (s.capacity_gb) parts.push(`${s.capacity_gb}GB`);
  if (s.speed_mhz) parts.push(`${s.speed_mhz}MHz`);
  if (s.length_mm) parts.push(`${s.length_mm}mm`);
  return parts.join(" · ");
}

interface BuildSummaryProps {
  selectedParts: SelectedParts;
}

export function BuildSummary({ selectedParts }: BuildSummaryProps) {
  const [expanded, setExpanded] = useState(true);

  const items: { key: string; label: string; icon: typeof Cpu; part: PCComponent }[] = [];
  for (const { key, label, icon: Icon } of CATEGORIES) {
    if (key === "storage") {
      const arr = selectedParts.storage ?? [];
      arr.forEach((part, i) => {
        items.push({
          key: `${key}-${i}`,
          label: `${label} ${arr.length > 1 ? `#${i + 1}` : ""}`,
          icon: Icon,
          part,
        });
      });
    } else {
      const part = selectedParts[key];
      if (part) items.push({ key, label, icon: Icon, part });
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <h2 className="text-lg font-semibold">Build Summary</h2>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-zinc-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-zinc-500" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-zinc-200 px-4 pb-4 pt-2 dark:border-zinc-800">
          <ul className="space-y-2">
            {items.map(({ key, label, icon: Icon, part }) => (
              <li
                key={key}
                className="flex items-start gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{part.name}</p>
                  <p className="text-xs text-zinc-500">
                    {(part as { manufacturer?: string }).manufacturer}
                    {formatSpecs(part) && ` · ${formatSpecs(part)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
