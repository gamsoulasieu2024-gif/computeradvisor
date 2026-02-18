import { NextResponse } from "next/server";
import { loadAllComponents } from "@/lib/data-loader";

export async function GET() {
  try {
    const data = await loadAllComponents();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load parts" },
      { status: 500 }
    );
  }
}
