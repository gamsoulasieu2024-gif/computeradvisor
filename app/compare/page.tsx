"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getSavedBuilds, type SavedBuild } from "@/lib/storage/build-storage";
import { calculateScores } from "@/lib/scoring/engine";
import { checkCompatibility } from "@/lib/compatibility";
import type { ScoreResult } from "@/lib/scoring/types";

function calculateTotalPrice(build: SavedBuild): number {
  const p = build.parts;
  let sum = 0;
  if (p.cpu?.price_usd) sum += p.cpu.price_usd;
  if (p.gpu?.price_usd) sum += p.gpu.price_usd;
  if (p.motherboard?.price_usd) sum += p.motherboard.price_usd;
  if (p.ram?.price_usd) sum += p.ram.price_usd;
  if (p.psu?.price_usd) sum += p.psu.price_usd;
  if (p.cooler?.price_usd) sum += p.cooler.price_usd;
  if (p.case?.price_usd) sum += p.case.price_usd;
  if (Array.isArray(p.storage)) {
    for (const s of p.storage) if (s?.price_usd) sum += s.price_usd;
  }
  return sum;
}

const CATEGORIES = [
  { key: "cpu" as const, label: "CPU", icon: "🔲" },
  { key: "gpu" as const, label: "GPU", icon: "🎮" },
  { key: "motherboard" as const, label: "Motherboard", icon: "🔌" },
  { key: "ram" as const, label: "RAM", icon: "💾" },
  { key: "storage" as const, label: "Storage", icon: "💿" },
  { key: "psu" as const, label: "PSU", icon: "⚡" },
  { key: "cooler" as const, label: "Cooler", icon: "❄️" },
  { key: "case" as const, label: "Case", icon: "📦" },
];

function getPartForCategory(
  build: SavedBuild,
  key: (typeof CATEGORIES)[number]["key"]
): { id: string; name: string; price_usd?: number; specs?: Record<string, unknown> } | null {
  const parts = build.parts;
  if (key === "storage") {
    const arr = parts.storage;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const first = arr[0];
    return first
      ? {
          id: `storage-${arr.length}-${first.id}`,
          name: arr.length === 1 ? first.name : `${arr.length} drives`,
          price_usd: arr.reduce((s, x) => s + (x?.price_usd ?? 0), 0),
          specs: first.specs as Record<string, unknown>,
        }
      : null;
  }
  const part = parts[key];
  if (!part || typeof part !== "object") return null;
  const p = part as { id: string; name: string; price_usd?: number; specs?: Record<string, unknown> };
  return { id: p.id, name: p.name, price_usd: p.price_usd, specs: p.specs };
}

