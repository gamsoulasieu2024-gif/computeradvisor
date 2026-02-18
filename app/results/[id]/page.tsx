"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBuild } from "@/hooks/use-build";
import { checkCompatibility } from "@/lib/compatibility";
import { calculateScores, generateExplanations } from "@/lib/scoring";
import { getRecommendations } from "@/lib/recommendations/engine";
import { loadBuild } from "@/lib/persistence/build-saver";
import { VerdictBanner, type VerdictType } from "@/components/results/VerdictBanner";
import { ScoreCard } from "@/components/results/ScoreCard";
import { IssuesList } from "@/components/results/IssuesList";
import { FixSuggestions } from "@/components/results/FixSuggestions";
import { UpgradePath } from "@/components/results/UpgradePath";
import { Alternatives } from "@/components/results/Alternatives";
import { BuildSummary } from "@/components/results/BuildSummary";
import { ShareButtons } from "@/components/results/ShareButtons";
import { ExportModal } from "@/components/export/ExportModal";
import { Button } from "@/components/ui/Button";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { selectedParts, preset, addPart, setPreset } = useBuild();

  const [build, setBuild] = useState<{
    selectedParts: typeof selectedParts;
    preset: typeof preset;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof fetchCatalog>> | null>(null);
  const [tab, setTab] = useState<"upgrades" | "alternatives">("upgrades");
  const [showExport, setShowExport] = useState(false);

  async function fetchCatalog() {
    const res = await fetch("/api/parts");
    return res.json();
  }

  useEffect(() => {
    if (id === "current") {
      setBuild({ selectedParts, preset });
      setLoading(false);
    } else {
      loadBuild(id).then((stored) => {
        if (stored) {
          setBuild({
            selectedParts: stored.parts,
            preset: stored.preset,
          });
        } else {
          setBuild(null);
        }
        setLoading(false);
      });
    }
  }, [id, selectedParts, preset]);

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

  const compatResult = checkCompatibility({
    ...build.selectedParts,
    storage: build.selectedParts.storage ?? [],
  });

  const scoreResult = calculateScores(
    { ...build.selectedParts, storage: build.selectedParts.storage ?? [] },
    compatResult,
    { preset: build.preset }
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

  const handleApplyUpgrade = (partId: string, category: string) => {
    if (!catalog) return;
    const parts = (catalog as Record<string, { id: string }[]>)[
      category === "motherboard" ? "motherboards" : `${category}s`
    ];
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
        />

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
                if (u) handleApplyUpgrade(partId, u.category);
              }}
            />
          </div>
        </section>

        {/* Build Summary */}
        <section className="mt-8">
          <BuildSummary selectedParts={build.selectedParts} />
        </section>

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
            <UpgradePath
              upgrades={recommendations.upgrades}
              onApply={handleApplyUpgrade}
            />
          ) : (
            <Alternatives alternatives={recommendations.alternatives} />
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
      </div>
    </div>
  );
}
