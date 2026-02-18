import { NextResponse } from "next/server";
import { loadAllComponents } from "@/lib/data-loader";

/**
 * API route to validate all seed data.
 * GET /api/seed/validate - Returns counts if valid, or validation errors.
 */
export async function GET() {
  try {
    const data = await loadAllComponents();

    return NextResponse.json({
      success: true,
      counts: {
        cpus: data.cpus.length,
        gpus: data.gpus.length,
        motherboards: data.motherboards.length,
        ram: data.ram.length,
        storage: data.storage.length,
        psus: data.psus.length,
        coolers: data.coolers.length,
        cases: data.cases.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err && typeof err === "object" && "details" in err ? (err as { details?: unknown }).details : undefined;

    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
      },
      { status: 400 }
    );
  }
}
