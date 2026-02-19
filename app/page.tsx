import Link from "next/link";
import { Cpu, Gauge, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

const features = [
  {
    title: "Smart Compatibility",
    description: "Automatic validation of parts compatibility. No more guessing if your CPU fits your motherboard.",
    icon: Cpu,
  },
  {
    title: "Performance Scoring",
    description: "Get a clear performance rating for your build. Compare against different use cases and budgets.",
    icon: Gauge,
  },
  {
    title: "Upgrade Paths",
    description: "Plan future upgrades with confidence. See which components can be swapped for better performance.",
    icon: TrendingUp,
  },
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-50 to-background dark:from-zinc-900/50 dark:to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.1),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Build Your Perfect PC
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Plan your dream build with confidence. Our advisor checks compatibility, scores performance, and helps you find the best upgrade path—all in one place.
            </p>
            <div className="mt-10">
              <Link href="/build">
                <Button size="lg" variant="primary" className="px-8 py-6 text-lg">
                  Start Build
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
            >
              <div className="mb-4 inline-flex rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                <feature.icon className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
