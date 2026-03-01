"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { searchParts, type SortOption } from "@/lib/utils/search";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { X, Search, CheckCircle, XCircle, Info } from "lucide-react";
import type { PartCategory } from "@/lib/store/types";
import { useBuild } from "@/hooks/use-build";
import { useCurrency } from "@/hooks/useCurrency";

interface CompatibilityFilters {
  requiredSocket?: string;
  memoryType?: string;
  maxSlots?: number;
  maxLength?: number;
  maxThickness?: number;
  minTdp?: number;
  cpuSocket?: string;
  maxHeight?: number;
}

interface PartSearchProps<T> {
  category: PartCategory;
  parts: T[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (part: T) => void;
  onManualEntry?: () => void;
  renderPartCard: (part: T) => React.ReactNode;
  getPartName: (part: T) => string;
}

export function PartSearch<
  T extends { id: string; name: string; manufacturer: string }
>({
  category,
  parts,
  isOpen,
  onClose,
  onSelect,
  onManualEntry,
  renderPartCard,
}: PartSearchProps<T>) {
  const { selectedParts } = useBuild();
  const { format: formatPrice } = useCurrency();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("name");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Derive simple compatibility requirements from the current build
  const compatibilityFilters = useMemo((): CompatibilityFilters => {
    const filters: CompatibilityFilters = {};

    if (category === "motherboard" && selectedParts.cpu) {
      filters.requiredSocket = selectedParts.cpu.specs?.socket;
      filters.memoryType = selectedParts.cpu.specs?.memory_type;
    }

    if (category === "cpu" && selectedParts.motherboard) {
      filters.requiredSocket = selectedParts.motherboard.specs?.socket;
    }

    if (category === "ram" && selectedParts.motherboard) {
      filters.memoryType = selectedParts.motherboard.specs?.memory_type;
      filters.maxSlots = selectedParts.motherboard.specs?.ram_slots;
    }

    if (category === "gpu" && selectedParts.case) {
      filters.maxLength = selectedParts.case.specs?.max_gpu_length_mm;
      filters.maxThickness = selectedParts.case.specs?.max_gpu_thickness_slots;
    }

    if (category === "cooler" && selectedParts.cpu) {
      filters.minTdp = selectedParts.cpu.specs?.tdp_w;
      filters.cpuSocket = selectedParts.cpu.specs?.socket;
    }

    if (category === "cooler" && selectedParts.case) {
      filters.maxHeight = selectedParts.case.specs?.max_cooler_height_mm;
    }

    return filters;
  }, [category, selectedParts]);

  const checkCompatibility = useCallback(
    (part: T): { compatible: boolean; reason?: string } => {
      const p: any = part;

      if (category === "motherboard" && compatibilityFilters.requiredSocket) {
        if (p.specs?.socket !== compatibilityFilters.requiredSocket) {
          return {
            compatible: false,
            reason: `Requires ${String(compatibilityFilters.requiredSocket)} socket`,
          };
        }
      }

      if (category === "motherboard" && compatibilityFilters.memoryType) {
        if (p.specs?.memory_type !== compatibilityFilters.memoryType) {
          return {
            compatible: false,
            reason: `Requires ${String(
              compatibilityFilters.memoryType
            ).toUpperCase()}`,
          };
        }
      }

      if (category === "cpu" && compatibilityFilters.requiredSocket) {
        if (p.specs?.socket !== compatibilityFilters.requiredSocket) {
          return {
            compatible: false,
            reason: `Requires ${String(compatibilityFilters.requiredSocket)} socket`,
          };
        }
      }

      if (category === "ram" && compatibilityFilters.memoryType) {
        if (p.specs?.memory_type !== compatibilityFilters.memoryType) {
          return {
            compatible: false,
            reason: `Requires ${String(
              compatibilityFilters.memoryType
            ).toUpperCase()}`,
          };
        }
      }

      if (category === "gpu") {
        if (
          compatibilityFilters.maxLength &&
          p.specs?.length_mm > compatibilityFilters.maxLength
        ) {
          return {
            compatible: false,
            reason: `Too long (${p.specs.length_mm}mm > ${compatibilityFilters.maxLength}mm)`,
          };
        }
        if (
          compatibilityFilters.maxThickness &&
          p.specs?.thickness_slots > compatibilityFilters.maxThickness
        ) {
          return {
            compatible: false,
            reason: `Too thick (${p.specs.thickness_slots} slots)`,
          };
        }
      }

      if (category === "cooler") {
        if (
          compatibilityFilters.minTdp &&
          typeof p.specs?.tdp_rating_w === "number" &&
          p.specs.tdp_rating_w < compatibilityFilters.minTdp
        ) {
          return {
            compatible: false,
            reason: `Insufficient cooling (${p.specs.tdp_rating_w}W < ${compatibilityFilters.minTdp}W)`,
          };
        }
        if (
          compatibilityFilters.maxHeight &&
          typeof p.specs?.height_mm === "number" &&
          p.specs.height_mm > compatibilityFilters.maxHeight
        ) {
          return {
            compatible: false,
            reason: `Too tall (${p.specs.height_mm}mm > ${compatibilityFilters.maxHeight}mm)`,
          };
        }
      }

      return { compatible: true };
    },
    [category, compatibilityFilters]
  );

  const baseResults = useMemo(
    () => searchParts(parts, query, sort),
    [parts, query, sort]
  );

  const filtered = useMemo(
    () =>
      baseResults
        .map((part) => ({
          part,
          compatibility: checkCompatibility(part),
        }))
        .sort((a, b) => {
          if (a.compatibility.compatible && !b.compatibility.compatible) return -1;
          if (!a.compatibility.compatible && b.compatibility.compatible) return 1;
          const priceA = (a.part as any).price_usd ?? 0;
          const priceB = (b.part as any).price_usd ?? 0;
          return priceA - priceB;
        }),
    [baseResults, checkCompatibility]
  );

  const handleSelect = useCallback(
    (part: T) => {
      onSelect(part);
      onClose();
    },
    [onSelect, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setQuery("");
      setFocusedIndex(0);
    });
  }, [isOpen]);

  useEffect(() => {
    setFocusedIndex((i) =>
      filtered.length ? Math.min(i, filtered.length - 1) : 0
    );
  }, [filtered.length]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        const { part, compatibility } = filtered[focusedIndex];
        if (compatibility.compatible) {
          handleSelect(part);
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      }
    },
    [filtered, focusedIndex, handleSelect, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="part-search-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 id="part-search-title" className="text-lg font-semibold">
            Select {category}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or brand..."
              className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 text-foreground placeholder:text-zinc-400 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground dark:border-zinc-700 dark:bg-zinc-800"
              tabIndex={0}
              autoFocus
              onKeyDown={onKeyDown}
              aria-label="Search parts"
            />
          </div>
          <div className="flex gap-2">
            {(["name", "price", "tier"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm capitalize",
                  sort === s
                    ? "bg-foreground text-background"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {Object.keys(compatibilityFilters).length > 0 && (
            <div className="mt-1 flex items-start gap-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="font-medium">Filtering for compatibility:</span>
                <div className="mt-1 space-y-0.5">
                  {Boolean(compatibilityFilters.requiredSocket) && (
                    <div>Socket: {compatibilityFilters.requiredSocket}</div>
                  )}
                  {Boolean(compatibilityFilters.memoryType) && (
                    <div>
                      Memory:{" "}
                      {compatibilityFilters.memoryType!.toUpperCase()}
                    </div>
                  )}
                  {Boolean(compatibilityFilters.maxLength) && (
                    <div>
                      Max GPU length: {compatibilityFilters.maxLength}mm
                    </div>
                  )}
                  {Boolean(compatibilityFilters.maxHeight) && (
                    <div>
                      Max cooler height: {compatibilityFilters.maxHeight}mm
                    </div>
                  )}
                  {Boolean(compatibilityFilters.minTdp) && (
                    <div>
                      CPU TDP: {compatibilityFilters.minTdp}W
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(({ part, compatibility }, i) => {
              const p: any = part;
              const isCompatible = compatibility.compatible;

              return (
                <div
                  key={part.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-3 dark:border-zinc-800",
                    i === focusedIndex
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-zinc-200",
                    !isCompatible &&
                      "cursor-not-allowed bg-zinc-100/60 opacity-60 dark:bg-zinc-900/40"
                  )}
                  onFocus={() => setFocusedIndex(i)}
                  tabIndex={0}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isCompatible ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {p.name}
                      </div>
                      {p.manufacturer && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {p.manufacturer}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {category === "motherboard" && (
                          <>
                            {p.specs?.socket && (
                              <Badge variant="outline" className="text-xs">
                                {p.specs.socket}
                              </Badge>
                            )}
                            {p.specs?.memory_type && (
                              <Badge variant="outline" className="text-xs">
                                {String(p.specs.memory_type).toUpperCase()}
                              </Badge>
                            )}
                          </>
                        )}
                        {category === "cpu" && (
                          <>
                            {p.specs?.socket && (
                              <Badge variant="outline" className="text-xs">
                                {p.specs.socket}
                              </Badge>
                            )}
                            {typeof p.specs?.cores === "number" &&
                              typeof p.specs?.threads === "number" && (
                                <Badge variant="outline" className="text-xs">
                                  {p.specs.cores}C/{p.specs.threads}T
                                </Badge>
                              )}
                          </>
                        )}
                        {category === "ram" && (
                          <>
                            {p.specs?.memory_type && (
                              <Badge variant="outline" className="text-xs">
                                {String(p.specs.memory_type).toUpperCase()}
                              </Badge>
                            )}
                            {typeof p.specs?.capacity_gb === "number" && (
                              <Badge variant="outline" className="text-xs">
                                {p.specs.capacity_gb}GB
                              </Badge>
                            )}
                            {typeof p.specs?.speed_mhz === "number" && (
                              <Badge variant="outline" className="text-xs">
                                {p.specs.speed_mhz}MHz
                              </Badge>
                            )}
                            {p.specs?.is_ecc && (
                              <Badge variant="success" className="text-xs">
                                ECC
                              </Badge>
                            )}
                          </>
                        )}
                      </div>

                      {!isCompatible && compatibility.reason && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                          ⚠ {compatibility.reason}
                        </div>
                      )}
                    </div>
                    {typeof p.price_usd === "number" && (
                      <div className="ml-2 text-right">
                        <div className="font-semibold text-foreground">
                          {formatPrice(p.price_usd)}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => isCompatible && handleSelect(part)}
                    disabled={!isCompatible}
                  >
                    {isCompatible ? "Select" : "Incompatible"}
                  </Button>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-zinc-500">
              No parts found. Try a different search.
            </p>
          )}
        </div>

        {onManualEntry && (
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onManualEntry}
              className="text-sm text-zinc-500 hover:text-foreground dark:hover:text-zinc-400"
            >
              Enter manually instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
