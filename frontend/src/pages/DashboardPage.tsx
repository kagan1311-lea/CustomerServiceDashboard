import { useEffect, useState } from "react";
import { AppBar, Box, Button, Card, CardContent, Toolbar, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api/client";

interface DashboardSummary {
  openInquiries: number;
}

// KPI row per spec.md section 13.2.1. Only "Total Open Inquiries" is wired
// to real data in Phase 1; the rest land with reporting in Phase 3.
const KPI_PLACEHOLDERS = [
  "Total Open Inquiries",
  "Average First Response Time",
  "Average Resolution Time",
  "Overdue Inquiries",
  "Resolved This Week",
];

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    apiClient.get<DashboardSummary>("/dashboard/summary").then((res) => setSummary(res.data));
  }, []);

  return (
    <Box>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6">Customer Service Dashboard</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              {user?.name} ({user?.role})
            </Typography>
            <Button onClick={logout}>Log out</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box p={3}>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(5, 1fr)" }}
          gap={2}
        >
          {KPI_PLACEHOLDERS.map((label, i) => (
            <Card key={label}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h4">{i === 0 && summary ? summary.openInquiries : "—"}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box mt={4}>
          <Typography variant="body2" color="text.secondary">
            Inquiry management, status/priority widgets, and reports land in Phase 2 and Phase 3
            (see spec.md).
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
