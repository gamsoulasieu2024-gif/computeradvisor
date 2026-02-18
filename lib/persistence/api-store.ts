/**
 * Server-side store for builds (optional cloud persistence)
 * Uses JSON file - replace with Prisma/SQLite when needed
 */

import { promises as fs } from "fs";
import path from "path";
import type { PersistedBuild } from "./storage";

const DATA_FILE = path.join(process.cwd(), "data", "builds.json");

async function ensureDataDir(): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
}

async function readStore(): Promise<Record<string, PersistedBuild>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Record<string, PersistedBuild>;
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, PersistedBuild>): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 0), "utf-8");
}

export async function apiSaveBuild(build: PersistedBuild): Promise<string> {
  const store = await readStore();
  store[build.id] = build;
  await writeStore(store);
  return build.id;
}

export async function apiGetBuild(id: string): Promise<PersistedBuild | null> {
  const store = await readStore();
  return store[id] ?? null;
}

export async function apiListBuilds(): Promise<PersistedBuild[]> {
  const store = await readStore();
  return Object.values(store).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
