"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { searchParts, type SortOption } from "@/lib/utils/search";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { X, Search } from "lucide-react";
import type { PartCategory } from "@/lib/store/types";

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

export function PartSearch<T extends { id: string; name: string; manufacturer: string }>({
  category,
  parts,
  isOpen,
  onClose,
  onSelect,
  onManualEntry,
  renderPartCard,
}: PartSearchProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("name");

  const filtered = useMemo(
    () => searchParts(parts, query, sort),
    [parts, query, sort]
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
    // Use queueMicrotask to make setState async and avoid cascading renders
    queueMicrotask(() => {
      setQuery("");
    });
  }, [isOpen]);

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
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
              }}
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
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((part) => (
              <div
                key={part.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex-1">{renderPartCard(part)}</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelect(part)}
                >
                  Select
                </Button>
              </div>
            ))}
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
