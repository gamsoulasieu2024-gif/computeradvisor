import { NextResponse } from "next/server";
import { apiGetBuild } from "@/lib/persistence/api-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const build = await apiGetBuild(id);
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }
    return NextResponse.json(build);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load build" },
      { status: 500 }
    );
  }
}
