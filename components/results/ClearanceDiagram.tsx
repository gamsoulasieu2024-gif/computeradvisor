"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";
import type { Case, Cooler, GPU, PSU } from "@/types/components";

interface ClearanceDiagramProps {
  build: {
    selectedParts: {
      case?: Case;
      gpu?: GPU;
      cooler?: Cooler;
      psu?: PSU;
    };
  };
  issues: unknown[];
}

export function ClearanceDiagram({ build, issues }: ClearanceDiagramProps) {
  const { selectedParts } = build;

  const pcCase = selectedParts.case;
  const gpu = selectedParts.gpu;
  const cooler = selectedParts.cooler;
  const psu = selectedParts.psu;

  if (!pcCase) return null;

  const caseMaxGpuLength = pcCase.specs?.max_gpu_length_mm ?? 350;
  const caseMaxCoolerHeight = pcCase.specs?.max_cooler_height_mm ?? 165;
  const caseMaxPsuLength = pcCase.specs?.max_psu_length_mm ?? 180;

  const gpuLength = gpu?.specs?.length_mm ?? 0;
  const coolerHeight = cooler?.specs?.height_mm ?? 0;
  const psuLength = psu?.specs?.length_mm ?? 0;

  const gpuPercent = caseMaxGpuLength
    ? (gpuLength / caseMaxGpuLength) * 100
    : 0;
  const coolerPercent = caseMaxCoolerHeight
    ? (coolerHeight / caseMaxCoolerHeight) * 100
    : 0;
  const psuPercent = caseMaxPsuLength
    ? (psuLength / caseMaxPsuLength) * 100
    : 0;

  const gpuConflict = gpuLength > caseMaxGpuLength;
  const coolerConflict = coolerHeight > caseMaxCoolerHeight;
  const psuConflict = psuLength > caseMaxPsuLength;
  const hasAnyConflict = gpuConflict || coolerConflict || psuConflict;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            Physical Fit Check
          </h3>
          <p className="text-sm text-muted-foreground">
            {pcCase.name} clearances
          </p>
        </div>
        {hasAnyConflict ? (
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">Fit issues detected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Everything fits</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {gpu && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  GPU Length
                </span>
                {gpuConflict && (
                  <span className="text-xs font-medium text-red-500">
                    TOO LONG
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {gpuLength}mm / {caseMaxGpuLength}mm
              </span>
            </div>

            <div className="relative h-8 overflow-hidden rounded-md bg-muted">
              <div
                className="absolute inset-y-1 left-1 rounded transition-all"
                style={{
                  width: `calc(${Math.min(gpuPercent, 100)}% - 4px)`,
                  backgroundColor: gpuConflict
                    ? "rgb(239 68 68)"
                    : gpuPercent > 90
                      ? "rgb(234 179 8)"
                      : "var(--color-primary)",
                }}
              />

              {gpuConflict && (
                <div
                  className="absolute inset-y-1 rounded-r border-2 border-dashed border-red-500 bg-red-500/30"
                  style={{
                    left: "calc(100% - 4px)",
                    width: `max(15%, min(50%, ${(gpuPercent - 100) * 0.5}%))`,
                  }}
                />
              )}

              <div
                className="pointer-events-none absolute inset-0 flex items-center"
                aria-hidden
              >
                <div
                  className="h-4 border-r-2 border-dashed border-muted-foreground/30"
                  style={{ marginLeft: "calc(100% - 2px)" }}
                />
              </div>
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded"
                  style={{
                    backgroundColor: gpuConflict
                      ? "rgb(239 68 68)"
                      : "var(--color-primary)",
                  }}
                />
                <span>GPU: {gpu.name}</span>
              </div>
              {gpuPercent > 90 && !gpuConflict && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  • Tight fit
                </span>
              )}
            </div>
          </div>
        )}

        {cooler &&
          cooler.specs?.type === "Air" &&
          (coolerHeight > 0 || coolerConflict) && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Cooler Height
                  </span>
                  {coolerConflict && (
                    <span className="text-xs font-medium text-red-500">
                      TOO TALL
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {coolerHeight}mm / {caseMaxCoolerHeight}mm
                </span>
              </div>

              <div className="relative h-8 overflow-hidden rounded-md bg-muted">
                <div
                  className="absolute inset-y-1 left-1 rounded transition-all"
                  style={{
                    width: `calc(${Math.min(coolerPercent, 100)}% - 4px)`,
                    backgroundColor: coolerConflict
                      ? "rgb(239 68 68)"
                      : coolerPercent > 90
                        ? "rgb(234 179 8)"
                        : "rgb(59 130 246)",
                  }}
                />

                {coolerConflict && (
                  <div
                    className="absolute inset-y-1 rounded-r border-2 border-dashed border-red-500 bg-red-500/30"
                    style={{
                      left: "calc(100% - 4px)",
                      width: `max(15%, min(50%, ${(coolerPercent - 100) * 0.5}%))`,
                    }}
                  />
                )}

                <div
                  className="pointer-events-none absolute inset-0 flex items-center"
                  aria-hidden
                >
                  <div
                    className="h-4 border-r-2 border-dashed border-muted-foreground/30"
                    style={{ marginLeft: "calc(100% - 2px)" }}
                  />
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div
                    className="h-3 w-3 rounded"
                    style={{
                      backgroundColor: coolerConflict
                        ? "rgb(239 68 68)"
                        : "rgb(59 130 246)",
                    }}
                  />
                  <span>Cooler: {cooler.name}</span>
                </div>
              </div>
            </div>
          )}

        {psu && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  PSU Length
                </span>
                {psuConflict && (
                  <span className="text-xs font-medium text-red-500">
                    TOO LONG
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {psuLength}mm / {caseMaxPsuLength}mm
              </span>
            </div>

            <div className="relative h-8 overflow-hidden rounded-md bg-muted">
              <div
                className="absolute inset-y-1 left-1 rounded transition-all"
                style={{
                  width: `calc(${Math.min(psuPercent, 100)}% - 4px)`,
                  backgroundColor: psuConflict
                    ? "rgb(239 68 68)"
                    : psuPercent > 90
                      ? "rgb(234 179 8)"
                      : "rgb(168 85 247)",
                }}
              />

              {psuConflict && (
                <div
                  className="absolute inset-y-1 rounded-r border-2 border-dashed border-red-500 bg-red-500/30"
                  style={{
                    left: "calc(100% - 4px)",
                    width: `max(15%, min(50%, ${(psuPercent - 100) * 0.5}%))`,
                  }}
                />
              )}

              <div
                className="pointer-events-none absolute inset-0 flex items-center"
                aria-hidden
              >
                <div
                  className="h-4 border-r-2 border-dashed border-muted-foreground/30"
                  style={{ marginLeft: "calc(100% - 2px)" }}
                />
              </div>
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded"
                  style={{
                    backgroundColor: psuConflict
                      ? "rgb(239 68 68)"
                      : "rgb(168 85 247)",
                  }}
                />
                <span>PSU: {psu.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div
              className="h-1 w-4 rounded"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
            <span>Component fits comfortably</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 rounded bg-yellow-500" />
            <span>Tight fit (90%+ of clearance)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 rounded bg-red-500" />
            <span>Doesn&apos;t fit — too large</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 rounded border-2 border-dashed border-muted-foreground/30" />
            <span>Maximum clearance</span>
          </div>
        </div>
      </div>

      {(gpuPercent > 90 || coolerPercent > 90 || psuPercent > 90) &&
        !hasAnyConflict && (
          <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Tight fit:</strong> Component uses 90%+ of available
              clearance. Should fit, but verify with case manufacturer if
              concerned about cable routing or airflow.
            </p>
          </div>
        )}
    </div>
  );
}
