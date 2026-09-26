import { Box, Tooltip } from "@mui/material";
import { CHART_CHROME } from "./colors";

interface BarChartProps {
  bars: { label: string; value: number; color: string }[];
  height?: number;
}

const WIDTH = 640;
const PADDING = { top: 16, right: 16, bottom: 28, left: 40 };
const BAR_MAX_THICKNESS = 48;
const BAR_GAP = 2;

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function BarChart({ bars, height = 220 }: BarChartProps) {
  const yMax = niceMax(Math.max(1, ...bars.map((b) => b.value)));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;
  const slotWidth = plotWidth / bars.length;
  const barWidth = Math.min(BAR_MAX_THICKNESS, slotWidth - BAR_GAP * 2);

  const yFor = (v: number) => PADDING.top + plotHeight - (v / yMax) * plotHeight;
  const yTicks = Array.from(new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f))));

  return (
    <Box>
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

        {bars.map((bar, i) => {
          const x = PADDING.left + i * slotWidth + (slotWidth - barWidth) / 2;
          return (
            <g key={bar.label}>
              <Tooltip title={`${bar.label}: ${bar.value}`}>
                <rect
                  x={x}
                  y={yFor(bar.value)}
                  width={barWidth}
                  height={height - PADDING.bottom - yFor(bar.value)}
                  rx={4}
                  fill={bar.color}
                />
              </Tooltip>
              <text
                x={x + barWidth / 2}
                y={height - PADDING.bottom + 16}
                textAnchor="middle"
                fontSize={10}
                fill={CHART_CHROME.mutedText}
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
}
