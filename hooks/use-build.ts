"use client";

import { useBuildStore } from "@/lib/store/build-store";
import { useCallback } from "react";
import type { PartCategory, PartByCategory } from "@/lib/store/types";

/**
 * Custom hook for build store access with optional selectors.
 * Wraps Zustand store with convenient access patterns.
 */
export function useBuild() {

  // State
  const selectedParts = useBuildStore((s) => s.selectedParts);
  const buildId = useBuildStore((s) => s.buildId);
  const preset = useBuildStore((s) => s.preset);
  const manualOverrides = useBuildStore((s) => s.manualOverrides);
  const isDirty = useBuildStore((s) => s.isDirty ?? false);

  // Computed (re-evaluated when selectedParts changes)
  const estimatedLoad = useBuildStore((s) => s.getEstimatedLoad());
  const allSelectedParts = useBuildStore((s) => s.getAllSelectedParts());

  // Actions
  const setPreset = useBuildStore((s) => s.setPreset);
  const addPart = useBuildStore((s) => s.addPart);
  const removePart = useBuildStore((s) => s.removePart);
  const updateManualOverride = useBuildStore((s) => s.updateManualOverride);
  const clearBuild = useBuildStore((s) => s.clearBuild);
  const loadBuild = useBuildStore((s) => s.loadBuild);
  const exportBuild = useBuildStore((s) => s.exportBuild);
  const importBuild = useBuildStore((s) => s.importBuild);

  // Type-safe add part wrapper
  const addPartTyped = useCallback(
    <K extends PartCategory>(category: K, part: PartByCategory[K], index?: number) => {
      addPart(category, part, index);
    },
    [addPart]
  );

  return {
    // State
    selectedParts,
    buildId,
    preset,
    manualOverrides,
    isDirty,

    // Computed
    estimatedLoad,
    allSelectedParts,

    // Actions
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

/**
 * Selector hook - use only a subset of the build state to avoid re-renders.
 */
export function useBuildPart<K extends PartCategory>(category: K) {
  return useBuildStore((s) => s.selectedParts[category]);
}

/**
 * Selector hook for preset only.
 */
export function useBuildPreset() {
  return useBuildStore((s) => s.preset);
}

/**
 * Selector hook for estimated power load only.
 */
export function useEstimatedLoad() {
  return useBuildStore((s) => s.getEstimatedLoad());
}
