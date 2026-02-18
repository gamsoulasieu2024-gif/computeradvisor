"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Score } from "@/lib/scoring/types";

interface ScoreCardProps {
  name: string;
  score: Score;
}

export function ScoreCard({ name, score }: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  const value = score.value;
  const color =
    value >= 80
      ? "success"
      : value >= 60
        ? "warning"
        : value >= 40
          ? "bg-amber-500"
          : "error";

  const confidenceLabel =
    score.confidence >= 80 ? "High" : score.confidence >= 50 ? "Medium" : "Low";

  return (
    <div className="animate-count-up rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between">
        <h3 className="font-medium capitalize text-foreground">{name}</h3>
        <span
          className={cn(
            "text-xs text-zinc-500",
            score.confidence < 80 && "text-warning"
          )}
        >
          {confidenceLabel} confidence
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-zinc-200 dark:text-zinc-700"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${value}, 100`}
              strokeLinecap="round"
              className={cn(
                "transition-all",
                color === "success" && "text-success",
                color === "warning" && "text-warning",
                color === "error" && "text-error",
                color === "bg-amber-500" && "text-amber-500"
              )}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
            {value}
          </span>
        </div>
        <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
          {score.summary}
        </p>
      </div>

      {score.breakdown.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {expanded ? (
              <>
                Hide breakdown <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                View breakdown <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
          {expanded && (
            <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              {score.breakdown.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-zinc-50 p-2 text-sm dark:bg-zinc-800/50"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{item.factor}</span>
                    <span
                      className={cn(
                        item.impact >= 0 ? "text-success" : "text-error"
                      )}
                    >
                      {item.impact >= 0 ? "+" : ""}
                      {item.impact}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{item.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
