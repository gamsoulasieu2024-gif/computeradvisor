"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useBuild } from "@/hooks/use-build";
import { checkCompatibility } from "@/lib/compatibility";
import { filterByPreset } from "@/lib/presets/recommendations";
import { PresetCard } from "./PresetCard";
import { PresetSelector } from "./PresetSelector";
import { ProgressIndicator } from "./ProgressIndicator";
import { LiveStatus } from "./LiveStatus";
import { ComponentCard } from "./ComponentCard";
import { PartSearch } from "./PartSearch";
import { ManualEntry } from "./ManualEntry";
import { SaveBuildModal } from "@/components/modals/SaveBuildModal";
import { LoadBuildModal } from "@/components/modals/LoadBuildModal";
import { ExportModal } from "@/components/export/ExportModal";
import { useAutosave } from "@/hooks/use-autosave";
import { Button } from "@/components/ui/Button";
import { Save, FolderOpen, Download } from "lucide-react";
import { PRESET_DEFINITIONS } from "@/lib/presets/definitions";
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

export function BuildPageClient() {
  const router = useRouter();
  const {
    selectedParts,
    preset,
    manualOverrides,
    isDirty,
    addPart,
    removePart,
    importBuild,
  } = useBuild();
  const { isSaving } = useAutosave(
    selectedParts,
    preset,
    manualOverrides ?? {}
  );
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [searchCategory, setSearchCategory] = useState<PartCategory | null>(null);
  const [manualCategory, setManualCategory] = useState<PartCategory | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          setShowSaveModal(true);
        }
        if (e.key === "k") {
          e.preventDefault();
          setSearchCategory((prev) => (prev ? null : "cpu"));
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    fetch("/api/builds")
      .then((r) => setApiAvailable(r.ok))
      .catch(() => setApiAvailable(false));
  }, []);

  useEffect(() => {
    fetch("/api/parts")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(console.error);
  }, []);

  const compatResult = checkCompatibility({
    cpu: selectedParts.cpu,
    gpu: selectedParts.gpu,
    motherboard: selectedParts.motherboard,
    ram: selectedParts.ram,
    storage: selectedParts.storage ?? [],
    psu: selectedParts.psu,
    cooler: selectedParts.cooler,
    case: selectedParts.case,
  });

  const issues = [
    ...compatResult.hardFails,
    ...compatResult.warnings.map((i) => ({ ...i, severity: "warning" as const })),
    ...compatResult.notes.map((i) => ({ ...i, severity: "info" as const })),
  ];

  const filledCount =
    CATEGORIES.filter((c) => {
      if (c === "storage") return (selectedParts.storage?.length ?? 0) >= 1;
      return selectedParts[c] != null;
    }).length;

  const canViewResults = filledCount >= 6;

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
      return filterByPreset(preset, partType, raw, catalog as never) as {
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
      <p className="text-xs text-zinc-500">
        {part.manufacturer}
        {part.specs && "tier" in part.specs && ` · Tier ${(part.specs as { tier?: number }).tier}`}
      </p>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
      {/* Left sidebar */}
      <aside className="sticky top-24 hidden w-64 shrink-0 space-y-6 lg:block">
        <ProgressIndicator />
        <LiveStatus />
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSaveModal(true)} className="gap-2">
            <Save className="h-4 w-4" />
            Save build
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowLoadModal(true)} className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Load build
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowExportModal(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 space-y-4">
        {/* Preset cards */}
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Use case
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
            {PRESET_DEFINITIONS.map((def) => (
              <PresetCard key={def.id} presetId={def.id} />
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2 lg:hidden">
          <PresetSelector />
          <ProgressIndicator />
          <Button variant="outline" size="sm" onClick={() => setShowSaveModal(true)} className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowLoadModal(true)} className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Load
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowExportModal(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

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
              issues={issues}
              onAdd={() => setSearchCategory(category)}
              onFixIssue={() => setSearchCategory(category)}
              onRemove={() => {
                if (category === "storage")
                  removePart("storage", (selectedParts.storage?.length ?? 0) > 1 ? 0 : undefined);
                else removePart(category);
              }}
              onManualEntry={
                category === "case" ? () => setManualCategory("case") : undefined
              }
              storageCount={
                category === "storage" ? (selectedParts.storage?.length ?? 0) : undefined
              }
            />
          );
        })}

        {/* Bottom bar */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-zinc-200 bg-background py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <p className="text-sm text-zinc-500">
              {filledCount}/8 components selected
            </p>
            {isSaving && (
              <span className="text-xs text-zinc-400">Saving...</span>
            )}
          </div>
          {canViewResults ? (
            <Button as="link" href="/build/results" size="lg">
              View Results
            </Button>
          ) : (
            <Button size="lg" disabled>
              View Results (add more parts)
            </Button>
          )}
        </div>
      </main>

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
          onManualEntry={
            searchCategory === "case"
              ? () => {
                  setSearchCategory(null);
                  setManualCategory("case");
                }
              : undefined
          }
          renderPartCard={(p) => renderPartPreview(p as { name: string; manufacturer?: string; specs?: Record<string, unknown> })}
          getPartName={(p) => (p as { name: string }).name}
        />
      )}

      {/* Manual Entry (Case only for now) */}
      {manualCategory === "case" && (
        <ManualEntry
          category="case"
          isOpen={true}
          onClose={() => setManualCategory(null)}
          onSave={(part) => {
            addPart("case", part);
            setManualCategory(null);
          }}
        />
      )}

      {/* Save / Load modals */}
      <SaveBuildModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        apiAvailable={apiAvailable}
        build={{
          preset,
          parts: selectedParts,
          manualOverrides: manualOverrides ?? {},
        }}
        onSaved={(id) => router.push(`/results/${id}`)}
      />
      <LoadBuildModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        hasUnsavedChanges={isDirty}
        onLoad={(b) => {
          importBuild(
            JSON.stringify({
              buildId: b.id,
              preset: b.preset,
              manualOverrides: b.manualOverrides ?? {},
              selectedParts: { ...b.parts, storage: b.parts.storage ?? [] },
            })
          );
        }}
      />
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        build={{ preset, parts: selectedParts, name: undefined }}
      />
    </div>
  );
}
