"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ChevronRight, ChevronLeft, Zap } from "lucide-react";

export interface WizardAnswers {
  useCase: "gaming" | "creator" | "workstation" | "home-office" | "mixed";
  budget: "under-800" | "800-1200" | "1200-1800" | "1800-plus";
  size: "full-tower" | "mid-tower" | "compact" | "mini-itx";
  priorities: string[];
  region?: string;
}

interface BuildGoalsWizardProps {
  isOpen: boolean;
  onComplete: (answers: WizardAnswers) => void;
  onSkip: () => void;
}

const STEP_KEYS: (keyof WizardAnswers)[] = ["useCase", "budget", "size", "priorities"];

export function BuildGoalsWizard({ isOpen, onComplete, onSkip }: BuildGoalsWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<WizardAnswers>>({});

  if (!isOpen) return null;

  const steps = [
    {
      title: "What will you use this PC for?",
      subtitle: "This helps us recommend the right balance of components",
      key: "useCase" as const,
      options: [
        { id: "gaming", label: "Gaming", icon: "🎮", description: "Prioritize GPU and high refresh rate" },
        { id: "creator", label: "Content Creation", icon: "🎨", description: "Video editing, 3D rendering, design" },
        { id: "workstation", label: "Professional Work", icon: "💼", description: "CAD, simulation, data processing" },
        { id: "home-office", label: "Home & Office", icon: "🏠", description: "Browsing, productivity, light work" },
        { id: "mixed", label: "Mixed Use", icon: "🔀", description: "Gaming + productivity combined" },
      ],
    },
    {
      title: "What's your budget?",
      subtitle: "We'll find the best components for your price range",
      key: "budget" as const,
      options: [
        { id: "under-800", label: "Under $800", icon: "💰", description: "Entry-level, budget-friendly" },
        { id: "800-1200", label: "$800 - $1,200", icon: "💵", description: "Solid mid-range performance" },
        { id: "1200-1800", label: "$1,200 - $1,800", icon: "💸", description: "High performance, great value" },
        { id: "1800-plus", label: "$1,800+", icon: "💎", description: "Enthusiast, no compromises" },
      ],
    },
    {
      title: "What size PC do you want?",
      subtitle: "This affects case and cooling options",
      key: "size" as const,
      options: [
        { id: "full-tower", label: "Full Tower", icon: "🏢", description: "Maximum space, best cooling" },
        { id: "mid-tower", label: "Mid Tower", icon: "🏛️", description: "Best balance, most popular" },
        { id: "compact", label: "Compact", icon: "🏘️", description: "Smaller footprint, good balance" },
        { id: "mini-itx", label: "Mini-ITX", icon: "🏠", description: "Smallest, most challenging" },
      ],
    },
    {
      title: "What else matters to you?",
      subtitle: "Select all that apply",
      key: "priorities" as const,
      multiSelect: true,
      options: [
        { id: "performance", label: "Maximum Performance", icon: "⚡", description: "Fastest components available" },
        { id: "quiet", label: "Quiet Operation", icon: "🔇", description: "Low noise, good cooling" },
        { id: "rgb", label: "RGB Lighting", icon: "🌈", description: "Customizable aesthetics" },
        { id: "upgradability", label: "Future-Proof", icon: "🔮", description: "Easy to upgrade later" },
        { id: "efficiency", label: "Power Efficiency", icon: "🌱", description: "Lower power consumption" },
      ],
    },
  ];

  const currentStepData = steps[step];
  const currentKey = currentStepData.key;

  const handleSelect = (optionId: string) => {
    if (currentStepData.multiSelect) {
      const current = answers.priorities ?? [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setAnswers({ ...answers, priorities: updated });
    } else {
      setAnswers({ ...answers, [currentKey]: optionId });
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete({
        useCase: (answers.useCase ?? "mixed") as WizardAnswers["useCase"],
        budget: (answers.budget ?? "800-1200") as WizardAnswers["budget"],
        size: (answers.size ?? "mid-tower") as WizardAnswers["size"],
        priorities: answers.priorities ?? [],
        region: answers.region,
      });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const canProceed = currentStepData.multiSelect
    ? (answers.priorities?.length ?? 0) >= 0
    : !!answers[currentKey];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="flex min-h-screen flex-col">
        <div className="border-b border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-foreground" />
              <span className="font-semibold text-foreground">Build Setup</span>
            </div>
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-zinc-500 transition-colors hover:text-foreground dark:text-zinc-400"
            >
              Skip wizard
            </button>
          </div>
        </div>

        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 py-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-foreground" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold text-foreground">
                {currentStepData.title}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400">
                {currentStepData.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {currentStepData.options.map((option) => {
                const isSelected = currentStepData.multiSelect
                  ? (answers.priorities ?? []).includes(option.id)
                  : answers[currentKey] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`rounded-lg border-2 p-6 text-left transition-all hover:border-foreground/50 ${
                      isSelected
                        ? "border-foreground bg-foreground/10 dark:bg-foreground/10"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{option.icon}</div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2 font-semibold text-foreground">
                          {option.label}
                          {isSelected && (
                            <Badge variant="success" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Step {step + 1} of {steps.length}
            </span>

            <Button onClick={handleNext} disabled={!canProceed}>
              {step < steps.length - 1 ? "Next" : "Generate Build"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
