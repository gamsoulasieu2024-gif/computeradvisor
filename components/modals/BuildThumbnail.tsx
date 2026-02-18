"use client";

import type { SelectedParts } from "@/lib/store/types";

interface BuildThumbnailProps {
  parts: SelectedParts;
  className?: string;
}

export function BuildThumbnail({ parts, className = "" }: BuildThumbnailProps) {
  const items: string[] = [];
  if (parts.cpu) items.push(parts.cpu.name ?? "CPU");
  if (parts.gpu) items.push(parts.gpu.name ?? "GPU");
  if (parts.motherboard) items.push(parts.motherboard.name ?? "MB");
  if (parts.ram) items.push(parts.ram.name ?? "RAM");
  if (parts.storage?.length) {
    const s = parts.storage[0];
    items.push(s?.name ?? "Storage");
  }
  if (parts.psu) items.push(parts.psu.name ?? "PSU");
  if (parts.cooler) items.push(parts.cooler.name ?? "Cooler");
  if (parts.case) items.push(parts.case.name ?? "Case");

  return (
    <div
      className={`flex flex-wrap gap-1 rounded border border-zinc-200 bg-zinc-100/50 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-800/50 ${className}`}
    >
      {items.slice(0, 4).map((name, i) => (
        <span
          key={i}
          className="truncate rounded bg-white px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          title={name}
          style={{ maxWidth: "5rem" }}
        >
          {name}
        </span>
      ))}
      {items.length > 4 && (
        <span className="text-xs text-zinc-500">+{items.length - 4}</span>
      )}
    </div>
  );
}
