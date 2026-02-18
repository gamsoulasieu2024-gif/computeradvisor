"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { X, Copy, Download } from "lucide-react";
import {
  formatJson,
  formatTextList,
  formatPCPartPicker,
  formatMarkdown,
} from "@/lib/export/formatters";
import type { PersistedBuild } from "@/lib/persistence/storage";
import { useToast } from "@/components/ui/Toast";

type ExportFormat = "json" | "text" | "pcpartpicker" | "markdown";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  build: {
    preset: PersistedBuild["preset"];
    parts: PersistedBuild["parts"];
    name?: string;
  };
}

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "json", label: "JSON" },
  { id: "text", label: "Text List" },
  { id: "pcpartpicker", label: "PCPartPicker" },
  { id: "markdown", label: "Markdown" },
];

export function ExportModal({
  isOpen,
  onClose,
  build,
}: ExportModalProps) {
  const [tab, setTab] = useState<ExportFormat>("json");
  const { toast } = useToast();

  const input = {
    preset: build.preset,
    parts: build.parts,
    buildName: build.name,
  };

  const content =
    tab === "json"
      ? formatJson(input)
      : tab === "text"
        ? formatTextList(input)
        : tab === "pcpartpicker"
          ? formatPCPartPicker(input)
          : formatMarkdown(input);

  const ext = tab === "json" ? "json" : "txt";
  const mime = tab === "json" ? "application/json" : "text/plain";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast("success", "Copied to clipboard");
    } catch {
      toast("error", "Failed to copy");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pc-build-${build.name ?? "export"}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("success", "File downloaded");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 id="export-title" className="text-lg font-semibold">
            Export build
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

        <div className="flex gap-1 border-b border-zinc-200 px-4 dark:border-zinc-800">
          {FORMATS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === id
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-zinc-500 hover:text-foreground dark:text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <pre className="max-h-64 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
            <code>{content}</code>
          </pre>
        </div>

        <div className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <Button variant="outline" onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
