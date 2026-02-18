"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBuildParamFromUrl, decodeBuildFromUrl } from "@/lib/persistence/url-encoder";
import { saveToLocal } from "@/lib/persistence/storage";

function ResultsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const encoded = getBuildParamFromUrl(searchParams.toString());
    if (encoded) {
      const build = decodeBuildFromUrl(encoded);
      if (build) {
        saveToLocal(build);
        router.replace(`/results/${build.id}`);
        return;
      }
    }
    router.replace("/build");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-zinc-500">Loading results...</p>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-zinc-500">Loading results...</p>
        </div>
      }
    >
      <ResultsRedirect />
    </Suspense>
  );
}
