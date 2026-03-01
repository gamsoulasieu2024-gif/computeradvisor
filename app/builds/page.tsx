"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Copy,
  Star,
  Download,
  Upload,
  Calendar,
  Edit2,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getSavedBuilds,
  deleteBuild,
  duplicateBuild,
  toggleFavorite,
  exportBuild,
  importBuild,
  updateBuildMetadata,
  type SavedBuild,
} from "@/lib/storage/build-storage";
import { useBuild } from "@/hooks/use-build";

function calculateTotalPrice(build: SavedBuild): number {
  const parts = build.parts;
  let sum = 0;
  if (parts.cpu?.price_usd) sum += parts.cpu.price_usd;
  if (parts.gpu?.price_usd) sum += parts.gpu.price_usd;
  if (parts.motherboard?.price_usd) sum += parts.motherboard.price_usd;
  if (parts.ram?.price_usd) sum += parts.ram.price_usd;
  if (parts.psu?.price_usd) sum += parts.psu.price_usd;
  if (parts.cooler?.price_usd) sum += parts.cooler.price_usd;
  if (parts.case?.price_usd) sum += parts.case.price_usd;
  if (Array.isArray(parts.storage)) {
    for (const s of parts.storage) if (s?.price_usd) sum += s.price_usd;
  }
  return sum;
}

function getPartCount(build: SavedBuild): number {
  const p = build.parts;
  let n = 0;
  if (p.cpu) n++;
  if (p.gpu) n++;
  if (p.motherboard) n++;
  if (p.ram) n++;
  if (p.psu) n++;
  if (p.cooler) n++;
  if (p.case) n++;
  if (Array.isArray(p.storage)) n += p.storage.length;
  return n;
}

