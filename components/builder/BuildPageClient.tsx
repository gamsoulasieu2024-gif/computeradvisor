"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useBuild } from "@/hooks/use-build";
import { PresetCard } from "@/components/builder/PresetCard";
import { PRESET_DEFINITIONS } from "@/lib/presets/definitions";
import { ComponentCard } from "@/components/builder/ComponentCard";
import { LiveStatus } from "@/components/builder/LiveStatus";
import { PartSearch } from "@/components/builder/PartSearch";
import { ManualEntry } from "@/components/builder/ManualEntry";
import { SaveBuildModal } from "@/components/modals/SaveBuildModal";
import { LoadBuildModal } from "@/components/modals/LoadBuildModal";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { checkCompatibility } from "@/lib/compatibility";
import { filterByPreset } from "@/lib/presets/recommendations";
import { X, Save, FolderOpen, Target } from "lucide-react";
import { TargetSelector } from "@/components/builder/TargetSelector";
import { getTargetById } from "@/lib/presets/targets";
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
  "cpu",
  "gpu",
  "motherboard",
  "ram",
  "storage",
  "psu",
  "cooler",
  "case",
];

export default function BuildPageClient() {
  const router = useRouter();
  const { selectedParts, preset, targetId, setPreset, setTargetId, removePart, addPart, manualOverrides, importBuild } = useBuild();
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [searchCategory, setSearchCategory] = useState<PartCategory | null>(null);
  const [manualCategory, setManualCategory] = useState<PartCategory | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  // Set initial preset selector state after mount
  useEffect(() => {
    setShowPresetSelector(!preset || preset === "custom");
  }, [preset]);

  // Keyboard shortcuts: Ctrl+S save, Ctrl+K open part search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "s" && e.key !== "k") return;
      const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (e.key === "s") {
        e.preventDefault();
        if (!showSaveModal && !showLoadModal && !showPresetSelector) setShowSaveModal(true);
      }
      if (e.key === "k") {
        e.preventDefault();
        if (catalog && !searchCategory && !showSaveModal && !showLoadModal && !showPresetSelector) {
          const firstCategory: PartCategory = "cpu";
          setSearchCategory(firstCategory);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [catalog, searchCategory, showSaveModal, showLoadModal, showPresetSelector]);

  // Load catalog
  useEffect(() => {
    fetch("/api/parts")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(console.error);
  }, []);

  // Run compatibility check
  const compatResult = useMemo(() => {
    return checkCompatibility(
      {
        cpu: selectedParts.cpu,
        gpu: selectedParts.gpu,
        motherboard: selectedParts.motherboard,
        ram: selectedParts.ram,
        storage: selectedParts.storage ?? [],
        psu: selectedParts.psu,
        cooler: selectedParts.cooler,
        case: selectedParts.case,
      },
      { preset }
    );
  }, [selectedParts, preset]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Build Your PC</h1>
            <p className="text-sm text-muted-foreground">
              {preset && preset !== "custom"
                ? `Preset: ${formatPresetName(preset)}`
                : "Custom Build"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowLoadModal(true)}
              variant="outline"
              aria-label="Load build"
            >
              <FolderOpen className="h-4 w-4 mr-1.5" />
              Load
            </Button>
            <Button
              onClick={() => setShowSaveModal(true)}
              variant="outline"
              aria-label="Save build (Ctrl+S)"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
            <Button
              onClick={() => setShowPresetSelector(true)}
              variant="outline"
            >
              Change Preset
            </Button>
            <Button
              onClick={() => setShowTargetSelector(true)}
              variant="outline"
              aria-label="Set performance target"
            >
              <Target className="h-4 w-4 mr-1.5" />
              {targetId ? getTargetById(targetId)?.name ?? "Set Target" : "Set Target"}
            </Button>
          </div>
        </div>
      </div>

      <SaveBuildModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        build={{
          preset,
          parts: selectedParts,
          manualOverrides: manualOverrides ?? {},
          targetId,
        }}
      />
      <LoadBuildModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onLoad={(build) => {
          importBuild(
            JSON.stringify({
              buildId: build.id,
              preset: build.preset,
              targetId: build.targetId,
              manualOverrides: build.manualOverrides ?? {},
              selectedParts: build.parts,
            })
          );
          setShowLoadModal(false);
        }}
      />
      <TargetSelector
        isOpen={showTargetSelector}
        onClose={() => setShowTargetSelector(false)}
        onSelect={(id) => setTargetId(id)}
        currentTarget={targetId}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Preset + Live Status (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="text-sm font-medium text-foreground mb-2">Use case</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                  {formatPresetName(preset)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setShowPresetSelector(true)}
                >
                  Change preset
                </Button>
              </div>
              <LiveStatus />
            </div>
          </div>

          {/* Main Content - Component Cards */}
          <div className="lg:col-span-3 space-y-4">
            {/* Preset Selector Modal - grid of PresetCards */}
            {showPresetSelector && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="relative w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Select Build Preset</h2>
                    <button
                      type="button"
                      onClick={() => setShowPresetSelector(false)}
                      className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Choose a preset to filter recommended parts and adjust score weights.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_DEFINITIONS.map((def) => (
                      <PresetCard
                        key={def.id}
                        presetId={def.id}
                        selected={preset === def.id}
                        onSelect={() => {
                          setPreset(def.id);
                          setShowPresetSelector(false);
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => setShowPresetSelector(false)} variant="primary">
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
                  onManualEntry={(category === "case" || category === "cpu") ? () => setManualCategory(category) : undefined}
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
          onManualEntry={(searchCategory === "case" || searchCategory === "cpu") ? () => {
            setSearchCategory(null);
            setManualCategory(searchCategory);
          } : undefined}
          renderPartCard={(p) => renderPartPreview(p as { name: string; manufacturer?: string; specs?: Record<string, unknown> })}
          getPartName={(p) => (p as { name: string }).name}
        />
      )}

      {/* Manual Entry Modal */}
      {manualCategory && (
        <ManualEntry
          category={manualCategory}
          isOpen={true}
          onClose={() => setManualCategory(null)}
          onSave={(part) => {
            addPart(manualCategory, part as never);
            setManualCategory(null);
          }}
        />
      )}
    </div>
  );
}
