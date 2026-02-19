"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Use queueMicrotask to make setState async and avoid cascading renders
    queueMicrotask(() => {
      if (stored) {
        setThemeState(stored);
        document.documentElement.classList.toggle("dark", stored === "dark");
      } else {
        const initial = prefersDark ? "dark" : "light";
        setThemeState(initial);
        document.documentElement.classList.toggle("dark", initial === "dark");
      }

      setMounted(true);
    });
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return { theme, setTheme, mounted };
}
