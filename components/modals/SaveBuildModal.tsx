"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { X, Save, Copy } from "lucide-react";
import { saveBuild } from "@/lib/persistence/build-saver";
import { useToast } from "@/components/ui/Toast";
import { buildShareUrl } from "@/lib/persistence/url-encoder";
import type { PersistedBuild } from "@/lib/persistence/storage";

function defaultBuildName(): string {
  return `My Build - ${new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

interface SaveBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  build: {
    preset: PersistedBuild["preset"];
    parts: PersistedBuild["parts"];
    manualOverrides: PersistedBuild["manualOverrides"];
    targetId?: string;
  };
  onSaved?: (id: string) => void;
  apiAvailable?: boolean;
}

export function SaveBuildModal({
  isOpen,
  onClose,
  build,
  onSaved,
  apiAvailable = true,
}: SaveBuildModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [saveToAccount, setSaveToAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultBuildName());
      setSaveToAccount(false);
      setError(null);
      setSavedId(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { id } = await saveBuild({
        name: name.trim() || undefined,
        preset: build.preset,
        parts: build.parts,
        manualOverrides: build.manualOverrides,
        saveToCloud: saveToAccount,
      });
      setSavedId(id);
      toast("success", "Build saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!savedId) return;
    const persisted: PersistedBuild = {
      id: savedId,
      name: name.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preset: build.preset,
      parts: build.parts,
      manualOverrides: build.manualOverrides,
      targetId: build.targetId,
    };
    const url = buildShareUrl(persisted);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback
    }
  };

  const handleClose = () => {
    if (savedId) onSaved?.(savedId);
    setSavedId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex w-full max-w-md flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-build-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 id="save-build-title" className="text-lg font-semibold">
            Save build
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-2 text-zinc-500 hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {savedId ? (
          <div className="space-y-4 p-4">
            <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-200">
              <p className="font-medium">Build saved!</p>
              <p className="mt-1 text-sm opacity-90">
                Copy the link below to share your build.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 p-4">
              <div>
                <label
                  htmlFor="build-name"
                  className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Build name
                </label>
                <input
                  id="build-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={defaultBuildName()}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-foreground placeholder:text-zinc-400 focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground dark:border-zinc-600 dark:bg-zinc-800 dark:placeholder:text-zinc-500"
                />
              </div>
              {apiAvailable && (
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={saveToAccount}
                    onChange={(e) => setSaveToAccount(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Save to account
                  </span>
                </label>
              )}
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
              <Button variant="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </>
        )}

        {savedId && (
          <div className="flex justify-end border-t border-zinc-200 p-4 dark:border-zinc-800">
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}
