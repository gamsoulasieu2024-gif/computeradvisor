"use client";

interface CaseDiagram3DProps {
  caseMaxGpuLength: number;
  gpuLength: number;
  caseMaxCoolerHeight: number;
  coolerHeight: number;
}

export function CaseDiagram3D({
  caseMaxGpuLength,
  gpuLength,
  caseMaxCoolerHeight,
  coolerHeight,
}: CaseDiagram3DProps) {
  const gpuFit = gpuLength <= caseMaxGpuLength;
  const coolerFit = coolerHeight <= caseMaxCoolerHeight;

  const gpuBarWidth = Math.min(
    (gpuLength / caseMaxGpuLength) * 180,
    180
  );
  const coolerBarHeight = Math.min(
    (coolerHeight / caseMaxCoolerHeight) * 80,
    80
  );

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Component Layout
      </h3>

      <svg
        viewBox="0 0 400 300"
        className="h-auto w-full"
        style={{ maxHeight: "300px" }}
        aria-label="Simplified isometric case layout"
      >
        <g
          className="stroke-muted-foreground"
          strokeWidth="2"
          fill="none"
        >
          <path d="M 100 200 L 100 50 L 300 50 L 300 200 Z" />
          <path d="M 300 50 L 350 80 L 350 230 L 300 200 Z" />
          <path d="M 100 50 L 150 20 L 350 20 L 350 80 L 300 50 Z" />
        </g>

        {gpuLength > 0 && (
          <g>
            <rect
              x={110}
              y={170}
              width={gpuBarWidth}
              height={15}
              fill={gpuFit ? "var(--color-primary)" : "rgb(239 68 68)"}
              fillOpacity={0.8}
            />
            <text
              x={115}
              y={182}
              fill="white"
              fontSize={10}
            >
              GPU
            </text>
            <line
              x1={290}
              y1={165}
              x2={290}
              y2={190}
              stroke="rgb(234 179 8)"
              strokeDasharray="4 2"
              strokeWidth={1}
            />
          </g>
        )}

        {coolerHeight > 0 && (
          <g>
            <rect
              x={180}
              y={140 - coolerBarHeight}
              width={30}
              height={coolerBarHeight}
              fill={coolerFit ? "rgb(59 130 246)" : "rgb(239 68 68)"}
              fillOpacity={0.8}
            />
            <text
              x={165}
              y={145}
              fill="var(--color-muted-foreground)"
              fontSize={10}
            >
              Cooler
            </text>
            <line
              x1={175}
              y1={60}
              x2={215}
              y2={60}
              stroke="rgb(234 179 8)"
              strokeDasharray="4 2"
              strokeWidth={1}
            />
          </g>
        )}

        <text
          x={200}
          y={290}
          fill="var(--color-muted-foreground)"
          textAnchor="middle"
          fontSize={12}
        >
          Simplified Layout View
        </text>
      </svg>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        Isometric representation showing relative component sizes
      </div>
    </div>
  );
}
