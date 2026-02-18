"use client";

import { useBuild } from "@/hooks/use-build";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { PartCategory, PartByCategory } from "@/lib/store/types";
import type { PCComponent } from "@/lib/store/types";
import {
  Cpu,
  Gpu,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  Zap,
  Fan,
  Box,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

const CATEGORY_META: Record<
  PartCategory,
  { label: string; icon: React.ElementType; addLabel: string }
> = {
  cpu: { label: "CPU", icon: Cpu, addLabel: "Add CPU" },
  gpu: { label: "GPU", icon: Gpu, addLabel: "Add GPU" },
  motherboard: { label: "Motherboard", icon: CircuitBoard, addLabel: "Add Motherboard" },
  ram: { label: "RAM", icon: MemoryStick, addLabel: "Add RAM" },
  storage: { label: "Storage", icon: HardDrive, addLabel: "Add Storage" },
  psu: { label: "Power Supply", icon: Zap, addLabel: "Add PSU" },
  cooler: { label: "CPU Cooler", icon: Fan, addLabel: "Add Cooler" },
  case: { label: "Case", icon: Box, addLabel: "Add Case" },
};

function getPartStatus(
  category: PartCategory,
  part: PCComponent | undefined,
  issues: { id: string; severity: string }[]
): "ok" | "warning" | "error" {
  if (!part) return "ok";
  const partIssues = issues.filter((i) =>
    "affectedParts" in i && Array.isArray((i as { affectedParts?: string[] }).affectedParts)
      ? (i as { affectedParts: string[] }).affectedParts?.includes(part.id)
      : false
  );
  const hasCritical = partIssues.some((i) => i.severity === "critical");
  const hasWarning = partIssues.some((i) => i.severity === "warning");
  if (hasCritical) return "error";
  if (hasWarning) return "warning";
  return "ok";
}

function formatPartSpecs(category: PartCategory, part: PCComponent): string {
  if ("specs" in part && part.specs) {
    const s = part.specs as Record<string, unknown>;
    if (category === "cpu")
      return `${s.socket} · ${s.cores}C/${s.threads}T · Tier ${s.tier}`;
    if (category === "gpu")
      return `${s.vram_gb}GB · ${s.length_mm}mm · Tier ${s.tier}`;
    if (category === "motherboard")
      return `${s.socket} · ${s.form_factor} · ${s.memory_type}`;
    if (category === "ram")
      return `${s.capacity_gb}GB ${s.memory_type} · ${s.speed_mhz}MHz`;
    if (category === "storage")
      return `${s.capacity_gb}GB ${s.interface}`;
    if (category === "psu")
      return `${s.wattage_w}W · ${s.efficiency}`;
    if (category === "cooler")
      return s.type === "Air" ? `Air · ${s.height_mm}mm` : `AIO · ${s.radiator_size_mm}mm`;
    if (category === "case")
      return `${s.form_factor} · ${s.max_gpu_length_mm}mm GPU`;
  }
  return "";
}

interface ComponentCardProps {
  category: PartCategory;
  part: PartByCategory[PartCategory] | undefined;
  issues: { id: string; severity: string; affectedParts?: string[] }[];
  onAdd: () => void;
  onRemove: () => void;
  onManualEntry?: () => void;
  storageCount?: number;
  onFixIssue?: (category: PartCategory) => void;
}

export function ComponentCard({
  category,
  part,
  issues,
  onAdd,
  onRemove,
  onManualEntry,
  storageCount,
  onFixIssue,
}: ComponentCardProps) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  const status = getPartStatus(category, part as PCComponent | undefined, issues);

  const StatusBadge = () => {
    if (status === "ok")
      return <Badge variant="success">OK</Badge>;
    if (status === "warning")
      return <Badge variant="warning">Warning</Badge>;
    return <Badge variant="error">Error</Badge>;
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50",
        "hover:border-zinc-300 dark:hover:border-zinc-700",
        status === "error" && "border-l-4 border-l-error",
        status === "warning" && "border-l-4 border-l-warning animate-pulse-warning"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
            <Icon className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">{meta.label}</h3>
              {part && <StatusBadge />}
            </div>
            {part ? (
              <>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {(part as { name?: string }).name}
                  {category === "storage" && storageCount != null && storageCount > 1 && (
                    <span className="ml-1 text-zinc-500">({storageCount} drives)</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatPartSpecs(category, part as PCComponent)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                No {meta.label.toLowerCase()} selected
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {part ? (
            <>
              <Button variant="outline" size="sm" onClick={onAdd}>
                Change
              </Button>
              <Button variant="ghost" size="sm" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onAdd}>
              <Plus className="mr-1 h-4 w-4" />
              {meta.addLabel}
            </Button>
          )}
        </div>
      </div>

      {status !== "ok" && part && onFixIssue && (
        <button
          type="button"
          onClick={() => onFixIssue(category)}
          className="mt-2 text-xs font-medium text-foreground/80 hover:text-foreground"
        >
          Fix this →
        </button>
      )}
      {onManualEntry && (
        <button
          type="button"
          onClick={onManualEntry}
          className="mt-3 flex items-center gap-1 text-xs text-zinc-500 hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
          tabIndex={0}
        >
          <Pencil className="h-3.5 w-3.5" />
          Enter manually instead
        </button>
      )}
    </div>
  );
}

