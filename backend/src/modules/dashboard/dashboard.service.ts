import { listInquiries } from "../inquiries/inquiries.repository";
import { listAllMessages } from "../inquiries/messages.repository";
import { listUsers } from "../users/users.repository";
import { InquiryPriority, InquiryStatus } from "../../types/inquiry";

const OVERDUE_DAYS = 3;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function round1(value: number | null): number | null {
  return value === null ? null : Math.round(value * 10) / 10;
}

export async function getDashboardSummary() {
  const [inquiries, messages, users] = await Promise.all([
    listInquiries({}),
    listAllMessages(),
    listUsers(),
  ]);

  const now = Date.now();
  const oneWeekAgo = now - 7 * MS_PER_DAY;

  const byStatus: Record<InquiryStatus, number> = {
    NEW: 0,
    IN_PROGRESS: 0,
    WAITING_ON_CUSTOMER: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };
  for (const inquiry of inquiries) byStatus[inquiry.status]++;

  const openInquiries = inquiries.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED");

  const byPriority: Record<InquiryPriority, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  for (const inquiry of openInquiries) byPriority[inquiry.priority]++;

  const overdueCount = openInquiries.filter(
    (i) => (now - new Date(i.createdAt).getTime()) / MS_PER_DAY > OVERDUE_DAYS
  ).length;

  const resolvedThisWeek = inquiries.filter(
    (i) => i.closedAt && new Date(i.closedAt).getTime() >= oneWeekAgo
  ).length;

  const firstResponseHours = inquiries
    .map((inquiry) => {
      const firstAgentReply = messages
        .filter((m) => m.inquiryId === inquiry.id && m.senderType === "AGENT" && !m.isInternalNote)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      if (!firstAgentReply) return null;
      const hours = (new Date(firstAgentReply.createdAt).getTime() - new Date(inquiry.createdAt).getTime()) / MS_PER_HOUR;
      return hours >= 0 ? hours : null;
    })
    .filter((v): v is number => v !== null);

  const resolutionHours = inquiries
    .map((inquiry) => {
      if (!inquiry.closedAt) return null;
      const hours = (new Date(inquiry.closedAt).getTime() - new Date(inquiry.createdAt).getTime()) / MS_PER_HOUR;
      return hours >= 0 ? hours : null;
    })
    .filter((v): v is number => v !== null);

  const agentWorkload = users
    .filter((u) => u.role === "AGENT")
    .map((agent) => {
      const assigned = openInquiries.filter((i) => i.assignedUserId === agent.id);
      const ageDays = assigned.map((i) => (now - new Date(i.createdAt).getTime()) / MS_PER_DAY);
      return {
        agentId: agent.id,
        agentName: agent.name,
        openCount: assigned.length,
        avgAgeDays: round1(average(ageDays)),
        resolvedThisWeek: inquiries.filter(
          (i) => i.assignedUserId === agent.id && i.closedAt && new Date(i.closedAt).getTime() >= oneWeekAgo
        ).length,
      };
    })
    .sort((a, b) => b.openCount - a.openCount);

  return {
    openInquiries: openInquiries.length,
    byStatus,
    byPriority,
    overdueCount,
    resolvedThisWeek,
    avgFirstResponseHours: round1(average(firstResponseHours)),
    avgResolutionHours: round1(average(resolutionHours)),
    agentWorkload,
  };
}
