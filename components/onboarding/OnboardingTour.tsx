"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface TourStep {
  title: string;
  description: string;
  target?: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to PC Build Advisor",
    description:
      "We'll help you build a compatible PC with real-time checks and smart recommendations. This quick tour will show you around.",
    position: "bottom",
  },
  {
    title: "Add Components",
    description:
      "Click 'Add' on any component to browse our catalog. We'll validate compatibility as you go.",
    target: "[data-tour='component-card']",
    position: "right",
  },
  {
    title: "Live Status",
    description:
      "Watch your build progress and see compatibility issues in real-time here.",
    target: "[data-tour='live-status']",
    position: "left",
  },
  {
    title: "View Analysis",
    description:
      "When ready, click here to see detailed compatibility checks, performance scores, and upgrade recommendations.",
    target: "[data-tour='view-results']",
    position: "top",
  },
];

const STORAGE_KEY = "pc-build-advisor-hasSeenTour";

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) setShow(true);
  }, []);

  const handleClose = () => {
    setShow(false);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!show) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={handleClose}
        aria-hidden
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-desc"
      >
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h3
                id="tour-title"
                className="text-lg font-semibold text-foreground mb-2"
              >
                {step.title}
              </h3>
              <p
                id="tour-desc"
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                {step.description}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="ml-4 text-zinc-500 hover:text-foreground"
              aria-label="Close tour"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-8 rounded-full transition-colors",
                    i === currentStep ? "bg-foreground" : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                  aria-hidden
                />
              ))}
            </div>

            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-zinc-500 hover:text-foreground underline underline-offset-2"
              >
                Skip tutorial
              </button>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrevious}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={handleNext}>
                  {currentStep < TOUR_STEPS.length - 1 ? (
                    <>
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
