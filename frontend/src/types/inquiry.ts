export type InquiryStatus = "NEW" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
export type InquiryPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type InquirySource = "WEB" | "PHONE" | "EMAIL" | "CHAT" | "OTHER";
export type MessageSenderType = "CUSTOMER" | "AGENT" | "SYSTEM";

export interface Inquiry {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  category: string | null;
  source: InquirySource;
  status: InquiryStatus;
  priority: InquiryPriority;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface InquiryMessage {
  id: string;
  inquiryId: string;
  senderType: MessageSenderType;
  senderId: string | null;
  content: string;
  isInternalNote: boolean;
  createdAt: string;
}

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  WAITING_ON_CUSTOMER: "Waiting on Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const PRIORITY_LABELS: Record<InquiryPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const SOURCE_LABELS: Record<InquirySource, string> = {
  WEB: "Web",
  PHONE: "Phone",
  EMAIL: "Email",
  CHAT: "Chat",
  OTHER: "Other",
};

// spec.md section 13.6 semantic colors: red=urgent/overdue, amber=high/warning,
// green=resolved/ok, blue=info.
export const STATUS_COLORS: Record<InquiryStatus, "info" | "warning" | "success" | "default"> = {
  NEW: "info",
  IN_PROGRESS: "warning",
  WAITING_ON_CUSTOMER: "warning",
  RESOLVED: "success",
  CLOSED: "default",
};

export const PRIORITY_COLORS: Record<InquiryPriority, "default" | "info" | "warning" | "error"> = {
  LOW: "default",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "error",
};

// spec.md section 4.1.4 — allowed status transitions.
export const ALLOWED_STATUS_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  NEW: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING_ON_CUSTOMER", "RESOLVED"],
  WAITING_ON_CUSTOMER: ["IN_PROGRESS"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};
