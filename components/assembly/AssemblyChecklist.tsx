"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  generateAssemblyChecklist,
  type AssemblyChecklist as ChecklistType,
  type ChecklistStep,
} from "@/lib/assembly/checklist-generator";
import type { Build } from "@/types/build";

interface AssemblyChecklistProps {
  build: Build;
}

export function AssemblyChecklist({ build }: AssemblyChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistType | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());

  const storageKey = `assembly-progress-${build.id || "current"}`;

  useEffect(() => {
    const generated = generateAssemblyChecklist(build);
    setChecklist(generated);

    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: string[] = JSON.parse(saved);
        setCompletedSteps(new Set(parsed));
      } catch {
        // ignore invalid data
      }
    }
  }, [build, storageKey]);

  const toggleStep = (stepId: string) => {
    const next = new Set(completedSteps);
    if (next.has(stepId)) {
      next.delete(stepId);
    } else {
      next.add(stepId);
    }
    setCompletedSteps(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
    }
  };

  const toggleSection = (index: number) => {
    const next = new Set(expandedSections);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExpandedSections(next);
  };

  const toggleDetails = (stepId: string) => {
    const next = new Set(openDetails);
    if (next.has(stepId)) {
      next.delete(stepId);
    } else {
      next.add(stepId);
    }
    setOpenDetails(next);
  };

  const resetProgress = () => {
    if (typeof window !== "undefined" && window.confirm("Reset all progress? This cannot be undone.")) {
      setCompletedSteps(new Set());
      window.localStorage.removeItem(storageKey);
    }
  };

  if (!checklist) return null;

  const totalSteps = checklist.sections.reduce(
    (sum, section) => sum + section.steps.length,
    0
  );
  const completedCount = completedSteps.size;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  const hours = Math.floor(checklist.totalEstimatedMinutes / 60);
  const minutes = checklist.totalEstimatedMinutes % 60;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-lg font-semibold text-foreground">
              Assembly Checklist
            </h3>
            <p className="text-sm text-muted-foreground">
              Step-by-step guide tailored to your parts
            </p>
          </div>
          <Badge
            variant={
              checklist.difficulty === "beginner"
                ? "success"
                : checklist.difficulty === "intermediate"
                  ? "warning"
                  : "error"
            }
          >
            {checklist.difficulty}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Progress: {completedCount} / {totalSteps} steps
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Est. time: {hours > 0 ? `${hours}h ` : ""}
              {minutes}m
            </span>
          </div>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={resetProgress}
              className="text-xs text-red-500 hover:underline"
            >
              Reset progress
            </button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-border">
        {checklist.sections.map((section, sectionIndex) => {
          const sectionCompleted = section.steps.filter((s) =>
            completedSteps.has(s.id)
          ).length;
          const isExpanded = expandedSections.has(sectionIndex);

          return (
            <div key={section.title}>
              {/* Section Header */}
              <button
                type="button"
                onClick={() => toggleSection(sectionIndex)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      sectionCompleted === section.steps.length
                        ? "bg-green-500"
                        : sectionCompleted > 0
                          ? "bg-yellow-500"
                          : "bg-muted"
                    }`}
                  >
                    {sectionCompleted === section.steps.length ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {sectionCompleted}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-foreground">
                      {section.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {sectionCompleted} / {section.steps.length} complete
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Section Steps */}
              {isExpanded && (
                <div className="bg-muted/20">
                  {section.steps.map((step) => {
                    const isCompleted = completedSteps.has(step.id);
                    const showDetails = openDetails.has(step.id);

                    return (
                      <div
                        key={step.id}
                        className={`border-t border-border ${
                          isCompleted ? "opacity-60" : ""
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => toggleStep(step.id)}
                              className="mt-1 flex-shrink-0"
                            >
                              {isCompleted ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                              ) : (
                                <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
                              )}
                            </button>

                            <div className="flex-1">
                              <div className="mb-2 flex items-start justify-between">
                                <div className="flex-1">
                                  <h5
                                    className={`font-medium ${
                                      isCompleted
                                        ? "line-through text-muted-foreground"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {step.title}
                                  </h5>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {step.description}
                                  </p>
                                </div>
                                <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {step.estimatedMinutes}m
                                  </Badge>
                                  <Badge
                                    variant={
                                      step.difficulty === "easy"
                                        ? "success"
                                        : step.difficulty === "medium"
                                          ? "warning"
                                          : "error"
                                    }
                                    className="text-xs"
                                  >
                                    {step.difficulty}
                                  </Badge>
                                </div>
                              </div>

                              {(step.warnings?.length || step.tips?.length) && (
                                <button
                                  type="button"
                                  onClick={() => toggleDetails(step.id)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  {showDetails ? "Hide" : "Show"} tips & warnings
                                </button>
                              )}

                              {showDetails && (
                                <StepDetails step={step} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedCount === totalSteps && totalSteps > 0 && (
        <div className="border-t border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/30">
          <div className="text-center">
            <div className="mb-3 text-4xl">🎉</div>
            <h4 className="mb-2 text-lg font-bold text-green-900 dark:text-green-100">
              Congratulations!
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              You've completed your PC build. Next up: enter BIOS, check temps, and install your operating system.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StepDetails({ step }: { step: ChecklistStep }) {
  return (
    <div className="mt-3 space-y-3">
      {step.warnings && step.warnings.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <div className="mb-1 text-sm font-medium text-red-900 dark:text-red-100">
                Warnings
              </div>
              <ul className="space-y-1">
                {step.warnings.map((warning) => (
                  <li
                    key={warning}
                    className="text-xs text-red-800 dark:text-red-200"
                  >
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {step.tips && step.tips.length > 0 && (
        <div className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <div className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100">
                Tips
              </div>
              <ul className="space-y-1">
                {step.tips.map((tip) => (
                  <li
                    key={tip}
                    className="text-xs text-blue-800 dark:text-blue-200"
                  >
                    💡 {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

