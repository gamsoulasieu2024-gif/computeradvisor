"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBuild } from "@/hooks/use-build";
import { saveBuild } from "@/lib/persistence/build-saver";

export default function BuildResultsRedirect() {
  const router = useRouter();
  const { selectedParts, preset, manualOverrides } = useBuild();

  useEffect(() => {
    saveBuild({
      preset,
      parts: selectedParts,
      manualOverrides: manualOverrides ?? {},
    }).then(({ id }) => router.replace(`/results/${id}`));
  }, [router, selectedParts, preset, manualOverrides]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-zinc-500">Loading results...</p>
    </div>
  );
}
