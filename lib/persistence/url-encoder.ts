/**
 * Encode/decode build to URL param for shareable links
 * Uses base64 + optional pako compression to stay under ~2000 chars
 */

import pako from "pako";
import type { PersistedBuild } from "./storage";

const MAX_URL_LENGTH = 2000;
const URL_PARAM = "b";

/**
 * Encode build for URL: JSON -> (optionally compressed) -> base64
 */
export function encodeBuildToUrl(build: PersistedBuild): string {
  const json = JSON.stringify(build);
  let payload: Uint8Array;

  if (json.length > 400) {
    payload = pako.deflate(json);
  } else {
    payload = new TextEncoder().encode(json);
  }

  const base64 = btoa(String.fromCharCode(...payload));
  const compressed = payload.length < json.length;
  const prefix = compressed ? "z" : "j";
  return prefix + base64;
}

/**
 * Decode build from URL param
 */
export function decodeBuildFromUrl(encoded: string): PersistedBuild | null {
  if (!encoded || encoded.length < 2) return null;

  const prefix = encoded[0];
  const base64 = encoded.slice(1);

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    let json: string;
    if (prefix === "z") {
      json = pako.inflate(bytes, { to: "string" });
    } else {
      json = new TextDecoder().decode(bytes);
    }

    const build = JSON.parse(json) as PersistedBuild;
    return validateBuild(build) ? build : null;
  } catch {
    return null;
  }
}

function validateBuild(b: unknown): b is PersistedBuild {
  if (!b || typeof b !== "object") return false;
  const o = b as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.preset === "string" &&
    o.parts != null &&
    typeof o.parts === "object" &&
    o.manualOverrides != null &&
    typeof o.manualOverrides === "object"
  );
}

/**
 * Build full results URL with encoded build
 */
export function buildShareUrl(build: PersistedBuild): string {
  const encoded = encodeBuildToUrl(build);
  if (encoded.length > MAX_URL_LENGTH) {
    // Fallback: minimal payload (could truncate metadata if needed)
    const minimal = {
      id: build.id,
      preset: build.preset,
      parts: build.parts,
      manualOverrides: build.manualOverrides,
    };
    const fallback = encodeBuildToUrl({ ...minimal, createdAt: "", updatedAt: "" } as PersistedBuild);
    if (fallback.length > MAX_URL_LENGTH) {
      return ""; // Too large even with minimal
    }
    return getResultsBaseUrl() + URL_PARAM + "=" + encodeURIComponent(fallback);
  }
  return getResultsBaseUrl() + URL_PARAM + "=" + encodeURIComponent(encoded);
}

function getResultsBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/results?`;
  }
  return "/results?";
}

/**
 * Extract encoded build from URL search params
 */
export function getBuildParamFromUrl(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get(URL_PARAM);
}
