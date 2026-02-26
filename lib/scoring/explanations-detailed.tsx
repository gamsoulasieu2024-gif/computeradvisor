export const SCORE_EXPLANATIONS = {
  performance: {
    title: "Performance Score Calculation",
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-foreground">
          The Performance score measures how well your build handles your
          intended use case.
        </p>

        <div className="space-y-3">
          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              For Gaming Builds:
            </h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>GPU contributes 70% (most important for gaming)</li>
              <li>CPU contributes 30%</li>
              <li>Based on component tier (1-10 scale)</li>
              <li>
                Penalties for bottlenecks (CPU too weak for GPU, or vice versa)
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              For Creator/Workstation:
            </h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>CPU contributes 60% (CPU-heavy workloads)</li>
              <li>GPU contributes 40%</li>
              <li>RAM capacity matters more (32GB+ recommended)</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              Target-Based Scoring:
            </h4>
            <p className="text-muted-foreground">
              If you&apos;ve set a performance target (like &quot;1440p
              165Hz&quot;), we evaluate whether your components meet that
              specific goal.
            </p>
          </div>
        </div>

        <div className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> These are estimates based on component tiers,
            not real benchmark data. Actual performance varies by game, drivers,
            and settings.
          </p>
        </div>
      </div>
    ),
  },

  value: {
    title: "Value Score Calculation",
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-foreground">
          The Value score measures price-to-performance ratio and balanced
          spending.
        </p>

        <div className="space-y-3">
          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              What We Check:
            </h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Price-to-performance ratio (tier vs cost)</li>
              <li>Balanced component spending (avoiding overkill)</li>
              <li>Wasted budget (overspending on underutilized features)</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">Penalties:</h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>-15 points: High-end CPU with low-end GPU for gaming</li>
              <li>-10 points: Excessive PSU wattage (&gt;2x needed)</li>
              <li>-10 points: RAM speed you can&apos;t use</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">Bonuses:</h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>+10 points: Well-balanced build (similar tier components)</li>
              <li>+5 points: Good price-to-performance in each category</li>
            </ul>
          </div>
        </div>

        <div className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> A lower value score doesn&apos;t mean bad
            build—it might mean you&apos;re prioritizing performance or
            future-proofing over immediate value.
          </p>
        </div>
      </div>
    ),
  },

  compatibility: {
    title: "Compatibility Score Calculation",
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-foreground">
          The Compatibility score reflects how well your components work
          together.
        </p>

        <div className="space-y-3">
          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              Starting Score: 100
            </h4>
            <p className="text-muted-foreground">
              We start at 100 and subtract points for each issue found.
            </p>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">Deductions:</h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Critical errors (won&apos;t work): Score = 0</li>
              <li>Major warnings: -20 to -25 points each</li>
              <li>Minor warnings: -5 to -10 points each</li>
              <li>Informational notes: -0 to -5 points</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              Confidence Level:
            </h4>
            <p className="mb-2 text-muted-foreground">
              We also show confidence (0-100%) based on data completeness:
            </p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Missing case clearances: -10% confidence</li>
              <li>Unknown GPU thickness: -15% confidence</li>
              <li>Manual overrides: -5% each</li>
            </ul>
          </div>
        </div>

        <div className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Goal:</strong> Aim for 90+ compatibility score with high
            confidence (80%+).
          </p>
        </div>
      </div>
    ),
  },

  usability: {
    title: "Usability Score Calculation",
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-foreground">
          The Usability score measures how easy and pleasant your build will be
          to use and maintain.
        </p>

        <div className="space-y-3">
          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              Starting Score: 80
            </h4>
            <p className="text-muted-foreground">
              We start at 80 and adjust based on various factors.
            </p>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              What We Check:
            </h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>PSU headroom (running at 50-75% load is ideal)</li>
              <li>Upgrade potential (extra RAM slots, M.2 slots)</li>
              <li>Noise levels (estimated from TDP and cooler)</li>
              <li>Thermals (airflow case, adequate cooling)</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              Scoring Examples:
            </h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>Good PSU headroom (40%+): +5 points</li>
              <li>2+ free RAM slots: +10 points</li>
              <li>PSU running &gt;75% load: -10 points</li>
              <li>Poor airflow with high TDP: -10 points</li>
            </ul>
          </div>
        </div>

        <div className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Usability matters for long-term satisfaction.
            Good cooling, low noise, and upgrade room make a big difference.
          </p>
        </div>
      </div>
    ),
  },

  roi: {
    title: "ROI (Return on Investment)",
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-foreground">
          ROI measures score improvement per $100 spent on an upgrade.
        </p>

        <div className="space-y-3">
          <div>
            <h4 className="mb-2 font-semibold text-foreground">Formula:</h4>
            <div className="rounded bg-muted p-3 font-mono text-xs">
              ROI = (Score Improvement / Cost) × 100
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">Example:</h4>
            <p className="text-muted-foreground">
              Upgrading from RTX 3060 ($300) to RTX 4070 ($550):
            </p>
            <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              <li>Cost: $250 difference</li>
              <li>Performance gain: +18 points</li>
              <li>
                ROI: (18 / 250) × 100 = <strong>7.2</strong>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-foreground">
              Interpreting ROI:
            </h4>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>
                <strong>ROI &gt; 10:</strong> Excellent value upgrade
              </li>
              <li>
                <strong>ROI 5-10:</strong> Good value
              </li>
              <li>
                <strong>ROI 2-5:</strong> Acceptable
              </li>
              <li>
                <strong>ROI &lt; 2:</strong> Poor value (diminishing returns)
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Use Case:</strong> ROI helps you prioritize upgrades when on
            a budget. Highest ROI = best bang for buck.
          </p>
        </div>
      </div>
    ),
  },
} as const;

export type ScoreExplanationKey = keyof typeof SCORE_EXPLANATIONS;
