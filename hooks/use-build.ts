"use client";

import { useBuildStore } from "@/lib/store/build-store";
import { useMemo, useCallback } from "react";
import type { PartCategory, PartByCategory, PCComponent } from "@/lib/store/types";

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

export function useBuild() {
  // State
  const selectedParts = useBuildStore((s) => s.selectedParts);
  const buildId = useBuildStore((s) => s.buildId);
  const preset = useBuildStore((s) => s.preset);
  const manualOverrides = useBuildStore((s) => s.manualOverrides);
  const isDirty = useBuildStore((s) => s.isDirty ?? false);

  // Actions (stable references)
  const setPreset = useBuildStore((s) => s.setPreset);
  const addPart = useBuildStore((s) => s.addPart);
  const removePart = useBuildStore((s) => s.removePart);
  const updateManualOverride = useBuildStore((s) => s.updateManualOverride);
  const clearBuild = useBuildStore((s) => s.clearBuild);
  const loadBuild = useBuildStore((s) => s.loadBuild);
  const exportBuild = useBuildStore((s) => s.exportBuild);
  const importBuild = useBuildStore((s) => s.importBuild);
  const getEstimatedLoad = useBuildStore((s) => s.getEstimatedLoad);

  // Compute allSelectedParts with useMemo to prevent infinite loops
  const allSelectedParts = useMemo(() => {
    const result: Array<{ category: PartCategory; part: PCComponent }> = [];
    for (const cat of CATEGORIES) {
      const value = selectedParts[cat];
      if (cat === "storage" && Array.isArray(value)) {
        for (const part of value) {
          result.push({ category: "storage", part });
        }
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        result.push({ category: cat, part: value as PCComponent });
      }
    }
    return result;
  }, [selectedParts]);

  // Compute estimated load with useMemo to avoid calling store getter every render
  const estimatedLoad = useMemo(
    () => getEstimatedLoad(),
    [getEstimatedLoad, selectedParts]
  );

  const addPartTyped = useCallback(
    <K extends PartCategory>(category: K, part: PartByCategory[K], index?: number) => {
      addPart(category, part, index);
    },
    [addPart]
  );

  return {
    selectedParts,
    buildId,
    preset,
    manualOverrides,
    isDirty,
    estimatedLoad,
    allSelectedParts,
    setPreset,
    addPart: addPartTyped,
    removePart,
    updateManualOverride,
    clearBuild,
    loadBuild,
    exportBuild,
    importBuild,
  };
}

export function useBuildPart<K extends PartCategory>(category: K) {
  return useBuildStore((s) => s.selectedParts[category]);
}

export function useBuildPreset() {
  return useBuildStore((s) => s.preset);
}

export function useEstimatedLoad() {
  const selectedParts = useBuildStore((s) => s.selectedParts);
  const getEstimatedLoad = useBuildStore((s) => s.getEstimatedLoad);
  return useMemo(() => getEstimatedLoad(), [getEstimatedLoad, selectedParts]);
}
