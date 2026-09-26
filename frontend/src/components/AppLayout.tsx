import { ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/inquiries", label: "Inquiries" },
  { to: "/reports", label: "Reports" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <Box>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box display="flex" alignItems="center" gap={3}>
            <Typography variant="h6">Customer Service Dashboard</Typography>
            <Box display="flex" gap={1}>
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  variant={location.pathname === link.to ? "contained" : "text"}
                  size="small"
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              {user?.name} ({user?.role})
            </Typography>
            <Button onClick={logout}>Log out</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box p={3}>{children}</Box>
    </Box>
  );
}
