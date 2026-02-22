"use client";

import dynamic from "next/dynamic";

const BuildPageClient = dynamic(
  () => import("@/components/builder/BuildPageClient"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading builder...</p>
        </div>
      </div>
    ),
  }
);

export default function BuildPage() {
  return <BuildPageClient />;
}
