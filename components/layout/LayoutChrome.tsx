"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencySelector } from "@/components/layout/CurrencySelector";
import { X } from "lucide-react";

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    setFocusMode(pathname === "/build");
  }, [pathname]);

  return (
    <>
      {!focusMode && (
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="text-lg font-semibold text-foreground transition-opacity hover:opacity-80"
            >
              PC Build Advisor
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/build"
                className="text-sm text-zinc-500 transition-colors hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
              >
                Build
              </Link>
              <Link
                href="/templates"
                className="text-sm text-zinc-500 transition-colors hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
              >
                Templates
              </Link>
              <Link
                href="/builds"
                className="text-sm text-zinc-500 transition-colors hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground"
              >
                My Builds
              </Link>
              <CurrencySelector />
              <ThemeToggle />
            </nav>
          </div>
        </header>
      )}

      {focusMode && (
        <header className="sticky top-0 z-40 border-b border-zinc-200/50 bg-background/95 backdrop-blur-sm dark:border-zinc-800/50">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-foreground/60 transition-colors hover:text-foreground"
                title="Exit builder"
              >
                <X className="h-5 w-5" />
              </Link>
              <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-sm font-medium text-foreground">
                Building Your PC
              </span>
            </div>
            <CurrencySelector />
            <ThemeToggle />
          </div>
        </header>
      )}

      <main
        className={
          focusMode
            ? "flex h-[calc(100vh-53px)] min-h-0 flex-col overflow-hidden"
            : undefined
        }
      >
        {children}
      </main>

      {!focusMode && (
        <footer className="mt-auto border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            © 2026 PC Build Advisor. Built with accuracy in mind.
          </div>
        </footer>
      )}
    </>
  );
}
