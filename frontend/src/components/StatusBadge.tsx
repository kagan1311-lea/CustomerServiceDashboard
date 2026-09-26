import { Chip } from "@mui/material";
import { InquiryStatus, STATUS_COLORS, STATUS_LABELS } from "../types/inquiry";

export function StatusBadge({ status }: { status: InquiryStatus }) {
  return <Chip size="small" label={STATUS_LABELS[status]} color={STATUS_COLORS[status]} variant="outlined" />;
}
