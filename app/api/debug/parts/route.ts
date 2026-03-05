import { NextResponse } from "next/server";
import { loadAllComponents } from "@/lib/data-loader";

export async function GET() {
  try {
    const components = loadAllComponents();

    const breakdown = {
      cpus: components.cpus.length,
      gpus: components.gpus.length,
      motherboards: components.motherboards.length,
      ram: components.ram.length,
      storage: components.storage.length,
      psus: components.psus.length,
      coolers: components.coolers.length,
      cases: components.cases.length,
    };

    const total = Object.values(breakdown).reduce(
      (sum, n) => sum + n,
      0
    );

    const stats = {
      total,
      breakdown,
      samples: {
        ram: components.ram
          .slice(0, 3)
          .map((r: any) => ({ id: r.id, name: r.name })),
        cpu: components.cpus
          .slice(0, 3)
          .map((c: any) => ({ id: c.id, name: c.name })),
        gpu: components.gpus
          .slice(0, 3)
          .map((g: any) => ({ id: g.id, name: g.name })),
      },
      catalogSource: process.env.USE_CATALOG !== "false" ? "catalog" : "seed",
    };

    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message ?? "Failed to load component catalog",
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}

