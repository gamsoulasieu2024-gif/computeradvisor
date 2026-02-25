"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBuild } from "@/hooks/use-build";
import { checkCompatibility } from "@/lib/compatibility";
import { calculateScores } from "@/lib/scoring";
import { getRecommendations } from "@/lib/recommendations/engine";
import { generateAutoFixPlan } from "@/lib/recommendations/auto-fix";
import { loadBuild } from "@/lib/persistence/build-saver";
import { VerdictBanner, type VerdictType } from "@/components/results/VerdictBanner";
import { MissingDataPanel } from "@/components/results/MissingDataPanel";
import { ScoreCard } from "@/components/results/ScoreCard";
import { IssuesList } from "@/components/results/IssuesList";
import { FixSuggestions } from "@/components/results/FixSuggestions";
import { UpgradePathInteractive } from "@/components/results/UpgradePathInteractive";
import type { UpgradeOption } from "@/lib/recommendations/upgrade-path";
import { Alternatives } from "@/components/results/Alternatives";
import { BuildSummary } from "@/components/results/BuildSummary";
import { ShareButtons } from "@/components/results/ShareButtons";
import { ExportModal } from "@/components/export/ExportModal";
import { AutoFixModal } from "@/components/results/AutoFixModal";
import { FPSEstimateCard } from "@/components/results/FPSEstimateCard";
import { FPSByGenreExpander } from "@/components/results/FPSByGenreExpander";
import { ClearanceDiagram } from "@/components/results/ClearanceDiagram";
import { Button } from "@/components/ui/Button";
import { Zap } from "lucide-react";
import { getTargetById } from "@/lib/presets/targets";
import type { GameTarget } from "@/lib/presets/targets";
import { estimateFPS, estimateFPSByGenre } from "@/lib/performance/fps-estimation";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { selectedParts, preset, targetId: storeTargetId, addPart, removePart, importBuild } = useBuild();

  const [build, setBuild] = useState<{
    selectedParts: typeof selectedParts;
    preset: typeof preset;
    targetId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof fetchCatalog>> | null>(null);
  const [tab, setTab] = useState<"upgrades" | "alternatives">("upgrades");
  const [showExport, setShowExport] = useState(false);
  const [showAutoFix, setShowAutoFix] = useState(false);
  const [cheapestPlan, setCheapestPlan] = useState<Awaited<ReturnType<typeof generateAutoFixPlan>> | null>(null);
  const [performancePlan, setPerformancePlan] = useState<Awaited<ReturnType<typeof generateAutoFixPlan>> | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);

  async function fetchCatalog() {
    const res = await fetch("/api/parts");
    return res.json();
  }

  useEffect(() => {
    const loadBuildData = async () => {
      if (id === "current") {
        // Use setTimeout to make setState async and avoid cascading renders
        await Promise.resolve();
        setBuild({ selectedParts, preset, targetId: storeTargetId });
        setLoading(false);
      } else {
        try {
          const stored = await loadBuild(id);
          if (stored) {
            setBuild({
              selectedParts: stored.parts,
              preset: stored.preset,
              targetId: stored.targetId,
            });
          } else {
            setBuild(null);
          }
        } catch (err) {
          console.error("Failed to load build:", err);
          setBuild(null);
        } finally {
          setLoading(false);
        }
      }
    };

    loadBuildData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // selectedParts and preset intentionally omitted to avoid cascading renders for "current" case

  useEffect(() => {
    fetchCatalog().then(setCatalog);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Build not found</h1>
        <p className="mt-2 text-zinc-500">
          This build may have expired or the link is invalid.
        </p>
        <Button as="link" href="/build" className="mt-4">
          Start New Build
        </Button>
      </div>
    );
  }

  const compatResult = checkCompatibility(
    {
      ...build.selectedParts,
      storage: build.selectedParts.storage ?? [],
    },
    { preset: build.preset }
  );

  const scoreResult = calculateScores(
    { ...build.selectedParts, storage: build.selectedParts.storage ?? [] },
    compatResult,
    { preset: build.preset, targetId: build.targetId }
  );

  const recommendations = catalog
    ? getRecommendations(
        { ...build.selectedParts, storage: build.selectedParts.storage ?? [] },
        compatResult,
        catalog
      )
    : { upgrades: [], alternatives: [] };

  const verdict: VerdictType = compatResult.hardFails.length > 0
    ? "incompatible"
    : compatResult.warnings.length >= 3
      ? "warnings"
      : "compatible";

  const topIssues = [
    ...compatResult.hardFails,
    ...compatResult.warnings,
  ].slice(0, 3);

  const issueCount =
    compatResult.hardFails.length +
    compatResult.warnings.length +
    compatResult.notes.length;

  const target = build.targetId ? getTargetById(build.targetId) : null;
  const isGameTarget = target && "resolution" in target;
  const gameTarget = isGameTarget ? (target as GameTarget) : null;
  const fpsEstimate =
    gameTarget && build.selectedParts.cpu && build.selectedParts.gpu
      ? estimateFPS(
          build.selectedParts.cpu,
          build.selectedParts.gpu,
          gameTarget
        )
      : null;
  const genreEstimates =
    fpsEstimate && gameTarget && build.selectedParts.cpu && build.selectedParts.gpu
      ? {
          aaa: estimateFPSByGenre(build.selectedParts.cpu, build.selectedParts.gpu, gameTarget, "aaa")!,
          esports: estimateFPSByGenre(build.selectedParts.cpu, build.selectedParts.gpu, gameTarget, "esports")!,
          indie: estimateFPSByGenre(build.selectedParts.cpu, build.selectedParts.gpu, gameTarget, "indie")!,
          simulation: estimateFPSByGenre(build.selectedParts.cpu, build.selectedParts.gpu, gameTarget, "simulation")!,
        }
      : null;

  const buildJson = JSON.stringify(
    {
      id,
      ...build,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );

  const persistedBuildForShare = {
    id,
    preset: build.preset,
    parts: build.selectedParts,
    manualOverrides: {},
    createdAt: "",
    updatedAt: new Date().toISOString(),
  };

  const catalogKey: Record<string, string> = {
    cpu: "cpus",
    gpu: "gpus",
    motherboard: "motherboards",
    ram: "ram",
    storage: "storage",
    psu: "psus",
    cooler: "coolers",
    case: "cases",
  };
  const handleFixAll = async () => {
    if (!build || !catalog) return;
    setShowAutoFix(true);
    setLoadingPlans(true);
    setCheapestPlan(null);
    setPerformancePlan(null);

    try {
      const buildForFix = {
        selectedParts: build.selectedParts,
        preset: build.preset,
      };
      const allIssues = [
        ...compatResult.hardFails,
        ...compatResult.warnings.filter((w) => w.severity === "critical" || w.category === "power"),
      ];

      const [cheapest, performance] = await Promise.all([
        generateAutoFixPlan(buildForFix, allIssues, "cheapest", catalog),
        generateAutoFixPlan(buildForFix, allIssues, "performance", catalog),
      ]);

      setCheapestPlan(cheapest);
      setPerformancePlan(performance);
    } catch (err) {
      console.error("Failed to generate fix plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleApplyFixes = (plan: Awaited<ReturnType<typeof generateAutoFixPlan>>) => {
    if (id !== "current" && build) {
      importBuild(
        JSON.stringify({
          selectedParts: build.selectedParts,
          preset: build.preset,
        })
      );
    }
    for (const fix of plan.fixes) {
      if (fix.action === "replace" && fix.newPart && fix.category) {
        const cat = fix.category as "cpu" | "gpu" | "motherboard" | "ram" | "storage" | "psu" | "cooler" | "case";
        if (cat === "storage") {
          removePart("storage");
          addPart(cat, fix.newPart as never);
        } else {
          addPart(cat, fix.newPart as never);
        }
      }
    }
    setShowAutoFix(false);
    router.push("/build");
  };

  const handleApplyUpgrade = (upgrade: UpgradeOption) => {
    const cat = upgrade.category as "cpu" | "gpu" | "motherboard" | "ram" | "storage" | "psu" | "cooler" | "case";
    addPart(cat, upgrade.suggestedPart as never);
    if (upgrade.platformChangeParts?.motherboard) {
      addPart("motherboard", upgrade.platformChangeParts.motherboard as never);
    }
    if (upgrade.platformChangeParts?.psu) {
      addPart("psu", upgrade.platformChangeParts.psu as never);
    }
    if (upgrade.platformChangeParts?.ram) {
      addPart("ram", upgrade.platformChangeParts.ram as never);
    }
    router.push("/build");
  };

  const handleApplyAlternative = (partId: string, category: string) => {
    if (!catalog) return;
    const key = catalogKey[category] ?? `${category}s`;
    const parts = (catalog as Record<string, { id: string }[]>)[key];
    const part = parts?.find((p) => p.id === partId);
    if (part) {
      addPart(category as "cpu" | "gpu" | "motherboard" | "ram" | "storage" | "psu" | "cooler" | "case", part as never);
      router.push("/build");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/build"
            className="text-sm text-zinc-500 hover:text-foreground"
          >
            ← Back to build
          </Link>
        </div>

        {/* Verdict Banner */}
        <VerdictBanner
          verdict={verdict}
          issueCount={issueCount}
          confidence={compatResult.confidence}
          checksCount={compatResult.checksRun}
        />

        {/* Missing data (improves confidence) */}
        <div className="mt-6">
          <MissingDataPanel
            compatResult={compatResult}
            selectedParts={build.selectedParts}
          />
        </div>

        {/* Score Grid */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Scores</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["compatibility", "performance", "value", "usability"] as const).map(
              (key) => (
                <ScoreCard
                  key={key}
                  name={key}
                  score={scoreResult.scores[key]}
                />
              )
            )}
          </div>
        </section>

        {/* FPS Estimate — gaming targets only */}
        {fpsEstimate && gameTarget && (
          <section className="mt-8 space-y-4">
            <FPSEstimateCard
              estimate={fpsEstimate}
              targetName={gameTarget.name}
            />
            {genreEstimates && (
              <FPSByGenreExpander estimates={genreEstimates} />
            )}
          </section>
        )}

        {/* Top Issues & Fix Suggestions */}
        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Top Issues</h2>
            <IssuesList
              hardFails={compatResult.hardFails}
              warnings={compatResult.warnings}
              notes={compatResult.notes}
            />
          </div>
          <div>
            <FixSuggestions
              topIssues={topIssues}
              upgrades={recommendations.upgrades}
              onApplyUpgrade={(partId) => {
                const u = recommendations.upgrades.find(
                  (x) => x.suggestedPart.id === partId
                );
                if (u) handleApplyAlternative(partId, u.category);
              }}
            />
          </div>
        </section>

        {/* Build Summary */}
        <section className="mt-8">
          <BuildSummary selectedParts={build.selectedParts} />
        </section>

        {/* Physical Fit Check */}
        {build.selectedParts.case && (
          <section className="mt-8">
            <ClearanceDiagram
              build={build}
              issues={[...compatResult.hardFails, ...compatResult.warnings]}
            />
          </section>
        )}

        {/* Recommendations Tabs */}
        <section className="mt-8">
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("upgrades")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                tab === "upgrades"
                  ? "bg-foreground text-background"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              Upgrades
            </button>
            <button
              type="button"
              onClick={() => setTab("alternatives")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                tab === "alternatives"
                  ? "bg-foreground text-background"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              Alternatives
            </button>
          </div>
          {tab === "upgrades" ? (
            <UpgradePathInteractive
              currentBuild={{
                selectedParts: {
                  ...build.selectedParts,
                  storage: build.selectedParts.storage ?? [],
                },
                preset: build.preset,
                targetId: build.targetId,
              }}
              currentScores={scoreResult}
              catalog={catalog}
              onApply={handleApplyUpgrade}
            />
          ) : (
            <Alternatives
              alternatives={recommendations.alternatives}
              onApply={handleApplyAlternative}
            />
          )}
        </section>

        {/* Actions */}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex flex-wrap gap-2">
            <Button as="link" href="/build">
              Edit Build
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
              Export
            </Button>
            <ShareButtons
              buildId={id}
              buildJson={buildJson}
              build={persistedBuildForShare}
              scores={scoreResult}
              compatResult={compatResult}
            />
          </div>
        </section>
        <ExportModal
          isOpen={showExport}
          onClose={() => setShowExport(false)}
          build={{
            preset: build.preset,
            parts: build.selectedParts,
            name: undefined,
          }}
        />
        <AutoFixModal
          isOpen={showAutoFix}
          onClose={() => setShowAutoFix(false)}
          onApply={handleApplyFixes}
          cheapestPlan={cheapestPlan}
          performancePlan={performancePlan}
          loading={loadingPlans}
        />
      </div>
    </div>
  );
}
