/**
 * Export build to various formats
 */

import type { SelectedParts } from "@/lib/store/types";
import type { BuildPreset } from "@/lib/store/types";

interface ExportBuildInput {
  preset: BuildPreset;
  parts: SelectedParts;
  buildName?: string;
}

function getPartName(part: unknown): string {
  return (part as { name?: string })?.name ?? "Unknown";
}

function getPartPrice(part: unknown): number {
  return (part as { price_usd?: number })?.price_usd ?? 0;
}

/** JSON: Full build data */
export function formatJson(input: ExportBuildInput): string {
  const payload = {
    name: input.buildName,
    preset: input.preset,
    exportedAt: new Date().toISOString(),
    parts: input.parts,
  };
  return JSON.stringify(payload, null, 2);
}

/** Text list: Human-readable part list */
export function formatTextList(input: ExportBuildInput): string {
  const lines: string[] = [`PC Build - ${input.buildName ?? "Unnamed"}\n`];
  const p = input.parts;

  if (p.cpu) lines.push(`CPU: ${getPartName(p.cpu)}`);
  if (p.gpu) lines.push(`GPU: ${getPartName(p.gpu)}`);
  if (p.motherboard) lines.push(`Motherboard: ${getPartName(p.motherboard)}`);
  if (p.ram) lines.push(`RAM: ${getPartName(p.ram)}`);
  if (p.storage?.length) {
    p.storage.forEach((s, i) => lines.push(`Storage ${i + 1}: ${getPartName(s)}`));
  }
  if (p.psu) lines.push(`PSU: ${getPartName(p.psu)}`);
  if (p.cooler) lines.push(`Cooler: ${getPartName(p.cooler)}`);
  if (p.case) lines.push(`Case: ${getPartName(p.case)}`);

  const total = [p.cpu, p.gpu, p.motherboard, p.ram, ...(p.storage ?? []), p.psu, p.cooler, p.case]
    .filter(Boolean)
    .reduce((sum, part) => sum + getPartPrice(part), 0);
  if (total > 0) lines.push(`\nEst. Total: $${total}`);
  return lines.join("\n");
}

/** PCPartPicker format: Name | Type | Item | Price */
export function formatPCPartPicker(input: ExportBuildInput): string {
  const rows: string[] = ["Name | Type | Item | Price"];
  const p = input.parts;

  const add = (name: string, type: string, item: unknown) => {
    const price = getPartPrice(item);
    rows.push(`${name} | ${type} | ${getPartName(item)} | $${price || "—"}`);
  };
  if (p.cpu) add("CPU", "CPU", p.cpu);
  if (p.motherboard) add("Motherboard", "Motherboard", p.motherboard);
  if (p.ram) add("Memory", "Memory", p.ram);
  if (p.storage?.length) {
    p.storage.forEach((s, i) => add(`Storage ${i + 1}`, "Storage", s));
  }
  if (p.gpu) add("Video Card", "Video Card", p.gpu);
  if (p.case) add("Case", "Case", p.case);
  if (p.psu) add("Power Supply", "Power Supply", p.psu);
  if (p.cooler) add("CPU Cooler", "CPU Cooler", p.cooler);

  return rows.join("\n");
}

/** Markdown: Table for Reddit/forums */
export function formatMarkdown(input: ExportBuildInput): string {
  const rows: string[] = [];
  const p = input.parts;

  const add = (type: string, item: unknown) => {
    const name = getPartName(item);
    const price = getPartPrice(item);
    rows.push(`| ${type} | ${name} | $${price || "—"} |`);
  };
  if (p.cpu) add("CPU", p.cpu);
  if (p.motherboard) add("Motherboard", p.motherboard);
  if (p.ram) add("RAM", p.ram);
  if (p.storage?.length) {
    p.storage.forEach((s, i) => add(`Storage ${i + 1}`, s));
  }
  if (p.gpu) add("GPU", p.gpu);
  if (p.case) add("Case", p.case);
  if (p.psu) add("PSU", p.psu);
  if (p.cooler) add("Cooler", p.cooler);

  const header = "| Type | Part | Price |\n|-----|------|-------|";
  return `## ${input.buildName ?? "PC Build"}\n\n${header}\n${rows.join("\n")}`;
}
