import { NextResponse } from "next/server";
import { apiSaveBuild, apiListBuilds } from "@/lib/persistence/api-store";
import type { PersistedBuild } from "@/lib/persistence/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, build } = body as {
      name?: string;
      build: PersistedBuild;
    };

    if (!build || typeof build !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid build" },
        { status: 400 }
      );
    }

    const persisted: PersistedBuild = {
      id: build.id,
      name: name ?? build.name,
      createdAt: build.createdAt ?? new Date().toISOString(),
      updatedAt: build.updatedAt ?? new Date().toISOString(),
      preset: build.preset,
      parts: build.parts ?? {},
      manualOverrides: build.manualOverrides ?? {},
    };

    const id = await apiSaveBuild(persisted);
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save build" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const builds = await apiListBuilds();
    return NextResponse.json(builds);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list builds" },
      { status: 500 }
    );
  }
}
