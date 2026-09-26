import { Box, Tooltip, Typography } from "@mui/material";
import { CHART_CHROME } from "./colors";

export interface LineChartSeries {
  name: string;
  color: string;
  points: { x: string; y: number | null }[];
}

interface LineChartProps {
  series: LineChartSeries[];
  height?: number;
  valueFormat?: (v: number) => string;
  xLabelFormat?: (x: string) => string;
}

const WIDTH = 640;
const PADDING = { top: 16, right: 16, bottom: 28, left: 40 };

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

// Split a series into contiguous runs of non-null points, so a gap (no data
// that day) breaks the line instead of interpolating across it.
function toRuns(points: { x: string; y: number | null }[]) {
  const runs: { x: string; y: number }[][] = [];
  let current: { x: string; y: number }[] = [];
  for (const p of points) {
    if (p.y === null) {
      if (current.length) runs.push(current);
      current = [];
    } else {
      current.push({ x: p.x, y: p.y });
    }
  }
  if (current.length) runs.push(current);
  return runs;
}

export function LineChart({ series, height = 260, valueFormat = String, xLabelFormat = (x) => x }: LineChartProps) {
  const pointCount = series[0]?.points.length ?? 0;
  const allValues = series.flatMap((s) => s.points.map((p) => p.y)).filter((v): v is number => v !== null);
  const yMax = niceMax(Math.max(1, ...allValues));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const xFor = (i: number) => PADDING.left + (pointCount <= 1 ? 0 : (i / (pointCount - 1)) * plotWidth);
  const yFor = (v: number) => PADDING.top + plotHeight - (v / yMax) * plotHeight;

  const yTicks = Array.from(new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f))));
  const labelEvery = Math.max(1, Math.ceil(pointCount / 7));

  return (
    <Box>
      {series.length > 1 && (
        <Box display="flex" gap={2} mb={1} flexWrap="wrap">
          {series.map((s) => (
            <Box key={s.name} display="flex" alignItems="center" gap={0.5}>
              <Box width={10} height={10} borderRadius="50%" bgcolor={s.color} />
              <Typography variant="caption" color="text.secondary">
                {s.name}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      <svg viewBox={`0 0 ${WIDTH} ${height}`} width="100%" height={height} role="img">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke={CHART_CHROME.gridline}
              strokeWidth={1}
            />
            <text x={PADDING.left - 8} y={yFor(tick) + 4} textAnchor="end" fontSize={11} fill={CHART_CHROME.mutedText}>
              {tick}
            </text>
          </g>
        ))}
        <line
          x1={PADDING.left}
          x2={PADDING.left}
          y1={PADDING.top}
          y2={height - PADDING.bottom}
          stroke={CHART_CHROME.baseline}
          strokeWidth={1}
        />

        {series[0]?.points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text
              key={p.x}
              x={xFor(i)}
              y={height - PADDING.bottom + 16}
              textAnchor="middle"
              fontSize={10}
              fill={CHART_CHROME.mutedText}
            >
              {xLabelFormat(p.x)}
            </text>
          ) : null
        )}

        {series.map((s) => {
          const indexByX = new Map(s.points.map((p, i) => [p.x, i]));
          return (
            <g key={s.name}>
              {toRuns(s.points).map((run, runIdx) => (
                <polyline
                  key={runIdx}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={run.map((p) => `${xFor(indexByX.get(p.x)!)},${yFor(p.y)}`).join(" ")}
                />
              ))}
              {s.points.map((p, i) =>
                p.y === null ? null : (
                  <Tooltip key={p.x} title={`${xLabelFormat(p.x)} · ${s.name}: ${valueFormat(p.y)}`}>
                    <circle
                      cx={xFor(i)}
                      cy={yFor(p.y)}
                      r={4}
                      fill={s.color}
                      stroke={CHART_CHROME.surface}
                      strokeWidth={2}
                    />
                  </Tooltip>
                )
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
}
