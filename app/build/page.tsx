"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useBuild } from "@/hooks/use-build";
import { PresetSelector } from "@/components/builder/PresetSelector";
import { ComponentCard } from "@/components/builder/ComponentCard";
import { LiveStatus } from "@/components/builder/LiveStatus";
import { PartSearch } from "@/components/builder/PartSearch";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { checkCompatibility } from "@/lib/compatibility";
import { filterByPreset } from "@/lib/presets/recommendations";
import { X } from "lucide-react";
import type { PartCategory } from "@/lib/store/types";
import type { CPU, GPU, Motherboard, RAM, Storage, PSU, Cooler, Case } from "@/types/components";

type Catalog = {
  cpus: CPU[];
  gpus: GPU[];
  motherboards: Motherboard[];
  ram: RAM[];
  storage: Storage[];
  psus: PSU[];
  coolers: Cooler[];
  cases: Case[];
};

const CATEGORIES: PartCategory[] = [
  "case",
  "cpu",
  "motherboard",
  "gpu",
  "ram",
  "storage",
  "psu",
  "cooler",
];

export default function BuildPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { selectedParts, preset, setPreset, removePart, addPart } = useBuild();
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [searchCategory, setSearchCategory] = useState<PartCategory | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  // Fix hydration by only rendering after mount
  useEffect(() => {
    setMounted(true);
    // Set initial preset selector state after mount when we know the actual preset value
    setShowPresetSelector(!preset || preset === "custom");
  }, [preset]);

  // Load catalog
  useEffect(() => {
    fetch("/api/parts")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(console.error);
  }, []);

  // Run compatibility check
  const compatResult = useMemo(() => {
    return checkCompatibility({
      cpu: selectedParts.cpu,
      gpu: selectedParts.gpu,
      motherboard: selectedParts.motherboard,
      ram: selectedParts.ram,
      storage: selectedParts.storage ?? [],
      psu: selectedParts.psu,
      cooler: selectedParts.cooler,
      case: selectedParts.case,
    });
  }, [selectedParts]);

  // Collect all issues for ComponentCard
  const allIssues = useMemo(() => {
    return [
      ...compatResult.hardFails.map((i) => ({ ...i, severity: "critical" as const })),
      ...compatResult.warnings.map((i) => ({ ...i, severity: "warning" as const })),
      ...compatResult.notes.map((i) => ({ ...i, severity: "info" as const })),
    ];
  }, [compatResult]);

  // Check if enough parts selected to view results (at least CPU, GPU, Mobo, PSU, Case)
  const canViewResults = !!(
    selectedParts.cpu &&
    selectedParts.motherboard &&
    selectedParts.psu &&
    selectedParts.case
  );

  const handleViewResults = () => {
    router.push("/results/current");
  };

  const formatPresetName = (presetName: string) => {
    return presetName
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getParts = useCallback(
    (cat: PartCategory): { id: string; name: string; manufacturer: string }[] => {
      if (!catalog) return [];
      const key =
        cat === "motherboard" ? "motherboards" : cat === "storage" ? "storage" : `${cat}s`;
      const raw = ((catalog as Record<string, unknown[]>)[key] ?? []) as {
        id: string;
        name: string;
        manufacturer: string;
      }[];
      const partType = cat as "cpu" | "gpu" | "motherboard" | "ram" | "storage" | "psu" | "cooler" | "case";
      return filterByPreset(preset, partType, raw) as {
        id: string;
        name: string;
        manufacturer: string;
      }[];
    },
    [catalog, preset]
  );

  const renderPartPreview = (part: { name: string; manufacturer?: string; specs?: Record<string, unknown> }) => (
    <div className="text-sm">
      <p className="font-medium">{part.name}</p>
      {part.manufacturer && (
        <p className="text-zinc-500">{part.manufacturer}</p>
      )}
    </div>
  );

  // Show loading state during SSR/hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Build Your PC</h1>
            <p className="text-sm text-muted-foreground">
              {preset && preset !== "custom"
                ? `Preset: ${formatPresetName(preset)}`
                : "Custom Build"}
            </p>
          </div>
          <Button
            onClick={() => setShowPresetSelector(true)}
            variant="outline"
          >
            Change Preset
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Live Status */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <LiveStatus />
            </div>
          </div>

          {/* Main Content - Component Cards */}
          <div className="lg:col-span-3 space-y-4">
            {/* Preset Selector Modal */}
            {showPresetSelector && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="relative w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Select Build Preset</h2>
                    <button
                      type="button"
                      onClick={() => setShowPresetSelector(false)}
                      className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <PresetSelector />
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => setShowPresetSelector(false)}
                      variant="primary"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Component Selection Cards */}
            {CATEGORIES.map((category) => {
              const part =
                category === "storage"
                  ? selectedParts.storage?.[0]
                  : selectedParts[category];
              return (
                <ComponentCard
                  key={category}
                  category={category}
                  part={part as never}
                  issues={allIssues}
                  onAdd={() => setSearchCategory(category)}
                  onRemove={() => {
                    if (category === "storage")
                      removePart("storage", (selectedParts.storage?.length ?? 0) > 1 ? 0 : undefined);
                    else removePart(category);
                  }}
                  onFixIssue={() => setSearchCategory(category)}
                  storageCount={
                    category === "storage" ? (selectedParts.storage?.length ?? 0) : undefined
                  }
                />
              );
            })}

            {/* View Results Button */}
            <div className="pt-6 border-t border-border">
              <Button
                onClick={handleViewResults}
                disabled={!canViewResults}
                className="w-full"
                size="lg"
              >
                {canViewResults
                  ? "View Results & Scores"
                  : "Select core components to continue (CPU, Motherboard, PSU, Case)"}
              </Button>
              {!canViewResults && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Required: CPU, Motherboard, PSU, Case
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Part Search Modal */}
      {searchCategory && catalog && (
        <PartSearch
          category={searchCategory}
          parts={getParts(searchCategory)}
          isOpen={true}
          onClose={() => setSearchCategory(null)}
          onSelect={(p: unknown) => {
            addPart(searchCategory, p as never);
            setSearchCategory(null);
          }}
          renderPartCard={(p) => renderPartPreview(p as { name: string; manufacturer?: string; specs?: Record<string, unknown> })}
          getPartName={(p) => (p as { name: string }).name}
        />
      )}
    </div>
  );
}
# Force rebuild
