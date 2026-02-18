/**
 * Save/load build logic with optional API persistence
 */

import { nanoid } from "nanoid";
import type { SelectedParts } from "@/lib/store/types";
import type { ManualOverrides } from "@/lib/store/types";
import type { BuildPreset } from "@/lib/store/types";
import type { PersistedBuild } from "./storage";
import {
  saveToLocal,
  loadFromLocal,
  listLocalBuilds,
  deleteFromLocal,
} from "./storage";

export type { PersistedBuild };

export interface SaveBuildInput {
  name?: string;
  preset: BuildPreset;
  parts: SelectedParts;
  manualOverrides: ManualOverrides;
  /** If true, also POST to /api/builds. Default: false. */
  saveToCloud?: boolean;
}

export interface SaveBuildResult {
  id: string;
  savedLocally: boolean;
  savedToCloud?: boolean;
}

/**
 * Save build: assigns unique ID, stores locally, optionally POSTs to API
 */
export async function saveBuild(input: SaveBuildInput): Promise<SaveBuildResult> {
  const id = nanoid(10);
  const now = new Date().toISOString();

  const build: PersistedBuild = {
    id,
    name: input.name?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    preset: input.preset,
    parts: input.parts,
    manualOverrides: input.manualOverrides,
  };

  saveToLocal(build);

  let savedToCloud = false;
  if (input.saveToCloud) {
    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: build.name, build }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          savedToCloud = true;
          build.id = data.id;
          saveToLocal(build);
        }
      }
    } catch {
      // API optional, continue
    }
  }

  return { id: build.id, savedLocally: true, savedToCloud };
}

/**
 * Update existing build
 */
export async function updateBuild(
  id: string,
  input: Partial<SaveBuildInput>
): Promise<boolean> {
  const existing = loadFromLocal(id);
  if (!existing) return false;

  const build: PersistedBuild = {
    ...existing,
    ...(input.name !== undefined && { name: input.name?.trim() || undefined }),
    ...(input.preset !== undefined && { preset: input.preset }),
    ...(input.parts !== undefined && { parts: input.parts }),
    ...(input.manualOverrides !== undefined && {
      manualOverrides: input.manualOverrides,
    }),
    updatedAt: new Date().toISOString(),
  };

  saveToLocal(build);
  return true;
}

/**
 * Load build by ID (local first, then API fallback)
 */
export async function loadBuild(id: string): Promise<PersistedBuild | null> {
  let build = loadFromLocal(id);
  if (build) return build;

  try {
    const res = await fetch(`/api/builds/${id}`);
    if (res.ok) {
      build = (await res.json()) as PersistedBuild;
      if (build) saveToLocal(build);
      return build;
    }
  } catch {
    // API optional
  }

  return null;
}

/**
 * List all saved builds
 */
export function listBuilds(): PersistedBuild[] {
  return listLocalBuilds();
}

/**
 * Delete build
 */
export function deleteBuild(id: string): void {
  deleteFromLocal(id);
}
