"use client";

import { Clock, AlertTriangle, Lightbulb, Star, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  calculateBuildDifficulty,
  getDifficultyBadgeVariant,
  getDifficultyColor,
} from "@/lib/difficulty/difficulty-analyzer";
import type { BuildInput } from "@/lib/compatibility/types";

interface DifficultyRatingCardProps {
  build: BuildInput;
}

export function DifficultyRatingCard({ build }: DifficultyRatingCardProps) {
  const rating = calculateBuildDifficulty(build);

  const hours = Math.floor(rating.estimatedTimeMinutes / 60);
  const minutes = rating.estimatedTimeMinutes % 60;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Build Difficulty</h3>
          </div>
          <Badge variant={getDifficultyBadgeVariant(rating.level)}>
            {rating.level.charAt(0).toUpperCase() + rating.level.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{rating.summary}</p>
      </div>

      {/* Score & Time */}
      <div className="p-6 border-b border-border">
        <div className="grid grid-cols-2 gap-6">
          {/* Difficulty Score */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Difficulty Score</div>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${getDifficultyColor(rating.level)}`}>
                {rating.score}
              </div>
              <div className="text-sm text-muted-foreground">/ 10</div>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  rating.level === "beginner"
                    ? "bg-green-500"
                    : rating.level === "intermediate"
                      ? "bg-yellow-500"
                      : rating.level === "advanced"
                        ? "bg-orange-500"
                        : "bg-red-500"
                }`}
                style={{ width: `${(rating.score / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Estimated Time</div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold text-foreground">
                {hours > 0 ? `${hours}h ` : ""}
                {minutes}m
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              For experienced builders: -{Math.round(rating.estimatedTimeMinutes * 0.3)}m
            </div>
          </div>
        </div>
      </div>

      {/* Complexity Factors */}
      {rating.factors.length > 0 && (
        <div className="p-6 border-b border-border">
          <h4 className="font-semibold text-foreground mb-4">
            What Makes This Build Challenging?
          </h4>
          <div className="space-y-3">
            {rating.factors.map((factor, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: factor.impact }).map((_, j) => (
                      <Star
                        key={j}
                        className={`h-3 w-3 ${
                          factor.impact <= 2
                            ? "fill-yellow-400 text-yellow-400"
                            : factor.impact <= 3
                              ? "fill-orange-400 text-orange-400"
                              : "fill-red-400 text-red-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground text-sm">
                    {factor.factor}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {factor.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {rating.warnings.length > 0 && (
        <div className="p-6 border-b border-border bg-yellow-50 dark:bg-yellow-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Important Warnings
              </h4>
              <ul className="space-y-1">
                {rating.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-yellow-800 dark:text-yellow-200">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {rating.tips.length > 0 && (
        <div className="p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-2">Assembly Tips</h4>
              <ul className="space-y-1.5">
                {rating.tips.slice(0, 5).map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    💡 {tip}
                  </li>
                ))}
              </ul>
              {rating.tips.length > 5 && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline mt-2"
                >
                  Show {rating.tips.length - 5} more tips
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

