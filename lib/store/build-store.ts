import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  RAM,
  Storage,
} from "@/types/components";
import type {
  BuildState,
  BuildPreset,
  PartCategory,
  SelectedParts,
  ManualOverrides,
  PartByCategory,
  PCComponent,
} from "./types";

// ============ Initial State ============

const initialState: BuildState & { isDirty: boolean } = {
  selectedParts: {
    cpu: undefined,
    gpu: undefined,
    motherboard: undefined,
    ram: undefined,
    storage: [],
    psu: undefined,
    cooler: undefined,
    case: undefined,
  },
  buildId: null,
  preset: "custom",
  manualOverrides: {},
  isDirty: false,
};

// ============ Power Estimation ============

const MOTHERBOARD_BASE_W = 75;
const RAM_W_PER_8GB = 5;
const STORAGE_W_PER_DRIVE = 10;

function getPartTdp(part: PCComponent): number {
  if ("specs" in part && part.specs && typeof part.specs === "object") {
    const specs = part.specs as Record<string, unknown>;
    if (typeof specs.tdp_w === "number") return specs.tdp_w;
    if (typeof specs.wattage_w === "number") return 0; // PSU doesn't add load
  }
  return 0;
}

function getStoragePower(): number {
  return STORAGE_W_PER_DRIVE;
}

function getRamPower(ram: RAM): number {
  const gb = ram.specs?.capacity_gb ?? 0;
  return Math.ceil(gb / 8) * RAM_W_PER_8GB;
}

function calculateEstimatedLoad(parts: SelectedParts): number {
  let total = MOTHERBOARD_BASE_W;

  if (parts.cpu) total += getPartTdp(parts.cpu);
  if (parts.gpu) total += getPartTdp(parts.gpu);
  if (parts.ram) total += getRamPower(parts.ram);
  if (parts.storage?.length) {
    total += parts.storage.reduce((sum) => sum + getStoragePower(), 0);
  }

  return total;
}

// ============ Store ============

const STORAGE_KEY = "pc-build-advisor-store";
const STORAGE_VERSION = 1;

interface BuildStoreState extends BuildState {
  isDirty: boolean;
  getEstimatedLoad: () => number;
  getAllSelectedParts: () => Array<{ category: PartCategory; part: PCComponent }>;
}

interface BuildStoreActions {
  setPreset: (preset: BuildPreset) => void;
  addPart: <K extends PartCategory>(
    category: K,
    part: PartByCategory[K],
    index?: number
  ) => void;
  removePart: (category: PartCategory, index?: number) => void;
  updateManualOverride: <K extends keyof ManualOverrides>(
    category: K,
    overrides: Partial<NonNullable<ManualOverrides[K]>>
  ) => void;
  clearBuild: () => void;
  loadBuild: (buildId: string) => void;
  exportBuild: () => string;
  importBuild: (json: string) => void;
}

export const useBuildStore = create<BuildStoreState & BuildStoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      getEstimatedLoad: () => calculateEstimatedLoad(get().selectedParts),

      getAllSelectedParts: () => {
        const { selectedParts } = get();
        const result: Array<{ category: PartCategory; part: PCComponent }> = [];
        const categories: PartCategory[] = [
          "cpu",
          "gpu",
          "motherboard",
          "ram",
          "storage",
          "psu",
          "cooler",
          "case",
        ];
        for (const cat of categories) {
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
      },

      setPreset: (preset) => set({ preset, isDirty: true }),

      addPart: (category, part, index) => {
        set((state) => {
          const next = { ...state.selectedParts };
          if (category === "storage") {
            const arr = [...(next.storage ?? [])];
            const storagePart = part as Storage;
            if (typeof index === "number" && index >= 0 && index <= arr.length) {
              arr.splice(index, 0, storagePart);
            } else {
              arr.push(storagePart);
            }
            next.storage = arr;
          } else {
            next[category] = part as never;
          }
          return { selectedParts: next, isDirty: true };
        });
      },

      removePart: (category, index) => {
        set((state) => {
          const next = { ...state.selectedParts };
          if (category === "storage") {
            const arr = [...(next.storage ?? [])];
            if (typeof index === "number" && index >= 0 && index < arr.length) {
              arr.splice(index, 1);
            } else {
              arr.length = 0;
            }
            next.storage = arr;
          } else {
            next[category] = undefined as never;
          }
          return { selectedParts: next, isDirty: true };
        });
      },

      updateManualOverride: (category, overrides) => {
        set((state) => {
          const current = state.manualOverrides[category] ?? {};
          const merged =
            typeof current === "object" && current !== null
              ? { ...current, ...overrides }
              : { ...overrides };
          return {
            manualOverrides: {
              ...state.manualOverrides,
              [category]: merged,
            },
            isDirty: true,
          };
        });
      },

      clearBuild: () =>
        set({
          ...initialState,
          selectedParts: { ...initialState.selectedParts },
        }),

      loadBuild: (buildId) => {
        set({ buildId });
        // Actual load from API/DB would go here; for now we just set buildId
      },

      exportBuild: () => {
        const state = get();
        const payload = {
          buildId: state.buildId,
          preset: state.preset,
          manualOverrides: state.manualOverrides,
          selectedParts: state.selectedParts,
          exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(payload, null, 2);
      },

      importBuild: (json) => {
        try {
          const parsed = JSON.parse(json) as {
            buildId?: string | null;
            preset?: BuildPreset;
            manualOverrides?: ManualOverrides;
            selectedParts?: SelectedParts;
          };
          set({
            buildId: parsed.buildId ?? null,
            preset: parsed.preset ?? "custom",
            manualOverrides: parsed.manualOverrides ?? {},
            selectedParts: parsed.selectedParts ?? initialState.selectedParts,
            isDirty: false,
          });
        } catch {
          throw new Error("Invalid build JSON");
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (s) => ({
        selectedParts: s.selectedParts,
        buildId: s.buildId,
        preset: s.preset,
        manualOverrides: s.manualOverrides,
      }),
    }
  )
);
