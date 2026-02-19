import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";
import { StoreProvider } from "@/components/providers/StoreProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PC Build Advisor",
  description: "Build your perfect PC with smart compatibility checking",
  openGraph: {
    title: "PC Build Advisor",
    description: "Build your perfect PC with smart compatibility checking",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-background text-foreground`}
      >
        <StoreProvider>
          <header className="border-b border-zinc-200 dark:border-zinc-800">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                className="text-lg font-semibold text-foreground hover:opacity-80 transition-opacity"
              >
                PC Build Advisor
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/build"
                  className="text-sm font-medium text-zinc-600 hover:text-foreground dark:text-zinc-400 dark:hover:text-foreground transition-colors"
                >
                  Build
                </Link>
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <ToastProvider>
            <main>{children}</main>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
