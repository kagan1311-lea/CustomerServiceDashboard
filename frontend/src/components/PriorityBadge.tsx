import { Chip } from "@mui/material";
import { InquiryPriority, PRIORITY_COLORS, PRIORITY_LABELS } from "../types/inquiry";

export function PriorityBadge({ priority }: { priority: InquiryPriority }) {
  return <Chip size="small" label={PRIORITY_LABELS[priority]} color={PRIORITY_COLORS[priority]} />;
}
