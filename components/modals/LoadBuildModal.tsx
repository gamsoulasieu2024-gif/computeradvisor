"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { X, FolderOpen, Trash2, Search } from "lucide-react";
import { listBuilds, deleteBuild } from "@/lib/persistence/build-saver";
import { BuildThumbnail } from "./BuildThumbnail";
import type { PersistedBuild } from "@/lib/persistence/storage";

interface LoadBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (build: PersistedBuild) => void;
  hasUnsavedChanges?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function LoadBuildModal({
  isOpen,
  onClose,
  onLoad,
  hasUnsavedChanges = false,
}: LoadBuildModalProps) {
  const [builds, setBuilds] = useState<PersistedBuild[]>([]);
  const [search, setSearch] = useState("");
  const [confirmLoad, setConfirmLoad] = useState<PersistedBuild | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBuilds(listBuilds());
      setSearch("");
      setConfirmLoad(null);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return builds;
    return builds.filter(
      (b) =>
        (b.name ?? "").toLowerCase().includes(q) ||
        b.preset.toLowerCase().includes(q)
    );
  }, [builds, search]);

  const handleLoadClick = (build: PersistedBuild) => {
    if (hasUnsavedChanges) {
      setConfirmLoad(build);
    } else {
      onLoad(build);
      onClose();
    }
  };

  const handleConfirmLoad = () => {
    if (confirmLoad) {
      onLoad(confirmLoad);
      setConfirmLoad(null);
      onClose();
    }
  };

  const handleCancelConfirm = () => setConfirmLoad(null);

  const handleDelete = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBuild(id);
    setBuilds((prev) => prev.filter((b) => b.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="load-build-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 id="load-build-title" className="text-lg font-semibold">
            Load saved build
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-zinc-200 px-4 pb-3 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or preset..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground dark:border-zinc-600 dark:bg-zinc-800 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {confirmLoad ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                Unsaved changes
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Loading this build will replace your current build. Continue?
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" onClick={handleCancelConfirm}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmLoad}>Load anyway</Button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">
              {search.trim()
                ? "No builds match your search."
                : "No saved builds yet. Save a build from the builder to see it here."}
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((build) => (
                <li key={build.id}>
                  <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <div className="hidden w-24 shrink-0 sm:block">
                      <BuildThumbnail parts={build.parts} className="h-12" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {build.name || "Unnamed build"}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {formatDate(build.updatedAt)} · {build.preset}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDelete(build.id)}
                        className="inline-flex h-9 items-center justify-center rounded-lg px-2 text-zinc-500 hover:bg-zinc-200 hover:text-red-600 dark:hover:bg-zinc-700 dark:hover:text-red-400"
                        aria-label="Delete build"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Button size="sm" onClick={() => handleLoadClick(build)}>
                        Load
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
