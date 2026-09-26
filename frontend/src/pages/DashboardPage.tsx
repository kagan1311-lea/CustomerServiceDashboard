import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { AppLayout } from "../components/AppLayout";
import { DashboardSummary, getDashboardSummary } from "../api/dashboard";
import { PRIORITY_LABELS, STATUS_LABELS } from "../types/inquiry";

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );
}

function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 24) return `${hours}h`;
  return `${Math.round((hours / 24) * 10) / 10}d`;
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    getDashboardSummary().then(setSummary);
  }, []);

  return (
    <AppLayout>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(5, 1fr)" }}
        gap={2}
      >
        <KpiCard label="Total Open Inquiries" value={summary ? String(summary.openInquiries) : "—"} />
        <KpiCard label="Avg First Response Time" value={summary ? formatHours(summary.avgFirstResponseHours) : "—"} />
        <KpiCard label="Avg Resolution Time" value={summary ? formatHours(summary.avgResolutionHours) : "—"} />
        <KpiCard label="Overdue Inquiries" value={summary ? String(summary.overdueCount) : "—"} />
        <KpiCard label="Resolved This Week" value={summary ? String(summary.resolvedThisWeek) : "—"} />
      </Box>

      <Box mt={3} display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap={2}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Inquiries by Status
            </Typography>
            {summary &&
              Object.entries(summary.byStatus).map(([status, count]) => (
                <Box key={status} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {count}
                  </Typography>
                </Box>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Open Inquiries by Priority
            </Typography>
            {summary &&
              Object.entries(summary.byPriority).map(([priority, count]) => (
                <Box key={priority} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">
                    {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS]}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {count}
                  </Typography>
                </Box>
              ))}
          </CardContent>
        </Card>
      </Box>

      <Box mt={2}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Agent Workload
            </Typography>
            {summary?.agentWorkload.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No agents yet.
              </Typography>
            )}
            {summary?.agentWorkload.map((agent) => (
              <Box
                key={agent.agentId}
                display="flex"
                justifyContent="space-between"
                py={0.75}
                borderBottom="1px solid"
                borderColor="divider"
              >
                <Typography variant="body2">{agent.agentName}</Typography>
                <Box display="flex" gap={3}>
                  <Typography variant="body2" color="text.secondary">
                    Open: {agent.openCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg age: {agent.avgAgeDays ?? "—"}d
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved this week: {agent.resolvedThisWeek}
                  </Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
