/**
 * Saved builds storage for the build dashboard (name, favorite, tags, etc.)
 * Uses a separate key from persistence "pc-builds" so it coexists with existing saves.
 */

import type { BuildMetadata } from "@/types/build";
import type {
  SelectedParts,
  BuildPreset,
  ManualOverrides,
} from "@/lib/store/types";

export interface SavedBuild {
  parts: SelectedParts;
  preset: BuildPreset;
  manualOverrides?: ManualOverrides;
  targetId?: string;
  metadata: BuildMetadata;
}

const STORAGE_KEY = "saved-builds";

function generateBuildId(): string {
  return `build-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Get all saved builds from localStorage
 */
export function getSavedBuilds(): SavedBuild[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as SavedBuild[];
    return Array.isArray(parsed)
      ? parsed.sort(
          (a, b) =>
            new Date(b.metadata.updatedAt).getTime() -
            new Date(a.metadata.updatedAt).getTime()
        )
      : [];
  } catch (err) {
    console.error("Failed to load saved builds:", err);
    return [];
  }
}

/**
 * Get a single build by id
 */
export function getSavedBuildById(buildId: string): SavedBuild | null {
  return getSavedBuilds().find((b) => b.metadata.id === buildId) ?? null;
}

/**
 * Save a new build with metadata
 */
export function saveBuild(
  build: {
    parts: SelectedParts;
    preset: BuildPreset;
    manualOverrides?: ManualOverrides;
    targetId?: string;
  },
  name: string,
  description?: string
): SavedBuild {
  const builds = getSavedBuilds();
  const savedBuild: SavedBuild = {
    ...build,
    manualOverrides: build.manualOverrides ?? {},
    metadata: {
      id: generateBuildId(),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: build.preset ? [build.preset] : [],
      isFavorite: false,
    },
  };
  builds.push(savedBuild);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  return savedBuild;
}

/**
 * Update existing build (parts/preset) and bump updatedAt
 */
export function updateBuild(
  buildId: string,
  updates: Partial<Pick<SavedBuild, "parts" | "preset" | "manualOverrides" | "targetId">>
): void {
  const builds = getSavedBuilds();
  const index = builds.findIndex((b) => b.metadata.id === buildId);
  if (index === -1) return;
  builds[index] = {
    ...builds[index],
    ...updates,
    metadata: {
      ...builds[index].metadata,
      updatedAt: new Date().toISOString(),
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

/**
 * Update build metadata (name, description, tags)
 */
export function updateBuildMetadata(
  buildId: string,
  updates: Partial<Pick<BuildMetadata, "name" | "description" | "tags">>
): void {
  const builds = getSavedBuilds();
  const index = builds.findIndex((b) => b.metadata.id === buildId);
  if (index === -1) return;
  builds[index].metadata = {
    ...builds[index].metadata,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

/**
 * Delete a build
 */
export function deleteBuild(buildId: string): void {
  const builds = getSavedBuilds().filter((b) => b.metadata.id !== buildId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

/**
 * Duplicate a build (new id and name)
 */
export function duplicateBuild(buildId: string): SavedBuild | null {
  const builds = getSavedBuilds();
  const original = builds.find((b) => b.metadata.id === buildId);
  if (!original) return null;
  const duplicate: SavedBuild = {
    ...original,
    metadata: {
      ...original.metadata,
      id: generateBuildId(),
      name: `${original.metadata.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  builds.push(duplicate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  return duplicate;
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(buildId: string): void {
  const builds = getSavedBuilds();
  const index = builds.findIndex((b) => b.metadata.id === buildId);
  if (index === -1) return;
  builds[index].metadata.isFavorite = !builds[index].metadata.isFavorite;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
}

/**
 * Export build as JSON string
 */
export function exportBuild(buildId: string): string | null {
  const build = getSavedBuildById(buildId);
  if (!build) return null;
  return JSON.stringify(build, null, 2);
}

/**
 * Import build from JSON string; assigns new id and timestamps
 */
export function importBuild(jsonString: string): SavedBuild | null {
  try {
    const parsed = JSON.parse(jsonString) as unknown;
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid build format");
    const build = parsed as Record<string, unknown>;
    if (!build.parts || !build.preset || !build.metadata) {
      throw new Error("Invalid build format");
    }
    const saved: SavedBuild = {
      parts: build.parts as SelectedParts,
      preset: build.preset as BuildPreset,
      manualOverrides: (build.manualOverrides as ManualOverrides) ?? {},
      targetId: build.targetId as string | undefined,
      metadata: {
        ...(build.metadata as BuildMetadata),
        id: generateBuildId(),
        name: String((build.metadata as BuildMetadata).name || "Imported Build"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    const builds = getSavedBuilds();
    builds.push(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
    return saved;
  } catch (err) {
    console.error("Failed to import build:", err);
    return null;
  }
}
