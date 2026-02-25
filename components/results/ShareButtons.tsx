"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Download, Link2, Share2, Image as ImageIcon, FileText, QrCode } from "lucide-react";
import { buildShareUrl } from "@/lib/persistence/url-encoder";
import { useToast } from "@/components/ui/Toast";
import { generateBuildCardHTML } from "@/lib/export/build-card";
import { generateRedditPost, generateMarkdownPost } from "@/lib/export/reddit-format";
import QRCode from "qrcode";
import type { PersistedBuild } from "@/lib/persistence/storage";

interface ShareButtonsProps {
  buildId: string;
  buildJson: string;
  /** Optional: for shareable URL that embeds the build (works without localStorage) */
  build?: PersistedBuild;
  /** Optional: when provided, enables Build Card, Reddit, Markdown, QR Code */
  scores?: { overall: number; scores: { performance: { value: number }; value: { value: number } } };
  compatResult?: { isCompatible: boolean; hardFails: { title: string }[]; warnings: { title: string }[] };
  /** URL to use for QR code and "Copy Link" (defaults to results page URL) */
  buildUrl?: string;
}

export function ShareButtons({
  buildId,
  buildJson,
  build,
  scores,
  compatResult,
  buildUrl: buildUrlProp,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState<"link" | "share" | "reddit" | "markdown" | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [generating, setGenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/results/${buildId}`
      : "";
  const shareableUrl = build ? buildShareUrl(build) : "";
  const buildUrl = buildUrlProp ?? shareableUrl ?? url;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleCopy = async (text: string, kind: "link" | "share" | "reddit" | "markdown") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast("success", "Link copied! Anyone with this link can view your build");
      setTimeout(() => setCopied(null), 3000);
    } catch {
      toast("error", "Failed to copy");
    }
  };

  const handleCopyReddit = () => {
    if (!build || !scores || !compatResult) return;
    const text = generateRedditPost(
      { parts: build.parts, preset: build.preset, targetId: build.targetId },
      scores,
      compatResult
    );
    navigator.clipboard.writeText(text).then(
      () => {
        toast("success", "Reddit post copied to clipboard!");
        setCopied("reddit");
        setTimeout(() => setCopied(null), 3000);
      },
      () => toast("error", "Failed to copy")
    );
  };

  const handleCopyMarkdown = () => {
    if (!build || !scores || !compatResult) return;
    const text = generateMarkdownPost(
      { parts: build.parts, preset: build.preset, targetId: build.targetId },
      scores,
      compatResult
    );
    navigator.clipboard.writeText(text).then(
      () => {
        toast("success", "Markdown copied to clipboard!");
        setCopied("markdown");
        setTimeout(() => setCopied(null), 3000);
      },
      () => toast("error", "Failed to copy")
    );
  };

  const handleGenerateBuildCard = async () => {
    if (!build || !scores || !compatResult) return;
    setGenerating(true);
    try {
      const html = generateBuildCardHTML(
        { parts: build.parts, preset: build.preset },
        scores,
        compatResult
      );
      const w = window.open("", "_blank", "width=1200,height=630");
      if (w) {
        w.document.write(html);
        w.document.close();
        toast("success", "Build card opened in new window. Screenshot or save as image.");
      } else {
        toast("warning", "Allow pop-ups to open the build card.");
      }
    } catch (err) {
      console.error("Failed to generate build card:", err);
      toast("error", "Failed to generate build card");
    } finally {
      setGenerating(false);
      setShowMenu(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(buildUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = "build-qr-code.png";
      link.click();
      toast("success", "QR code downloaded!");
      setShowMenu(false);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
      toast("error", "Failed to generate QR code");
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([buildJson], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pc-build-${buildId}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setShowMenu(false);
  };

  const successMessage = "Link copied! Anyone with this link can view your build";
  const hasPremiumShare = build && scores && compatResult;

  if (hasPremiumShare) {
    return (
      <div className="relative flex flex-wrap gap-2" ref={menuRef}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMenu(!showMenu)}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Build
        </Button>

        {showMenu && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-zinc-200 bg-white py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => {
                handleCopy(url, "link");
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Copy className="h-4 w-4" />
              {copied === "link" ? successMessage : "Copy Link"}
            </button>
            {shareableUrl && (
              <button
                type="button"
                onClick={() => {
                  handleCopy(shareableUrl, "share");
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Link2 className="h-4 w-4" />
                {copied === "share" ? successMessage : "Copy Shareable URL"}
              </button>
            )}
            <button
              type="button"
              onClick={handleGenerateBuildCard}
              disabled={generating}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              <ImageIcon className="h-4 w-4" />
              {generating ? "Generating…" : "Generate Build Card"}
            </button>
            <button
              type="button"
              onClick={() => {
                handleCopyReddit();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <FileText className="h-4 w-4" />
              {copied === "reddit" ? "Copied!" : "Copy Reddit Post"}
            </button>
            <button
              type="button"
              onClick={() => {
                handleCopyMarkdown();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <FileText className="h-4 w-4" />
              {copied === "markdown" ? "Copied!" : "Copy Markdown"}
            </button>
            <button
              type="button"
              onClick={handleGenerateQR}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <QrCode className="h-4 w-4" />
              Download QR Code
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
        )}
      </div>
    );
  }

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
      <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-2">
        <Download className="h-4 w-4" />
        Export JSON
      </Button>
    </div>
  );
}
