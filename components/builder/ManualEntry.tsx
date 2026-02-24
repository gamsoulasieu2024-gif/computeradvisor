"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import type { PartCategory } from "@/lib/store/types";
import type { Case, CPU } from "@/types/components";

const FORM_FACTORS = ["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"] as const;
const MAX_PSU_FORM = ["ATX", "SFX", "SFX-L"] as const;

const caseFormSchema = z.object({
  name: z.string().min(1, "Name required"),
  manufacturer: z.string().min(1, "Manufacturer required"),
  form_factor: z.enum(FORM_FACTORS),
  max_gpu_length_mm: z.coerce.number().min(1, "Must be ≥ 1"),
  max_cooler_height_mm: z.coerce.number().min(1, "Must be ≥ 1"),
  max_psu_length_mm: z.union([z.coerce.number().min(1), z.literal(""), z.undefined()]).transform((v) => (v === "" || v === undefined ? undefined : v)),
  drive_bays_2_5: z.coerce.number().int().min(0),
  drive_bays_3_5: z.coerce.number().int().min(0),
  expansion_slots: z.coerce.number().int().min(1),
  max_psu_form_factor: z.enum(MAX_PSU_FORM),
  radiator_sizes: z.string().optional(), // e.g. "240, 360"
});

const cpuFormSchema = z.object({
  name: z.string().min(1, "Name required"),
  manufacturer: z.enum(["Intel", "AMD"]),
  socket: z.string().min(1, "Socket required"),
  tier: z.coerce.number().int().min(1).max(10),
  cores: z.coerce.number().int().min(1),
  threads: z.coerce.number().int().min(1),
  tdp_w: z.coerce.number().min(0),
  max_mem_speed_mhz: z.coerce.number().min(1600),
  memory_type: z.enum(["DDR4", "DDR5"]),
});

type CaseFormValues = z.infer<typeof caseFormSchema>;
type CpuFormValues = z.infer<typeof cpuFormSchema>;

interface ManualEntryProps {
  category: PartCategory;
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: Case | CPU) => void;
}

