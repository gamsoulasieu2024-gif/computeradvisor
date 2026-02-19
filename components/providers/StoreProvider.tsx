"use client";

import { useEffect, useRef } from "react";
import { useBuildStore } from "@/lib/store/build-store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hasHydrated = useRef(false);

  useEffect(() => {
    // Only rehydrate once on mount
    if (!hasHydrated.current) {
      useBuildStore.persist.rehydrate();
      hasHydrated.current = true;
    }
  }, []);

  return <>{children}</>;
}
