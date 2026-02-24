"use client";

import type { CompatibilityResult } from "@/lib/compatibility/types";
import type { SelectedParts } from "@/lib/store/types";
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle } from "lucide-react";

interface MissingDataPanelProps {
  compatResult: CompatibilityResult;
  selectedParts: SelectedParts;
}

export function MissingDataPanel({
  compatResult: _compatResult,
  selectedParts,
}: MissingDataPanelProps) {
  const missingData: Array<{
    item: string;
    impact: string;
    action: string;
  }> = [];

  const caseSpecs = selectedParts.case?.specs as { max_gpu_length_mm?: number; max_cooler_height_mm?: number; max_psu_length_mm?: number; max_gpu_thickness_slots?: number; supports_radiator_mm?: number[]; max_radiator_thickness_mm?: number } | undefined;
  const gpuSpecs = selectedParts.gpu?.specs as { length_mm?: number; thickness_slots?: number } | undefined;
  const psuSpecs = selectedParts.psu?.specs as { wattage_w?: number; connectors?: unknown; length_mm?: number } | undefined;
  const coolerSpecs = selectedParts.cooler?.specs as { type?: string; radiator_size_mm?: number; radiator_fan_thickness_mm?: number } | undefined;

  if (selectedParts.case && caseSpecs?.max_gpu_length_mm == null) {
    missingData.push({
      item: "Case max GPU length",
      impact: "Cannot validate GPU length vs case clearance",
      action: "Enter manual override or choose a case with known specs",
    });
  }

  if (selectedParts.case && caseSpecs?.max_cooler_height_mm == null) {
    missingData.push({
      item: "Case max CPU cooler height",
      impact: "Cannot validate cooler height vs case clearance",
      action: "Enter manual override or choose a case with known specs",
    });
  }

  if (selectedParts.gpu && gpuSpecs?.length_mm == null) {
    missingData.push({
      item: "GPU length (mm)",
      impact: "Cannot validate GPU fits in case",
      action: "Enter GPU length manually or check manufacturer specs",
    });
  }

  if (selectedParts.case && caseSpecs?.max_gpu_thickness_slots == null && selectedParts.gpu) {
    missingData.push({
      item: "Case GPU thickness clearance",
      impact: "Cannot validate GPU thickness fits in case",
      action: "Enter manual override or choose case with known specs",
    });
  }

  if (selectedParts.gpu && gpuSpecs?.thickness_slots == null) {
    missingData.push({
      item: "GPU thickness (slots)",
      impact: "Cannot validate GPU thickness vs case clearance",
      action: "Enter manual GPU thickness or check manufacturer specs",
    });
  }

  if (selectedParts.psu && psuSpecs?.connectors == null) {
    missingData.push({
      item: "PSU connector details",
      impact: "Using wattage-based inference for PCIe connectors",
      action: "Enter PSU connector count manually for accurate check",
    });
  }

  if (selectedParts.case && caseSpecs?.max_psu_length_mm == null) {
    missingData.push({
      item: "Case PSU length clearance",
      impact: "Cannot validate PSU length vs case",
      action: "Enter case PSU clearance manually",
    });
  }

  if (selectedParts.psu && psuSpecs?.length_mm == null) {
    missingData.push({
      item: "PSU length (mm)",
      impact: "Using form-factor default for PSU length; may be inaccurate",
      action: "Enter PSU length manually for accurate clearance check",
    });
  }

  if (
    coolerSpecs?.type === "AIO" &&
    selectedParts.case &&
    (caseSpecs?.supports_radiator_mm == null ||
      (Array.isArray(caseSpecs.supports_radiator_mm) &&
        caseSpecs.supports_radiator_mm.length === 0))
  ) {
    missingData.push({
      item: "Case radiator support",
      impact: "Cannot validate AIO radiator size vs case",
      action: "Enter case radiator support (e.g. 240, 360mm) manually",
    });
  }

  if (
    coolerSpecs?.type === "AIO" &&
    selectedParts.case &&
    caseSpecs?.max_radiator_thickness_mm == null
  ) {
    missingData.push({
      item: "Case max radiator + fan thickness",
      impact: "Cannot validate AIO rad+fan thickness vs case clearance",
      action: "Enter case radiator clearance (mm) manually",
    });
  }

  if (
    coolerSpecs?.type === "AIO" &&
    coolerSpecs?.radiator_fan_thickness_mm == null
  ) {
    missingData.push({
      item: "AIO radiator + fan thickness (mm)",
      impact: "Cannot validate AIO fits in case mount",
      action: "Enter cooler rad+fan thickness manually (e.g. 52mm)",
    });
  }

  if (missingData.length === 0) return null;

  return (
    <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            Missing Data Reduces Confidence
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            Adding this data would improve compatibility check accuracy:
          </p>

          <div className="space-y-3">
            {missingData.map((item, i) => (
              <div
                key={i}
                className="bg-yellow-100/80 dark:bg-yellow-900/30 rounded p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
                    {item.item}
                  </span>
                  <Badge variant="warning" className="text-xs shrink-0">
                    Missing
                  </Badge>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">
                  Impact: {item.impact}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                  → {item.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
