"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, Star, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  getAllTemplates,
  getFeaturedTemplates,
  filterTemplates,
  searchTemplates,
} from "@/lib/templates/template-loader";
import type { BuildTemplate, TemplateCategory, BudgetTier } from "@/types/template";

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  gaming: "Gaming",
  creator: "Creator",
  workstation: "Workstation",
  "home-office": "Home Office",
  streaming: "Streaming",
  budget: "Budget",
  enthusiast: "Enthusiast",
};

const BUDGET_LABELS: Record<BudgetTier, string> = {
  "under-800": "Under $800",
  "800-1200": "$800 - $1,200",
  "1200-1800": "$1,200 - $1,800",
  "1800-2500": "$1,800 - $2,500",
  "2500-plus": "$2,500+",
};

function calculateTotalPrice(template: BuildTemplate): number {
  const p = template.build.selectedParts;
  let sum = 0;
  if (p.cpu?.price_usd) sum += p.cpu.price_usd;
  if (p.gpu?.price_usd) sum += p.gpu.price_usd;
  if (p.motherboard?.price_usd) sum += p.motherboard.price_usd;
  if (p.ram?.price_usd) sum += p.ram.price_usd;
  if (p.psu?.price_usd) sum += p.psu.price_usd;
  if (p.cooler?.price_usd) sum += p.cooler.price_usd;
  if (p.case?.price_usd) sum += p.case.price_usd;
  if (Array.isArray(p.storage)) {
    for (const s of p.storage) if (s?.price_usd) sum += s.price_usd;
  }
  return sum;
}

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    TemplateCategory | "all"
  >("all");
  const [selectedBudget, setSelectedBudget] = useState<BudgetTier | "all">(
    "all"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const templates = useMemo(() => {
    if (searchQuery.trim()) {
      return searchTemplates(searchQuery);
    }
    const filters: {
      category?: TemplateCategory;
      budgetTier?: BudgetTier;
      difficulty?: string;
    } = {};
    if (selectedCategory !== "all") filters.category = selectedCategory;
    if (selectedBudget !== "all") filters.budgetTier = selectedBudget;
    if (selectedDifficulty !== "all") filters.difficulty = selectedDifficulty;
    return Object.keys(filters).length > 0
      ? filterTemplates(filters)
      : getAllTemplates();
  }, [searchQuery, selectedCategory, selectedBudget, selectedDifficulty]);

  const featuredTemplates = useMemo(
    () => getFeaturedTemplates().slice(0, 3),
    []
  );

  const categories: { value: TemplateCategory | "all"; label: string }[] = [
    { value: "all", label: "All Categories" },
    { value: "gaming", label: "Gaming" },
    { value: "creator", label: "Creator" },
    { value: "workstation", label: "Workstation" },
    { value: "streaming", label: "Streaming" },
    { value: "budget", label: "Budget" },
    { value: "enthusiast", label: "Enthusiast" },
  ];

  const budgetTiers: { value: BudgetTier | "all"; label: string }[] = [
    { value: "all", label: "All Budgets" },
    { value: "under-800", label: "Under $800" },
    { value: "800-1200", label: "$800 - $1,200" },
    { value: "1200-1800", label: "$1,200 - $1,800" },
    { value: "1800-2500", label: "$1,800 - $2,500" },
    { value: "2500-plus", label: "$2,500+" },
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Build Templates
        </h1>
        <p className="text-muted-foreground">
          Expert-curated PC builds for every budget and use case
        </p>
      </div>

      {/* Featured Templates */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold text-foreground">
            Featured Builds
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredTemplates.map((template) => {
            const totalPrice = calculateTotalPrice(template);
            return (
              <Link
                key={template.metadata.id}
                href={`/templates/${template.metadata.id}`}
                className="rounded-lg border border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10 p-6 transition-all hover:border-primary"
              >
                <div className="mb-3 flex items-start justify-between">
                  <Badge variant="warning" className="text-xs">
                    ⭐ Featured
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {template.metadata.difficulty}
                  </Badge>
                </div>

                <h3 className="mb-2 font-semibold text-foreground">
                  {template.metadata.name}
                </h3>

                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                  {template.metadata.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">
                    ${totalPrice.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {(template.metadata.popularity ?? 0).toLocaleString()} uses
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-foreground"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <Filter className="h-5 w-5 flex-shrink-0 text-muted-foreground" />

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as TemplateCategory | "all")
            }
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={selectedBudget}
            onChange={(e) =>
              setSelectedBudget(e.target.value as BudgetTier | "all")
            }
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground"
          >
            {budgetTiers.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground"
          >
            {difficulties.map((diff) => (
              <option key={diff.value} value={diff.value}>
                {diff.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {templates.length} template
          {templates.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            No templates found matching your criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const totalPrice = calculateTotalPrice(template);

            return (
              <Link
                key={template.metadata.id}
                href={`/templates/${template.metadata.id}`}
                className="overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50"
              >
                <div className="border-b border-border bg-muted/30 p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 font-semibold text-foreground">
                        {template.metadata.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {template.metadata.version}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs capitalize">
                      {template.metadata.category}
                    </Badge>
                    {template.metadata.targetResolution && (
                      <Badge variant="outline" className="text-xs">
                        {template.metadata.targetResolution}
                      </Badge>
                    )}
                    <Badge
                      variant={
                        template.metadata.difficulty === "beginner"
                          ? "success"
                          : template.metadata.difficulty === "intermediate"
                            ? "warning"
                            : "error"
                      }
                      className="text-xs capitalize"
                    >
                      {template.metadata.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                    {template.metadata.description}
                  </p>

                  <div className="mb-4 space-y-2 text-xs">
                    {template.build.selectedParts.cpu && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPU:</span>
                        <span className="ml-2 truncate font-medium text-foreground">
                          {template.build.selectedParts.cpu.name
                            .split(" ")
                            .slice(0, 3)
                            .join(" ")}
                        </span>
                      </div>
                    )}
                    {template.build.selectedParts.gpu && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GPU:</span>
                        <span className="ml-2 truncate font-medium text-foreground">
                          {template.build.selectedParts.gpu.name
                            .split(" ")
                            .slice(0, 3)
                            .join(" ")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xl font-bold text-foreground">
                      ${totalPrice.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      {(template.metadata.popularity ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
