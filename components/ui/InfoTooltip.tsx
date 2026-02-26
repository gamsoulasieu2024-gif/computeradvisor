"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

interface InfoTooltipProps {
  title: string;
  content: string | React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function InfoTooltip({ title, content, size = "sm" }: InfoTooltipProps) {
  const [showModal, setShowModal] = useState(false);

  const iconSize = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-primary"
        aria-label={`More info about ${title}`}
      >
        <Info className={iconSize} />
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-tooltip-title"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <h3 id="info-tooltip-title" className="font-semibold text-foreground">{title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {typeof content === "string" ? (
                <div className="whitespace-pre-line text-sm text-muted-foreground">{content}</div>
              ) : (
                content
              )}
            </div>
            <div className="flex justify-end border-t border-border p-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
