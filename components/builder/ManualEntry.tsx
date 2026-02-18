"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { PartCategory } from "@/lib/store/types";
import type { Case } from "@/types/components";

const caseSchema = z.object({
  name: z.string().min(1, "Name required"),
  form_factor: z.enum(["ATX", "Micro-ATX", "Mini-ITX", "E-ATX"]),
  max_gpu_length_mm: z.coerce.number().positive(),
  max_cooler_height_mm: z.coerce.number().positive(),
  max_psu_length_mm: z.coerce.number().optional(),
  max_psu_form_factor: z.enum(["ATX", "SFX", "SFX-L"]),
});

type CaseFormData = z.infer<typeof caseSchema>;

const DEFAULT_CASE: CaseFormData = {
  name: "Custom Case",
  form_factor: "ATX",
  max_gpu_length_mm: 350,
  max_cooler_height_mm: 165,
  max_psu_length_mm: 180,
  max_psu_form_factor: "ATX",
};

interface ManualEntryProps {
  category: PartCategory;
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: Case) => void;
}

export function ManualEntry({ category, isOpen, onClose, onSave }: ManualEntryProps) {
  const [form, setForm] = useState<CaseFormData>(DEFAULT_CASE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = caseSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0]?.toString() ?? "unknown";
        errs[path] = err.message;
      });
      setErrors(errs);
      return;
    }
    const d = result.data;
    const part: Case = {
      id: `manual-case-${Date.now()}`,
      name: d.name,
      manufacturer: "Custom",
      specs: {
        form_factor: d.form_factor,
        max_gpu_length_mm: d.max_gpu_length_mm,
        max_cooler_height_mm: d.max_cooler_height_mm,
        max_psu_length_mm: d.max_psu_length_mm,
        drive_bays_2_5: 2,
        drive_bays_3_5: 2,
        expansion_slots: 7,
        max_psu_form_factor: d.max_psu_form_factor,
      },
    };
    onSave(part);
    onClose();
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-foreground focus:border-foreground focus:outline-none focus:ring-1 dark:border-zinc-700 dark:bg-zinc-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Enter {category} manually</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Case: form factor, clearances
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={cn(inputClass, errors.name && "border-error")}
              placeholder="My Custom Case"
            />
            {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Form factor</label>
            <select
              value={form.form_factor}
              onChange={(e) =>
                setForm({
                  ...form,
                  form_factor: e.target.value as CaseFormData["form_factor"],
                })
              }
              className={inputClass}
            >
              <option value="ATX">ATX</option>
              <option value="Micro-ATX">Micro-ATX</option>
              <option value="Mini-ITX">Mini-ITX</option>
              <option value="E-ATX">E-ATX</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Max GPU length (mm)</label>
              <input
                type="number"
                value={form.max_gpu_length_mm}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_gpu_length_mm: parseInt(e.target.value, 10) || 0,
                  })
                }
                className={cn(inputClass, errors.max_gpu_length_mm && "border-error")}
              />
              {errors.max_gpu_length_mm && (
                <p className="mt-1 text-xs text-error">{errors.max_gpu_length_mm}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Max cooler height (mm)</label>
              <input
                type="number"
                value={form.max_cooler_height_mm}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_cooler_height_mm: parseInt(e.target.value, 10) || 0,
                  })
                }
                className={cn(inputClass, errors.max_cooler_height_mm && "border-error")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Max PSU length (mm)</label>
            <input
              type="number"
              value={form.max_psu_length_mm ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_psu_length_mm: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className={inputClass}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Max PSU form factor</label>
            <select
              value={form.max_psu_form_factor}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_psu_form_factor: e.target.value as CaseFormData["max_psu_form_factor"],
                })
              }
              className={inputClass}
            >
              <option value="ATX">ATX</option>
              <option value="SFX">SFX</option>
              <option value="SFX-L">SFX-L</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