export function ManualEntry({ category, isOpen, onClose, onSave }: ManualEntryProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [caseForm, setCaseForm] = useState<CaseFormValues>({
    name: "",
    manufacturer: "",
    form_factor: "ATX",
    max_gpu_length_mm: 350,
    max_cooler_height_mm: 160,
    max_psu_length_mm: undefined,
    drive_bays_2_5: 2,
    drive_bays_3_5: 2,
    expansion_slots: 7,
    max_psu_form_factor: "ATX",
    radiator_sizes: "",
  });
  const [cpuForm, setCpuForm] = useState<CpuFormValues>({
    name: "",
    manufacturer: "AMD",
    socket: "AM5",
    tier: 5,
    cores: 6,
    threads: 12,
    tdp_w: 65,
    max_mem_speed_mhz: 5200,
    memory_type: "DDR5",
  });

  const handleSaveCase = useCallback(() => {
    const parsed = caseFormSchema.safeParse({
      ...caseForm,
      max_psu_length_mm: caseForm.max_psu_length_mm ?? undefined,
    });
    if (!parsed.success) {
      const err: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const path = i.path[0]?.toString() ?? "form";
        err[path] = i.message;
      });
      setErrors(err);
      return;
    }
    setErrors({});
    const d = parsed.data;
    const supports_radiator_mm = d.radiator_sizes
      ? d.radiator_sizes.split(/[\s,]+/).map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n))
      : undefined;
    const part: Case = {
      id: `manual-case-${Date.now()}`,
      name: d.name,
      manufacturer: d.manufacturer,
      specs: {
        form_factor: d.form_factor,
        max_gpu_length_mm: d.max_gpu_length_mm,
        max_cooler_height_mm: d.max_cooler_height_mm,
        max_psu_length_mm: d.max_psu_length_mm,
        drive_bays_2_5: d.drive_bays_2_5,
        drive_bays_3_5: d.drive_bays_3_5,
        expansion_slots: d.expansion_slots,
        supports_radiator_mm: supports_radiator_mm?.length ? supports_radiator_mm : undefined,
        max_psu_form_factor: d.max_psu_form_factor,
      },
    };
    onSave(part);
    onClose();
  }, [caseForm, onSave, onClose]);

  const handleSaveCpu = useCallback(() => {
    const parsed = cpuFormSchema.safeParse(cpuForm);
    if (!parsed.success) {
      const err: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const path = i.path[0]?.toString() ?? "form";
        err[path] = i.message;
      });
      setErrors(err);
      return;
    }
    setErrors({});
    const d = parsed.data;
    const part: CPU = {
      id: `manual-cpu-${Date.now()}`,
      name: d.name,
      manufacturer: d.manufacturer,
      specs: {
        brand: d.manufacturer,
        socket: d.socket,
        cores: d.cores,
        threads: d.threads,
        base_clock_ghz: 3,
        tdp_w: d.tdp_w,
        max_mem_speed_mhz: d.max_mem_speed_mhz,
        memory_type: d.memory_type,
        pcie_version: "4.0",
        has_igpu: true,
        tier: d.tier,
      },
    };
    onSave(part);
    onClose();
  }, [cpuForm, onSave, onClose]);

  const handleSave = category === "case" ? handleSaveCase : category === "cpu" ? handleSaveCpu : () => {};

  if (!isOpen) return null;

  const supported = category === "case" || category === "cpu";
  if (!supported) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            Manual entry for {category} is not available yet. Use search to select a part.
          </p>
          <Button className="mt-4" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Enter {category} manually</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="p-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {category === "case" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  value={caseForm.name}
                  onChange={(e) => setCaseForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="e.g. H5 Flow"
                />
                {errors.name && <p className="text-xs text-error mt-0.5">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manufacturer *</label>
                <input
                  value={caseForm.manufacturer}
                  onChange={(e) => setCaseForm((f) => ({ ...f, manufacturer: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="e.g. NZXT"
                />
                {errors.manufacturer && <p className="text-xs text-error mt-0.5">{errors.manufacturer}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Form factor</label>
                <select
                  value={caseForm.form_factor}
                  onChange={(e) => setCaseForm((f) => ({ ...f, form_factor: e.target.value as CaseFormValues["form_factor"] }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {FORM_FACTORS.map((ff) => (
                    <option key={ff} value={ff}>{ff}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Max GPU length (mm) *</label>
                  <input
                    type="number"
                    value={caseForm.max_gpu_length_mm}
                    onChange={(e) => setCaseForm((f) => ({ ...f, max_gpu_length_mm: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  {errors.max_gpu_length_mm && <p className="text-xs text-error">{errors.max_gpu_length_mm}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max cooler height (mm) *</label>
                  <input
                    type="number"
                    value={caseForm.max_cooler_height_mm}
                    onChange={(e) => setCaseForm((f) => ({ ...f, max_cooler_height_mm: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  {errors.max_cooler_height_mm && <p className="text-xs text-error">{errors.max_cooler_height_mm}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max PSU length (mm)</label>
                <input
                  type="number"
                  value={caseForm.max_psu_length_mm ?? ""}
                  onChange={(e) => setCaseForm((f) => ({ ...f, max_psu_length_mm: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Radiator support (mm, comma-separated)</label>
                <input
                  value={caseForm.radiator_sizes}
                  onChange={(e) => setCaseForm((f) => ({ ...f, radiator_sizes: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="e.g. 240, 360"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">2.5&quot; bays</label>
                  <input
                    type="number"
                    min={0}
                    value={caseForm.drive_bays_2_5}
                    onChange={(e) => setCaseForm((f) => ({ ...f, drive_bays_2_5: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">3.5&quot; bays</label>
                  <input
                    type="number"
                    min={0}
                    value={caseForm.drive_bays_3_5}
                    onChange={(e) => setCaseForm((f) => ({ ...f, drive_bays_3_5: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expansion slots</label>
                  <input
                    type="number"
                    min={1}
                    value={caseForm.expansion_slots}
                    onChange={(e) => setCaseForm((f) => ({ ...f, expansion_slots: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max PSU form factor</label>
                <select
                  value={caseForm.max_psu_form_factor}
                  onChange={(e) => setCaseForm((f) => ({ ...f, max_psu_form_factor: e.target.value as CaseFormValues["max_psu_form_factor"] }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {MAX_PSU_FORM.map((ff) => (
                    <option key={ff} value={ff}>{ff}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {category === "cpu" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  value={cpuForm.name}
                  onChange={(e) => setCpuForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="e.g. Ryzen 5 7600"
                />
                {errors.name && <p className="text-xs text-error mt-0.5">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manufacturer</label>
                <select
                  value={cpuForm.manufacturer}
                  onChange={(e) => setCpuForm((f) => ({ ...f, manufacturer: e.target.value as "Intel" | "AMD" }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="AMD">AMD</option>
                  <option value="Intel">Intel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Socket *</label>
                <input
                  value={cpuForm.socket}
                  onChange={(e) => setCpuForm((f) => ({ ...f, socket: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="e.g. AM5, LGA1700"
                />
                {errors.socket && <p className="text-xs text-error mt-0.5">{errors.socket}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tier (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={cpuForm.tier}
                    onChange={(e) => setCpuForm((f) => ({ ...f, tier: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TDP (W)</label>
                  <input
                    type="number"
                    min={0}
                    value={cpuForm.tdp_w}
                    onChange={(e) => setCpuForm((f) => ({ ...f, tdp_w: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Cores / Threads</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={cpuForm.cores}
                      onChange={(e) => setCpuForm((f) => ({ ...f, cores: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                    <input
                      type="number"
                      min={1}
                      value={cpuForm.threads}
                      onChange={(e) => setCpuForm((f) => ({ ...f, threads: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max memory speed (MHz)</label>
                  <input
                    type="number"
                    min={1600}
                    value={cpuForm.max_mem_speed_mhz}
                    onChange={(e) => setCpuForm((f) => ({ ...f, max_mem_speed_mhz: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Memory type</label>
                <select
                  value={cpuForm.memory_type}
                  onChange={(e) => setCpuForm((f) => ({ ...f, memory_type: e.target.value as "DDR4" | "DDR5" }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="DDR4">DDR4</option>
                  <option value="DDR5">DDR5</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
