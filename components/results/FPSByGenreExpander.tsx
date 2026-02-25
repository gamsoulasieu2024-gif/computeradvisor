"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FPSEstimate } from "@/lib/performance/fps-estimation";

interface FPSByGenreExpanderProps {
  estimates: {
    aaa: FPSEstimate;
    esports: FPSEstimate;
    indie: FPSEstimate;
    simulation: FPSEstimate;
  };
}

export function FPSByGenreExpander({ estimates }: FPSByGenreExpanderProps) {
  const [expanded, setExpanded] = useState(false);

  const genres = [
    {
      id: "aaa" as const,
      label: "AAA Titles",
      icon: "🎮",
      example: "Cyberpunk, Starfield",
    },
    {
      id: "esports" as const,
      label: "Esports",
      icon: "⚡",
      example: "CS2, Valorant, League",
    },
    {
      id: "indie" as const,
      label: "Indie Games",
      icon: "🎨",
      example: "Hades, Stardew Valley",
    },
    {
      id: "simulation" as const,
      label: "Simulation",
      icon: "✈️",
      example: "Flight Sim, Cities Skylines",
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-muted"
      >
        <span className="text-sm font-medium text-foreground">
          Performance by Game Type
        </span>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border p-6">
          {genres.map((genre) => {
            const estimate = estimates[genre.id];
            return (
              <div
                key={genre.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{genre.icon}</span>
                  <div>
                    <div className="font-medium text-foreground">
                      {genre.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {genre.example}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {estimate.likely} FPS
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {estimate.min}–{estimate.max}
                  </div>
                </div>
              </div>
            );
          })}

          <p className="italic text-xs text-muted-foreground">
            These are rough estimates. Actual performance varies by specific
            game.
          </p>
        </div>
      )}
    </div>
  );
}
