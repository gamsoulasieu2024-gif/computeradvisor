/**
 * Export build to Reddit and Markdown formatted text
 */

import type { BuildInput } from "@/lib/compatibility/types";

export interface BuildForExport {
  selectedParts?: BuildInput;
  parts?: BuildInput;
  preset?: string;
  targetId?: string;
}

export interface ScoreForExport {
  overall: number;
  scores: {
    performance: { value: number };
    value: { value: number };
  };
}

export interface CompatForExport {
  isCompatible: boolean;
  hardFails: { title: string }[];
  warnings: { title: string }[];
}

function getPrice(part: { price_usd?: number; specs?: Record<string, unknown> } | undefined): number | string {
  if (!part) return "?";
  const specPrice = (part.specs as { price_usd?: number } | undefined)?.price_usd;
  const p = part.price_usd ?? specPrice;
  return p != null ? p : "?";
}

function totalPrice(selectedParts: BuildInput): number {
  let sum = 0;
  if (selectedParts.cpu) sum += Number(getPrice(selectedParts.cpu)) || 0;
  if (selectedParts.gpu) sum += Number(getPrice(selectedParts.gpu)) || 0;
  if (selectedParts.motherboard) sum += Number(getPrice(selectedParts.motherboard)) || 0;
  if (selectedParts.ram) sum += Number(getPrice(selectedParts.ram)) || 0;
  for (const s of selectedParts.storage ?? []) sum += Number(getPrice(s)) || 0;
  if (selectedParts.psu) sum += Number(getPrice(selectedParts.psu)) || 0;
  if (selectedParts.cooler) sum += Number(getPrice(selectedParts.cooler)) || 0;
  if (selectedParts.case) sum += Number(getPrice(selectedParts.case)) || 0;
  return sum;
}

function presetTitle(preset: string): string {
  return preset
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Generate a Reddit-formatted post with parts table and scores
 */
export function generateRedditPost(
  build: BuildForExport,
  scores: ScoreForExport,
  compatResult: CompatForExport
): string {
  const selectedParts = build.selectedParts ?? build.parts ?? {};
  const preset = build.preset ?? "custom";
  const total = totalPrice(selectedParts);

  const rows: string[] = [];
  if (selectedParts.cpu) {
    rows.push(`**CPU** | ${selectedParts.cpu.name} | $${getPrice(selectedParts.cpu)}`);
  }
  if (selectedParts.gpu) {
    rows.push(`**GPU** | ${selectedParts.gpu.name} | $${getPrice(selectedParts.gpu)}`);
  }
  if (selectedParts.motherboard) {
    rows.push(`**Motherboard** | ${selectedParts.motherboard.name} | $${getPrice(selectedParts.motherboard)}`);
  }
  if (selectedParts.ram) {
    rows.push(`**RAM** | ${selectedParts.ram.name} | $${getPrice(selectedParts.ram)}`);
  }
  for (const s of selectedParts.storage ?? []) {
    rows.push(`**Storage** | ${s.name} | $${getPrice(s)}`);
  }
  if (selectedParts.psu) {
    rows.push(`**PSU** | ${selectedParts.psu.name} | $${getPrice(selectedParts.psu)}`);
  }
  if (selectedParts.cooler) {
    rows.push(`**Cooler** | ${selectedParts.cooler.name} | $${getPrice(selectedParts.cooler)}`);
  }
  if (selectedParts.case) {
    rows.push(`**Case** | ${selectedParts.case.name} | $${getPrice(selectedParts.case)}`);
  }
  rows.push(`**Total** | | **$${total.toLocaleString()}**`);

  const targetLine = build.targetId ? `**Target:** ${build.targetId}\n\n` : "";

  const goals: string[] = [];
  if (preset.includes("gaming")) goals.push("- High performance gaming");
  if (preset.includes("creator")) goals.push("- Content creation and productivity");
  if (preset.includes("quiet")) goals.push("- Low noise operation");
  if (preset.includes("budget")) goals.push("- Best value for money");
  const goalsBlock = goals.length ? goals.join("\n") : "- Custom build";

  let criticalBlock = "";
  if (compatResult.hardFails.length > 0) {
    criticalBlock = `**⚠️ Critical Issues:**\n${compatResult.hardFails.map((i) => `- ${i.title}`).join("\n")}\n\n`;
  }

  let warningsBlock = "";
  if (compatResult.warnings.length > 0) {
    warningsBlock = `**ℹ️ Warnings:**\n${compatResult.warnings.slice(0, 3).map((i) => `- ${i.title}`).join("\n")}\n\n`;
  }

  const compatNote =
    compatResult.isCompatible && compatResult.warnings.length === 0
      ? "✅ No compatibility issues detected!\n\n"
      : "";

  return `# ${presetTitle(preset)} PC Build - $${total.toLocaleString()}

${targetLine}## Build Goals

${goalsBlock}

## Parts List

Type | Component | Price
:----|:----|:----
${rows.join("\n")}

## Scores

- **Overall:** ${Math.round(scores.overall)}/100
- **Performance:** ${Math.round(scores.scores.performance.value)}/100
- **Value:** ${Math.round(scores.scores.value.value)}/100
- **Compatibility:** ${compatResult.isCompatible ? "✓ Compatible" : "✗ Issues Found"}

## Compatibility Notes

${criticalBlock}${warningsBlock}${compatNote}## Why I Chose These Parts

*[Add your reasoning here]*

## Upgrade Path

*[Planned future upgrades]*

---

*Built with [PC Build Advisor](https://pcbuildadvisor.com) | [View Full Analysis](#)*
`;
}

/**
 * Generate Markdown post (cleaner for blogs/docs, no Reddit table alignment)
 */
export function generateMarkdownPost(
  build: BuildForExport,
  scores: ScoreForExport,
  compatResult: CompatForExport
): string {
  const reddit = generateRedditPost(build, scores, compatResult);
  return reddit
    .replace(/\*\*/g, "")
    .replace(/:----\|:----\|:----/g, "---|---|---");
}