function CompareContent() {
  const searchParams = useSearchParams();
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [scores, setScores] = useState<ScoreResult[]>([]);

  useEffect(() => {
    const buildIds = searchParams.get("builds")?.split(",").filter(Boolean) ?? [];
    const allBuilds = getSavedBuilds();
    const selected = allBuilds.filter((b) => buildIds.includes(b.metadata.id));
    // Preserve order from query
    const ordered = buildIds
      .map((id) => selected.find((b) => b.metadata.id === id))
      .filter((b): b is SavedBuild => b != null);
    setBuilds(ordered);

    const buildScores: ScoreResult[] = ordered.map((build) => {
      const buildInput = {
        ...build.parts,
        storage: build.parts.storage ?? [],
      };
      const compatResult = checkCompatibility(buildInput);
      return calculateScores(buildInput, compatResult, {
        preset: build.preset,
        targetId: build.targetId,
      });
    });
    setScores(buildScores);
  }, [searchParams]);

  if (builds.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          No builds selected for comparison
        </p>
        <Button as="link" href="/builds" className="mt-4">
          Go to My Builds
        </Button>
      </div>
    );
  }

  const prices = builds.map(calculateTotalPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" as="link" href="/builds">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Builds
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Compare Builds
            </h1>
            <p className="mt-1 text-muted-foreground">
              Comparing {builds.length} builds side by side
            </p>
          </div>
        </div>
        <Button variant="outline" disabled aria-label="Export (coming soon)">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="sticky left-0 z-10 min-w-[140px] bg-muted/30 px-4 py-3 text-left text-sm font-semibold text-foreground">
                Component
              </th>
              {builds.map((build, i) => (
                <th
                  key={build.metadata.id}
                  className="min-w-[200px] px-4 py-3 text-left text-sm font-semibold text-foreground sm:min-w-[250px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span>{build.metadata.name}</span>
                    {build.metadata.isFavorite && (
                      <Badge variant="warning" className="text-xs">
                        ⭐ Favorite
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs font-normal text-muted-foreground">
                    {build.preset}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {/* Total Price Row */}
            <tr className="bg-primary/5">
              <td className="sticky left-0 z-10 bg-primary/5 px-4 py-3 text-sm font-semibold text-foreground">
                💰 Total Price
              </td>
              {builds.map((build, i) => {
                const price = calculateTotalPrice(build);
                const isLowest = price === minPrice && builds.length > 1;
                return (
                  <td key={build.metadata.id} className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl font-bold text-foreground">
                        ${price.toLocaleString()}
                      </span>
                      {isLowest && (
                        <Badge variant="success" className="text-xs">
                          Lowest
                        </Badge>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Overall Score Row */}
            {scores.length === builds.length && scores.length > 0 && (
              <tr className="bg-muted/20">
                <td className="sticky left-0 z-10 bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground">
                  📊 Overall Score
                </td>
                {scores.map((score, i) => {
                  const maxOverall = Math.max(
                    ...scores.map((s) => s.overall)
                  );
                  const isHighest =
                    score.overall === maxOverall && scores.length > 1;
                  return (
                    <td key={builds[i].metadata.id} className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-bold text-foreground">
                          {Math.round(score.overall)}
                        </span>
                        {isHighest && (
                          <Badge variant="success" className="text-xs">
                            Highest
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        P: {Math.round(score.scores.performance.value)} | V:{" "}
                        {Math.round(score.scores.value.value)} | C:{" "}
                        {Math.round(score.scores.compatibility.value)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Component Rows */}
            {CATEGORIES.map(({ key, label, icon }) => {
              const partList = builds.map((b) => getPartForCategory(b, key));
              const ids = partList.map((p) => p?.id ?? "");
              const allSame =
                ids.length > 0 && ids.every((id) => id === ids[0]);
              const hasDifference = !allSame;

              return (
                <tr
                  key={key}
                  className={
                    hasDifference
                      ? "bg-yellow-50 dark:bg-yellow-950/20"
                      : undefined
                  }
                >
                  <td className="sticky left-0 z-10 bg-card px-4 py-3 text-sm font-medium text-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{icon}</span>
                      <span>{label}</span>
                      {hasDifference && (
                        <Badge variant="warning" className="text-xs">
                          Different
                        </Badge>
                      )}
                    </div>
                  </td>
                  {builds.map((build, i) => {
                    const part = getPartForCategory(build, key);
                    if (!part) {
                      return (
                        <td
                          key={build.metadata.id}
                          className="px-4 py-3 text-sm"
                        >
                          <span className="italic text-muted-foreground">
                            Not selected
                          </span>
                        </td>
                      );
                    }
                    const specs = part.specs ?? {};
                    return (
                      <td
                        key={build.metadata.id}
                        className="px-4 py-3 text-sm"
                      >
                        <div>
                          <div className="mb-1 font-medium text-foreground">
                            {part.name}
                          </div>
                          {part.price_usd != null && (
                            <div className="text-xs text-muted-foreground">
                              ${part.price_usd.toLocaleString()}
                            </div>
                          )}
                          {key === "cpu" &&
                            specs.cores != null &&
                            specs.threads != null && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {String(specs.cores)}C/{String(specs.threads)}T @{" "}
                                {String(specs.base_clock_ghz ?? "—")} GHz
                              </div>
                            )}
                          {key === "gpu" && specs.vram_gb != null && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {String(specs.vram_gb)}GB VRAM
                            </div>
                          )}
                          {key === "ram" &&
                            specs.capacity_gb != null &&
                            specs.speed_mhz != null && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {String(specs.capacity_gb)}GB @{" "}
                                {String(specs.speed_mhz)} MHz
                              </div>
                            )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">Price Range</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lowest:</span>
              <span className="font-medium text-foreground">
                ${minPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Highest:</span>
              <span className="font-medium text-foreground">
                ${maxPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Difference:</span>
              <span className="font-medium text-foreground">
                ${(maxPrice - minPrice).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">Score Range</h3>
          {scores.length > 0 ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Highest:</span>
                <span className="font-medium text-foreground">
                  {Math.round(
                    Math.max(...scores.map((s) => s.overall))
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lowest:</span>
                <span className="font-medium text-foreground">
                  {Math.round(
                    Math.min(...scores.map((s) => s.overall))
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spread:</span>
                <span className="font-medium text-foreground">
                  {Math.round(
                    Math.max(...scores.map((s) => s.overall)) -
                      Math.min(...scores.map((s) => s.overall))
                  )}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading scores…</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">
            Key Differences
          </h3>
          <div className="text-sm text-muted-foreground">
            {(() => {
              let diffCount = 0;
              CATEGORIES.forEach(({ key }) => {
                const parts = builds.map((b) => getPartForCategory(b, key));
                const ids = parts.map((p) => p?.id ?? "");
                const allSame =
                  ids.length > 0 && ids.every((id) => id === ids[0]);
                if (!allSame) diffCount++;
              });
              return (
                <p>
                  {diffCount} component{diffCount !== 1 ? "s" : ""} differ across
                  builds
                </p>
              );
            })()}
          </div>
        </div>
      </div>

      {/* View links */}
      <div className="mt-8 flex flex-wrap gap-3">
        {builds.map((build) => (
          <Button
            key={build.metadata.id}
            as="link"
            href={`/results/${build.metadata.id}`}
            variant="outline"
            size="sm"
          >
            View {build.metadata.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="py-12 text-center text-muted-foreground">
            Loading comparison…
          </div>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
