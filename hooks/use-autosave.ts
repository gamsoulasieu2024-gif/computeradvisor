"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { saveAutosave } from "@/lib/persistence/storage";
import type { BuildPreset } from "@/lib/store/types";
import type { SelectedParts } from "@/lib/store/types";
import type { ManualOverrides } from "@/lib/store/types";

const DEBOUNCE_MS = 30000; // 30 seconds

export function useAutosave(
  parts: SelectedParts,
  preset: BuildPreset,
  manualOverrides: ManualOverrides
) {
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedRef = useRef<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapshot = useCallback(() => {
    return JSON.stringify({ parts, preset, manualOverrides });
  }, [parts, preset, manualOverrides]);

  useEffect(() => {
    const current = snapshot();
    if (current === lastSavedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      saveAutosave({
        preset,
        parts,
        manualOverrides,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      lastSavedRef.current = current;
      setIsSaving(false);
      timeoutRef.current = null;
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [snapshot, parts, preset, manualOverrides]);

  return { isSaving };
}
