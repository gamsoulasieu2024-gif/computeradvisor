"use client";

import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

interface ConfidenceIndicatorProps {
  confidence: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ConfidenceIndicator({
  confidence,
  size = "md",
  showLabel = true,
}: ConfidenceIndicatorProps) {
  const level =
    confidence >= 80 ? "high" : confidence >= 50 ? "medium" : "low";

  const config = {
    high: {
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/50",
      border: "border-green-200 dark:border-green-800",
      icon: CheckCircle,
      label: "High Confidence",
    },
    medium: {
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/50",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: HelpCircle,
      label: "Medium Confidence",
    },
    low: {
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/50",
      border: "border-red-200 dark:border-red-800",
      icon: AlertCircle,
      label: "Low Confidence",
    },
  }[level];

  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1.5",
    md: "text-sm px-3 py-1.5 gap-2",
    lg: "text-base px-4 py-2 gap-2",
  }[size];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-full border ${config.border} ${config.bg} ${sizeClasses}`}
    >
      <Icon className={`${iconSizes} shrink-0 ${config.color}`} />
      {showLabel && (
        <span className={`font-medium ${config.color}`}>
          {config.label} ({confidence}%)
        </span>
      )}
    </div>
  );
}
