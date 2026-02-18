"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Download, Link2 } from "lucide-react";
import { buildShareUrl } from "@/lib/persistence/url-encoder";
import { useToast } from "@/components/ui/Toast";
import type { PersistedBuild } from "@/lib/persistence/storage";

interface ShareButtonsProps {
  buildId: string;
  buildJson: string;
  /** Optional: for shareable URL that embeds the build (works without localStorage) */
  build?: PersistedBuild;
}

export function ShareButtons({ buildId, buildJson, build }: ShareButtonsProps) {
  const [copied, setCopied] = useState<"link" | "share" | null>(null);
  const { toast } = useToast();

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/results/${buildId}`
      : "";

  const shareableUrl = build ? buildShareUrl(build) : "";

  const handleCopy = async (text: string, kind: "link" | "share") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast("success", "Link copied! Anyone with this link can view your build");
      setTimeout(() => setCopied(null), 3000);
    } catch {
      toast("error", "Failed to copy");
    }
  };

  const successMessage =
    "Link copied! Anyone with this link can view your build";

  const handleExportJson = () => {
    const blob = new Blob([buildJson], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pc-build-${buildId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleCopy(url, "link")}
        className="gap-2"
      >
        <Copy className="h-4 w-4" />
        {copied === "link" ? successMessage : "Copy Link"}
      </Button>
      {shareableUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleCopy(shareableUrl, "share")}
          className="gap-2"
        >
          <Link2 className="h-4 w-4" />
          {copied === "share" ? successMessage : "Copy Shareable URL"}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportJson}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export JSON
      </Button>
    </div>
  );
}
