import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { LayoutChrome } from "@/components/layout/LayoutChrome";
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
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-background text-foreground flex flex-col`}
      >
        <ToastProvider>
          <LayoutChrome>{children}</LayoutChrome>
        </ToastProvider>
      </body>
    </html>
  );
}
