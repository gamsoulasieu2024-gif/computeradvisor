"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { SCORE_EXPLANATIONS } from "@/lib/scoring/explanations-detailed";
import type { Score } from "@/lib/scoring/types";

interface ScoreCardProps {
  name: string;
  score: Score;
}

export function ScoreCard({ name, score }: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  const value = score.value;
  const target = score.targetName;
  const evaluation = score.targetEvaluation;
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

  const explanation = (SCORE_EXPLANATIONS as Record<string, { title: string; content: React.ReactNode }>)[name];

  return (
    <div className="animate-count-up rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium capitalize text-foreground">{name}</h3>
          {explanation && (
            <InfoTooltip title={explanation.title} content={explanation.content} size="sm" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs text-zinc-500",
              score.confidence < 80 && "text-warning"
            )}
          >
            {confidenceLabel} confidence
          </span>
          <InfoTooltip
            title="Score Confidence"
            content="Confidence reflects how complete our data is. Missing specs (like case clearances or GPU thickness) reduce confidence."
            size="sm"
          />
        </div>
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

      {target && evaluation && name === "performance" && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Target: {target}</span>
            <Badge variant={evaluation.meetsTarget ? "success" : "warning"}>
              {evaluation.meetsTarget ? "✓ Meets Target" : "⚠ Below Target"}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-zinc-500">CPU: </span>
              <span
                className={cn(
                  "ml-1 font-medium",
                  evaluation.cpuFit === "exceeds" && "text-green-600 dark:text-green-400",
                  evaluation.cpuFit === "below" && "text-red-500",
                  evaluation.cpuFit === "meets" && "text-foreground"
                )}
              >
                {evaluation.cpuFit}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">GPU: </span>
              <span
                className={cn(
                  "ml-1 font-medium",
                  evaluation.gpuFit === "exceeds" && "text-green-600 dark:text-green-400",
                  evaluation.gpuFit === "below" && "text-red-500",
                  evaluation.gpuFit === "meets" && "text-foreground"
                )}
              >
                {evaluation.gpuFit}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">RAM: </span>
              <span
                className={cn(
                  "ml-1 font-medium",
                  evaluation.ramFit === "exceeds" && "text-green-600 dark:text-green-400",
                  evaluation.ramFit === "below" && "text-red-500",
                  evaluation.ramFit === "meets" && "text-foreground"
                )}
              >
                {evaluation.ramFit}
              </span>
            </div>
          </div>
          {evaluation.bottleneck !== "none" && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              ⚠ {evaluation.bottleneck.toUpperCase()} may bottleneck this target
            </p>
          )}
        </div>
      )}

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