export default function BuildsPage() {
  const router = useRouter();
  const { importBuild: storeImportBuild } = useBuild();
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [selectedBuilds, setSelectedBuilds] = useState<Set<string>>(new Set());
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameDescription, setRenameDescription] = useState("");

  const loadBuilds = () => setBuilds(getSavedBuilds());

  useEffect(() => {
    loadBuilds();
  }, []);

  const handleDelete = (buildId: string) => {
    if (confirm("Delete this build?")) {
      deleteBuild(buildId);
      loadBuilds();
    }
  };

  const handleDuplicate = (buildId: string) => {
    const duplicate = duplicateBuild(buildId);
    if (duplicate) loadBuilds();
  };

  const handleToggleFavorite = (buildId: string) => {
    toggleFavorite(buildId);
    loadBuilds();
  };

  const handleExport = (buildId: string) => {
    const json = exportBuild(buildId);
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `build-${buildId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const json = ev.target?.result as string;
        const imported = importBuild(json);
        if (imported) {
          loadBuilds();
          alert("Build imported successfully!");
        } else {
          alert("Failed to import build. Invalid format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleLoadIntoBuilder = (build: SavedBuild) => {
    const payload = {
      selectedParts: build.parts,
      preset: build.preset,
      targetId: build.targetId,
      manualOverrides: build.manualOverrides ?? {},
    };
    storeImportBuild(JSON.stringify(payload));
    router.push("/build");
  };

  const toggleSelectBuild = (buildId: string) => {
    const next = new Set(selectedBuilds);
    if (next.has(buildId)) next.delete(buildId);
    else next.add(buildId);
    setSelectedBuilds(next);
  };

  const handleCompare = () => {
    if (selectedBuilds.size < 2) {
      alert("Select at least 2 builds to compare");
      return;
    }
    if (selectedBuilds.size > 4) {
      alert("Maximum 4 builds can be compared at once");
      return;
    }
    const buildIds = Array.from(selectedBuilds).join(",");
    router.push(`/compare?builds=${buildIds}`);
  };

  const startRename = (build: SavedBuild) => {
    setRenameId(build.metadata.id);
    setRenameName(build.metadata.name);
    setRenameDescription(build.metadata.description ?? "");
  };

  const saveRename = () => {
    if (!renameId) return;
    updateBuildMetadata(renameId, {
      name: renameName.trim() || undefined,
      description: renameDescription.trim() || undefined,
    });
    setRenameId(null);
    loadBuilds();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Builds</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and compare your PC builds
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button as="link" href="/build">
            <Plus className="mr-2 h-4 w-4" />
            New Build
          </Button>
        </div>
      </div>

      {selectedBuilds.size > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 p-4">
          <span className="text-sm font-medium text-foreground">
            {selectedBuilds.size} build{selectedBuilds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBuilds(new Set())}
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              onClick={handleCompare}
              disabled={selectedBuilds.size < 2}
            >
              Compare Selected
            </Button>
          </div>
        </div>
      )}

      {builds.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🔧</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            No saved builds yet
          </h2>
          <p className="mb-6 text-muted-foreground">
            Save a build from the builder or import a JSON file to get started
          </p>
          <Button as="link" href="/build">
            <Plus className="mr-2 h-4 w-4" />
            Create New Build
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => {
            const totalPrice = calculateTotalPrice(build);
            const partCount = getPartCount(build);
            const isRename = renameId === build.metadata.id;

            return (
              <div
                key={build.metadata.id}
                className={`rounded-lg border transition-all ${
                  selectedBuilds.has(build.metadata.id)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="border-b border-border p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {isRename ? (
                          <input
                            type="text"
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-sm font-semibold text-foreground"
                            placeholder="Build name"
                            autoFocus
                          />
                        ) : (
                          <h3 className="font-semibold text-foreground">
                            {build.metadata.name}
                          </h3>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(build.metadata.id)}
                          className="text-muted-foreground transition-colors hover:text-yellow-500"
                          aria-label="Toggle favorite"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              build.metadata.isFavorite
                                ? "fill-yellow-500 text-yellow-500"
                                : ""
                            }`}
                          />
                        </button>
                      </div>
                      {isRename ? (
                        <textarea
                          value={renameDescription}
                          onChange={(e) => setRenameDescription(e.target.value)}
                          className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
                          placeholder="Description (optional)"
                          rows={2}
                        />
                      ) : (
                        build.metadata.description && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {build.metadata.description}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                  {isRename ? (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setRenameId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveRename}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {build.preset}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {partCount}/8 parts
                      </Badge>
                    </div>
                  )}
                </div>

                {!isRename && (
                  <>
                    <div className="p-4">
                      <div className="mb-4 space-y-2 text-sm">
                        {build.parts.cpu && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CPU:</span>
                            <span className="ml-2 truncate font-medium text-foreground">
                              {build.parts.cpu.name
                                .split(" ")
                                .slice(0, 3)
                                .join(" ")}
                            </span>
                          </div>
                        )}
                        {build.parts.gpu && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">GPU:</span>
                            <span className="ml-2 truncate font-medium text-foreground">
                              {build.parts.gpu.name
                                .split(" ")
                                .slice(0, 3)
                                .join(" ")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mb-4 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-sm text-muted-foreground">
                          Total:
                        </span>
                        <span className="text-xl font-bold text-foreground">
                          ${totalPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(
                            build.metadata.updatedAt
                          ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => toggleSelectBuild(build.metadata.id)}
                        >
                          {selectedBuilds.has(build.metadata.id)
                            ? "Deselect"
                            : "Select"}
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          as="link"
                          href={`/results/${build.metadata.id}`}
                        >
                          View
                        </Button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleLoadIntoBuilder(build)}
                        >
                          <FolderOpen className="mr-1 h-3 w-3" />
                          Load
                        </Button>
                        <button
                          type="button"
                          onClick={() => startRename(build)}
                          className="flex-1 rounded p-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Rename"
                        >
                          <Edit2 className="mx-auto h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(build.metadata.id)}
                          className="flex-1 rounded p-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Duplicate"
                        >
                          <Copy className="mx-auto h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExport(build.metadata.id)}
                          className="flex-1 rounded p-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Export"
                        >
                          <Download className="mx-auto h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(build.metadata.id)}
                          className="flex-1 rounded p-2 text-xs text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="mx-auto h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
