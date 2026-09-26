import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { AppLayout } from "../components/AppLayout";
import { LineChart } from "../charts/LineChart";
import { BarChart } from "../charts/BarChart";
import { CATEGORICAL } from "../charts/colors";
import { downloadCsv } from "../utils/csv";
import { getReportsAnalytics, ReportsAnalytics } from "../api/reports";

const DAY_OPTIONS = [7, 14, 30, 90];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function hours(value: number | null): string {
  return value === null ? "—" : `${value}h`;
}

export function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [days, setDays] = useState(14);
  const [analytics, setAnalytics] = useState<ReportsAnalytics | null>(null);

  useEffect(() => {
    getReportsAnalytics(days).then(setAnalytics);
  }, [days]);

  const volumeSeries = useMemo(
    () =>
      analytics
        ? [
            { name: "New", color: CATEGORICAL[0], points: analytics.volumeByDay.map((d) => ({ x: d.date, y: d.new })) },
            {
              name: "Resolved",
              color: CATEGORICAL[1],
              points: analytics.volumeByDay.map((d) => ({ x: d.date, y: d.resolved })),
            },
            {
              name: "Closed",
              color: CATEGORICAL[2],
              points: analytics.volumeByDay.map((d) => ({ x: d.date, y: d.closed })),
            },
          ]
        : [],
    [analytics]
  );

  const timeSeries = useMemo(
    () =>
      analytics
        ? [
            {
              name: "Avg First Response (h)",
              color: CATEGORICAL[0],
              points: analytics.responseResolutionByDay.map((d) => ({ x: d.date, y: d.avgFirstResponseHours })),
            },
            {
              name: "Avg Resolution (h)",
              color: CATEGORICAL[1],
              points: analytics.responseResolutionByDay.map((d) => ({ x: d.date, y: d.avgResolutionHours })),
            },
          ]
        : [],
    [analytics]
  );

  const agingBars = useMemo(
    () => (analytics ? analytics.aging.map((a) => ({ label: a.bucket, value: a.count, color: CATEGORICAL[0] })) : []),
    [analytics]
  );

  function exportCurrentTab() {
    if (!analytics) return;
    if (tab === 0) {
      downloadCsv(
        "volume-over-time.csv",
        ["Date", "New", "Resolved", "Closed"],
        analytics.volumeByDay.map((d) => [d.date, d.new, d.resolved, d.closed])
      );
    } else if (tab === 1) {
      downloadCsv(
        "response-resolution-times.csv",
        ["Date", "Avg First Response (h)", "Avg Resolution (h)"],
        analytics.responseResolutionByDay.map((d) => [d.date, d.avgFirstResponseHours, d.avgResolutionHours])
      );
    } else if (tab === 2) {
      downloadCsv(
        "agent-performance.csv",
        ["Agent", "Total Handled", "Avg First Response (h)", "Avg Resolution (h)", `% Resolved within ${analytics.slaHours}h SLA`],
        analytics.agentPerformance.map((a) => [
          a.agentName,
          a.totalHandled,
          a.avgFirstResponseHours,
          a.avgResolutionHours,
          a.resolvedWithinSlaPct,
        ])
      );
    } else {
      downloadCsv(
        "aging-analysis.csv",
        ["Age Bucket", "Open Inquiries"],
        analytics.aging.map((a) => [a.bucket, a.count])
      );
    }
  }

  return (
    <AppLayout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5">Reports</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Select size="small" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {DAY_OPTIONS.map((d) => (
              <MenuItem key={d} value={d}>
                Last {d} days
              </MenuItem>
            ))}
          </Select>
          <Button variant="outlined" onClick={exportCurrentTab} disabled={!analytics}>
            Export CSV
          </Button>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Volume Over Time" />
        <Tab label="Response & Resolution Times" />
        <Tab label="Agent Performance" />
        <Tab label="Aging Analysis" />
      </Tabs>

      <Card>
        <CardContent>
          {!analytics && <Typography color="text.secondary">Loading…</Typography>}

          {analytics && tab === 0 && (
            <LineChart series={volumeSeries} valueFormat={(v) => String(v)} xLabelFormat={formatShortDate} />
          )}

          {analytics && tab === 1 && (
            <LineChart series={timeSeries} valueFormat={(v) => `${v}h`} xLabelFormat={formatShortDate} />
          )}

          {analytics && tab === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell align="right">Total Handled</TableCell>
                    <TableCell align="right">Avg First Response</TableCell>
                    <TableCell align="right">Avg Resolution</TableCell>
                    <TableCell align="right">% Resolved within {analytics.slaHours}h SLA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.agentPerformance.map((row) => (
                    <TableRow key={row.agentId}>
                      <TableCell>{row.agentName}</TableCell>
                      <TableCell align="right">{row.totalHandled}</TableCell>
                      <TableCell align="right">{hours(row.avgFirstResponseHours)}</TableCell>
                      <TableCell align="right">{hours(row.avgResolutionHours)}</TableCell>
                      <TableCell align="right">
                        {row.resolvedWithinSlaPct === null ? "—" : `${row.resolvedWithinSlaPct}%`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {analytics && tab === 3 && <BarChart bars={agingBars} />}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
