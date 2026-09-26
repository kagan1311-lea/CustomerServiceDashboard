import { createTheme } from "@mui/material/styles";

// Semantic colors per spec.md section 13.6: red=urgent/overdue,
// amber=high priority/warning, green=resolved/within SLA, blue=info/links.
export const theme = createTheme({
  palette: {
    background: { default: "#f5f6f8" },
    primary: { main: "#2f6fed" },
    error: { main: "#e5484d" },
    warning: { main: "#f5a524" },
    success: { main: "#12b76a" },
    info: { main: "#2f6fed" },
  },
  shape: { borderRadius: 8 },
});
