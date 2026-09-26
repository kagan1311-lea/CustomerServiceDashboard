export type InquiryStatus = "NEW" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";
export type InquiryPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type InquirySource = "WEB" | "PHONE" | "EMAIL" | "CHAT" | "OTHER";
export type MessageSenderType = "CUSTOMER" | "AGENT" | "SYSTEM";

export const STATUS_TO_AIRTABLE: Record<InquiryStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  WAITING_ON_CUSTOMER: "Waiting on Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
export const STATUS_FROM_AIRTABLE: Record<string, InquiryStatus> = {
  New: "NEW",
  "In Progress": "IN_PROGRESS",
  "Waiting on Customer": "WAITING_ON_CUSTOMER",
  Resolved: "RESOLVED",
  Closed: "CLOSED",
};

export const PRIORITY_TO_AIRTABLE: Record<InquiryPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};
export const PRIORITY_FROM_AIRTABLE: Record<string, InquiryPriority> = {
  Low: "LOW",
  Medium: "MEDIUM",
  High: "HIGH",
  Urgent: "URGENT",
};

export const SOURCE_TO_AIRTABLE: Record<InquirySource, string> = {
  WEB: "Web",
  PHONE: "Phone",
  EMAIL: "Email",
  CHAT: "Chat",
  OTHER: "Other",
};
export const SOURCE_FROM_AIRTABLE: Record<string, InquirySource> = {
  Web: "WEB",
  Phone: "PHONE",
  Email: "EMAIL",
  Chat: "CHAT",
  Other: "OTHER",
};

export const SENDER_TYPE_TO_AIRTABLE: Record<MessageSenderType, string> = {
  CUSTOMER: "Customer",
  AGENT: "Agent",
  SYSTEM: "System",
};
export const SENDER_TYPE_FROM_AIRTABLE: Record<string, MessageSenderType> = {
  Customer: "CUSTOMER",
  Agent: "AGENT",
  System: "SYSTEM",
};

// spec.md section 4.1.4 — allowed status transitions.
export const ALLOWED_STATUS_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  NEW: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING_ON_CUSTOMER", "RESOLVED"],
  WAITING_ON_CUSTOMER: ["IN_PROGRESS"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
};
