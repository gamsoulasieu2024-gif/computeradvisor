/**
 * Generate HTML for a social-media-ready build card (1200×630)
 * Can be opened in a new window for screenshot or converted to image server-side.
 */

import type { BuildInput } from "@/lib/compatibility/types";

export interface BuildForCard {
  selectedParts?: BuildInput;
  parts?: BuildInput;
  preset?: string;
}

export interface ScoreForCard {
  overall: number;
  scores: {
    performance: { value: number };
    value: { value: number };
  };
}

export interface CompatForCard {
  isCompatible: boolean;
  hardFails: { title: string }[];
  warnings: { title: string }[];
}

function getPrice(part: { price_usd?: number; specs?: Record<string, unknown> } | undefined): number {
  if (!part) return 0;
  const p = part.specs as { price_usd?: number } | undefined;
  return part.price_usd ?? p?.price_usd ?? 0;
}

function partList(selectedParts: BuildInput): Array<{ label: string; name: string }> {
  const out: Array<{ label: string; name: string }> = [];
  if (selectedParts.cpu) out.push({ label: "CPU", name: selectedParts.cpu.name });
  if (selectedParts.gpu) out.push({ label: "GPU", name: selectedParts.gpu.name });
  if (selectedParts.motherboard) out.push({ label: "Motherboard", name: selectedParts.motherboard.name });
  if (selectedParts.ram) out.push({ label: "RAM", name: selectedParts.ram.name });
  const storage = selectedParts.storage ?? [];
  if (storage[0]) out.push({ label: "Storage", name: storage[0].name });
  if (selectedParts.psu) out.push({ label: "PSU", name: selectedParts.psu.name });
  if (selectedParts.cooler) out.push({ label: "Cooler", name: selectedParts.cooler.name });
  if (selectedParts.case) out.push({ label: "Case", name: selectedParts.case.name });
  return out;
}

function totalPrice(selectedParts: BuildInput): number {
  let sum = 0;
  if (selectedParts.cpu) sum += getPrice(selectedParts.cpu);
  if (selectedParts.gpu) sum += getPrice(selectedParts.gpu);
  if (selectedParts.motherboard) sum += getPrice(selectedParts.motherboard);
  if (selectedParts.ram) sum += getPrice(selectedParts.ram);
  for (const s of selectedParts.storage ?? []) sum += getPrice(s);
  if (selectedParts.psu) sum += getPrice(selectedParts.psu);
  if (selectedParts.cooler) sum += getPrice(selectedParts.cooler);
  if (selectedParts.case) sum += getPrice(selectedParts.case);
  return sum;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateBuildCardHTML(
  build: BuildForCard,
  scores: ScoreForCard,
  compatResult: CompatForCard
): string {
  const selectedParts = build.selectedParts ?? build.parts ?? {};
  const parts = partList(selectedParts);
  const total = totalPrice(selectedParts);
  const partsHtml = parts
    .map(
      (p) =>
        `<div class="part"><div class="part-label">${escapeHtml(p.label)}</div><div class="part-name">${escapeHtml(p.name)}</div></div>`
    )
    .join("");
  const compatDisplay = compatResult.isCompatible ? "✓" : "✗";
  const fallbackPart = '<div class="part"><div class="part-name">No parts</div></div>';
  return (
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>" +
    "*{margin:0;padding:0;box-sizing:border-box}body{width:1200px;height:630px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;color:white}.container{background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border-radius:20px;padding:40px;height:100%;display:flex;flex-direction:column}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}.title{font-size:48px;font-weight:800}.price{font-size:36px;font-weight:700;background:white;color:#667eea;padding:10px 20px;border-radius:10px}.parts{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:30px}.part{background:rgba(255,255,255,0.15);padding:15px;border-radius:10px;font-size:16px}.part-label{opacity:0.8;font-size:12px;margin-bottom:5px}.part-name{font-weight:600}.scores{display:flex;gap:20px;justify-content:space-between}.score{flex:1;text-align:center;background:rgba(255,255,255,0.2);padding:20px;border-radius:10px}.score-value{font-size:48px;font-weight:800;display:block}.score-label{font-size:14px;opacity:0.9;margin-top:5px}.footer{margin-top:20px;text-align:center;opacity:0.8;font-size:14px}</style></head><body><div class=\"container\"><div class=\"header\"><div class=\"title\">My PC Build</div><div class=\"price\">$" +
    total.toLocaleString() +
    "</div></div><div class=\"parts\">" +
    (partsHtml || fallbackPart) +
    "</div><div class=\"scores\"><div class=\"score\"><span class=\"score-value\">" +
    Math.round(scores.overall) +
    "</span><div class=\"score-label\">Overall</div></div><div class=\"score\"><span class=\"score-value\">" +
    Math.round(scores.scores.performance.value) +
    "</span><div class=\"score-label\">Performance</div></div><div class=\"score\"><span class=\"score-value\">" +
    Math.round(scores.scores.value.value) +
    "</span><div class=\"score-label\">Value</div></div><div class=\"score\"><span class=\"score-value\">" +
    compatDisplay +
    "</span><div class=\"score-label\">Compatible</div></div></div><div class=\"footer\">Built with PC Build Advisor · pcbuildadvisor.com</div></div></body></html>"
  );
}
