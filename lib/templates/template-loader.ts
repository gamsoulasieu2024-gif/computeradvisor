import type {
  BuildTemplate,
  TemplateCategory,
  BudgetTier,
} from "@/types/template";
import gamingTemplatesData from "@/data/templates/gaming-templates.json";
import creatorTemplatesData from "@/data/templates/creator-templates.json";

const gamingTemplates = gamingTemplatesData as BuildTemplate[];
const creatorTemplates = creatorTemplatesData as BuildTemplate[];

/**
 * Get all templates
 */
export function getAllTemplates(): BuildTemplate[] {
  return [...gamingTemplates, ...creatorTemplates];
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): BuildTemplate | undefined {
  return getAllTemplates().find((t) => t.metadata.id === id);
}

/**
 * Get featured templates (sorted by popularity)
 */
export function getFeaturedTemplates(): BuildTemplate[] {
  return getAllTemplates()
    .filter((t) => t.metadata.featured)
    .sort(
      (a, b) => (b.metadata.popularity ?? 0) - (a.metadata.popularity ?? 0)
    );
}

/**
 * Filter templates by criteria
 */
export function filterTemplates(filters: {
  category?: TemplateCategory;
  budgetTier?: BudgetTier;
  difficulty?: string;
  resolution?: string;
}): BuildTemplate[] {
  let templates = getAllTemplates();

  if (filters.category) {
    templates = templates.filter(
      (t) => t.metadata.category === filters.category
    );
  }

  if (filters.budgetTier) {
    templates = templates.filter(
      (t) => t.metadata.budgetTier === filters.budgetTier
    );
  }

  if (filters.difficulty) {
    templates = templates.filter(
      (t) => t.metadata.difficulty === filters.difficulty
    );
  }

  if (filters.resolution) {
    templates = templates.filter(
      (t) => t.metadata.targetResolution === filters.resolution
    );
  }

  return templates.sort(
    (a, b) => (b.metadata.popularity ?? 0) - (a.metadata.popularity ?? 0)
  );
}

/**
 * Search templates by query (name, description, tags)
 */
export function searchTemplates(query: string): BuildTemplate[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return getAllTemplates();

  return getAllTemplates().filter((t) => {
    return (
      t.metadata.name.toLowerCase().includes(lowerQuery) ||
      t.metadata.description.toLowerCase().includes(lowerQuery) ||
      t.metadata.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Get similar templates (same category/budget/tags)
 */
export function getSimilarTemplates(
  templateId: string,
  limit: number = 3
): BuildTemplate[] {
  const template = getTemplateById(templateId);
  if (!template) return [];

  const allTemplates = getAllTemplates().filter(
    (t) => t.metadata.id !== templateId
  );

  const scored = allTemplates.map((t) => {
    let score = 0;
    if (t.metadata.category === template.metadata.category) score += 3;
    if (t.metadata.budgetTier === template.metadata.budgetTier) score += 2;
    const commonTags = t.metadata.tags.filter((tag) =>
      template.metadata.tags.includes(tag)
    );
    score += commonTags.length;
    return { template: t, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.template);
}

/**
 * Increment template popularity (usage count).
 * In a real app this would update a backend; for now no-op.
 */
export function incrementTemplateUsage(templateId: string): void {
  // Placeholder: could write to localStorage or call API
  if (typeof window !== "undefined") {
    try {
      const key = "template-usage";
      const raw = localStorage.getItem(key);
      const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
      counts[templateId] = (counts[templateId] ?? 0) + 1;
      localStorage.setItem(key, JSON.stringify(counts));
    } catch {
      // ignore
    }
  }
}
