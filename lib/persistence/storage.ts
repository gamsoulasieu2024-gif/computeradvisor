/**
 * LocalStorage + optional DB abstraction for build persistence
 *
 * LOCALSTORAGE STRUCTURE:
 * - Key "pc-builds": JSON object { [buildId: string]: PersistedBuild }
 * - Key "pc-builds-autosave": JSON PersistedBuild (temp draft, id "__autosave__")
 * Each PersistedBuild: { id, name?, createdAt, updatedAt, preset, parts, manualOverrides }
 */

import type { SelectedParts } from "@/lib/store/types";
import type { ManualOverrides } from "@/lib/store/types";
import type { BuildPreset } from "@/lib/store/types";

export interface PersistedBuild {
  id: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  preset: BuildPreset;
  parts: SelectedParts;
  manualOverrides: ManualOverrides;
  /** Performance target (gaming or creator) */
  targetId?: string;
}

export interface BuildsIndex {
  [id: string]: PersistedBuild;
}

const STORAGE_KEY = "pc-builds";

/** Get all builds from localStorage */
export function getLocalBuilds(): BuildsIndex {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BuildsIndex) : {};
  } catch {
    return {};
  }
}

/** Save builds to localStorage */
export function setLocalBuilds(builds: BuildsIndex): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  } catch (e) {
    console.warn("Failed to save builds to localStorage", e);
  }
}

/** Save a single build to localStorage */
export function saveToLocal(build: PersistedBuild): void {
  const builds = getLocalBuilds();
  builds[build.id] = build;
  setLocalBuilds(builds);
}

/** Load a single build from localStorage */
export function loadFromLocal(id: string): PersistedBuild | null {
  const builds = getLocalBuilds();
  return builds[id] ?? null;
}

/** Delete a build from localStorage */
export function deleteFromLocal(id: string): void {
  const builds = getLocalBuilds();
  delete builds[id];
  setLocalBuilds(builds);
}

const AUTOSAVE_KEY = "pc-builds-autosave";

/** List all saved builds (for Load modal) - excludes temp autosave */
export function listLocalBuilds(): PersistedBuild[] {
  const builds = getLocalBuilds();
  return Object.values(builds)
    .filter((b) => b.id !== "__autosave__")
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

/** Save to temp autosave slot - does not overwrite named saves */
export function saveAutosave(build: Omit<PersistedBuild, "id">): void {
  if (typeof window === "undefined") return;
  const autosave: PersistedBuild = {
    ...build,
    id: "__autosave__",
    name: undefined,
  };
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosave));
  } catch (e) {
    console.warn("Failed to autosave", e);
  }
}

/** Load from temp autosave slot */
export function loadAutosave(): PersistedBuild | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? (JSON.parse(raw) as PersistedBuild) : null;
  } catch {
    return null;
  }
}
