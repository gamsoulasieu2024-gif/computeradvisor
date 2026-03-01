"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Zap,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getTemplateById,
  getSimilarTemplates,
  incrementTemplateUsage,
} from "@/lib/templates/template-loader";
import { saveBuild } from "@/lib/storage/build-storage";
import { useBuild } from "@/hooks/use-build";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/components/ui/Toast";
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

const PART_CATEGORIES = [
  { key: "cpu" as const, label: "CPU", icon: "🔲" },
  { key: "gpu" as const, label: "GPU", icon: "🎮" },
  { key: "motherboard" as const, label: "Motherboard", icon: "🔌" },
  { key: "ram" as const, label: "RAM", icon: "💾" },
  { key: "storage" as const, label: "Storage", icon: "💿" },
  { key: "psu" as const, label: "PSU", icon: "⚡" },
  { key: "cooler" as const, label: "Cooler", icon: "❄️" },
  { key: "case" as const, label: "Case", icon: "📦" },
];

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

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { loadBuildFromTemplate } = useBuild();
  const { format } = useCurrency();
  const { toast } = useToast();
  const id = params.id as string;

  const template = getTemplateById(id);
  const similarTemplates = template ? getSimilarTemplates(id, 3) : [];

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Template not found</p>
        <div className="mt-4 text-center">
          <Button as="link" href="/templates">
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const totalPrice = calculateTotalPrice(template);
  const m = template.metadata;
  const parts = template.build.selectedParts;

  const handleUseTemplate = () => {
    saveBuild(
      {
        parts: template.build.selectedParts,
        preset: template.build.preset,
        manualOverrides: template.build.manualOverrides,
        targetId: template.build.targetId,
      },
      `${m.name} (from template)`,
      `Started from ${m.name} template`
    );
    incrementTemplateUsage(m.id);
    loadBuildFromTemplate(template.build);
    router.push("/build");
  };

  const handleViewResults = () => {
    loadBuildFromTemplate(template.build);
    router.push("/results/current");
  };

  const handleShare = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/templates/${m.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("success", "Link copied to clipboard");
    } catch {
      toast("error", "Failed to copy link");
    }
  };

  const getPart = (key: (typeof PART_CATEGORIES)[number]["key"]) => {
    if (key === "storage") return Array.isArray(parts.storage) ? parts.storage[0] : null;
    return parts[key];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" size="sm" className="mb-6" as="link" href="/templates">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Templates
      </Button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">
                    {m.name}
                  </h1>
                  {m.featured && (
                    <Badge variant="warning">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                </div>
                <p className="mb-4 text-muted-foreground">{m.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {m.category}
                  </Badge>
                  <Badge variant="outline">{m.version}</Badge>
                  <Badge
                    variant={
                      m.difficulty === "beginner"
                        ? "success"
                        : m.difficulty === "intermediate"
                          ? "warning"
                          : "error"
                    }
                    className="capitalize"
                  >
                    {m.difficulty}
                  </Badge>
                  {m.targetResolution && (
                    <Badge variant="outline">
                      {m.targetResolution}
                      {m.targetRefreshRate ? ` @ ${m.targetRefreshRate}Hz` : ""}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="mb-1 text-3xl font-bold text-foreground">
                  {format(totalPrice)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(m.popularity ?? 0).toLocaleString()} uses
                </div>
              </div>
            </div>

            {m.estimatedPerformance && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="mb-1 font-medium text-blue-900 dark:text-blue-100">
                      Expected Performance
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      {m.estimatedPerformance}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Components List */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border bg-muted/30 p-4">
              <h2 className="text-xl font-semibold text-foreground">
                Components
              </h2>
            </div>
            <div className="divide-y divide-border">
              {PART_CATEGORIES.map(({ key, label, icon }) => {
                const part = getPart(key);
                if (!part) return null;
                const p = part as {
                  name: string;
                  price_usd?: number;
                  specs?: Record<string, unknown>;
                };
                const specs = p.specs ?? {};
                return (
                  <div key={key} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{icon}</div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            {label}
                          </span>
                          {p.price_usd != null && (
                            <span className="text-sm font-semibold text-foreground">
                              {format(p.price_usd)}
                            </span>
                          )}
                        </div>
                        <div className="mb-2 font-medium text-foreground">
                          {p.name}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {key === "cpu" && (
                            <>
                              {specs.cores != null && specs.threads != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.cores)}C/{String(specs.threads)}T
                                </Badge>
                              )}
                              {specs.base_clock_ghz != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.base_clock_ghz)} GHz
                                </Badge>
                              )}
                              {specs.tdp_w != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.tdp_w)}W TDP
                                </Badge>
                              )}
                            </>
                          )}
                          {key === "gpu" && (
                            <>
                              {specs.vram_gb != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.vram_gb)}GB VRAM
                                </Badge>
                              )}
                              {specs.length_mm != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.length_mm)}mm
                                </Badge>
                              )}
                            </>
                          )}
                          {key === "ram" && (
                            <>
                              {specs.capacity_gb != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.capacity_gb)}GB
                                </Badge>
                              )}
                              {specs.speed_mhz != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.speed_mhz)} MHz
                                </Badge>
                              )}
                            </>
                          )}
                          {key === "storage" && (
                            <>
                              {specs.capacity_gb != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.capacity_gb)}GB
                                </Badge>
                              )}
                              {specs.interface != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.interface).toUpperCase()}
                                </Badge>
                              )}
                            </>
                          )}
                          {key === "psu" && (
                            <>
                              {specs.wattage_w != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.wattage_w)}W
                                </Badge>
                              )}
                              {specs.efficiency != null && (
                                <Badge variant="outline" className="text-xs">
                                  {String(specs.efficiency)}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {Array.isArray(parts.storage) && parts.storage.length > 1 && (
                <div className="bg-muted/20 p-4">
                  <div className="mb-2 text-sm text-muted-foreground">
                    Additional Storage:
                  </div>
                  {parts.storage.slice(1).map((drive, i) => (
                    <div
                      key={drive?.id ?? i}
                      className="mb-1 flex justify-between text-sm"
                    >
                      <span className="text-foreground">{drive?.name}</span>
                      {drive?.price_usd != null && (
                        <span className="font-medium">
                          {format(drive.price_usd)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">
                  Total Build Cost
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {format(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/30">
              <div className="mb-4 flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Pros
                </h3>
              </div>
              <ul className="space-y-2">
                {m.pros.map((pro, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200"
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950/30">
              <div className="mb-4 flex items-center gap-2">
                <ThumbsDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Cons
                </h3>
              </div>
              <ul className="space-y-2">
                {m.cons.map((con, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-orange-800 dark:text-orange-200"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ideal For / Not Ideal For */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-foreground">
                ✅ Ideal For
              </h3>
              <ul className="space-y-2">
                {m.idealFor.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-foreground">
                ❌ Not Ideal For
              </h3>
              <ul className="space-y-2">
                {m.notIdealFor.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Similar Templates */}
          {similarTemplates.length > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-semibold text-foreground">
                Similar Templates
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {similarTemplates.map((similar) => (
                  <Link
                    key={similar.metadata.id}
                    href={`/templates/${similar.metadata.id}`}
                    className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50"
                  >
                    <h4 className="mb-2 line-clamp-2 font-medium text-foreground">
                      {similar.metadata.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">
                        {format(calculateTotalPrice(similar))}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {similar.metadata.category}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {/* Actions Card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-foreground">
                Get Started
              </h3>
              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={handleUseTemplate}>
                  <Zap className="mr-2 h-5 w-5" />
                  Use This Template
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleViewResults}
                >
                  View Full Analysis
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Template
                </Button>
              </div>
              <div className="mt-6 space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
                <p>
                  Using this template will create a new build in your &quot;My
                  Builds&quot; section that you can customize.
                </p>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-foreground">
                Template Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Author:</span>
                  <span className="font-medium text-foreground">
                    {m.author}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-medium text-foreground">
                    {m.version}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium text-foreground">
                    {new Date(m.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Popularity:</span>
                  <span className="font-medium text-foreground">
                    {(m.popularity ?? 0).toLocaleString()} uses
                  </span>
                </div>
              </div>
            </div>

            {m.tags.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-4 font-semibold text-foreground">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {m.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
