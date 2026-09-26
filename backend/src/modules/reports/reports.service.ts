import { listInquiries } from "../inquiries/inquiries.repository";
import { listAllMessages } from "../inquiries/messages.repository";
import { listUsers } from "../users/users.repository";

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

// Working SLA definition for the "% resolved within SLA" column (spec.md
// section 13.5.4) — no SLA target is defined elsewhere in the spec, so this
// is a documented MVP assumption: resolved within 48h of creation.
const SLA_HOURS = 48;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function lastNDays(days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(Date.now() - i * MS_PER_DAY).toISOString()));
  }
  return keys;
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

export async function getReportsAnalytics(days: number) {
  const [inquiries, messages, users] = await Promise.all([
    listInquiries({}),
    listAllMessages(),
    listUsers(),
  ]);

  const dayKeys = lastNDays(days);

  // First-response and resolution hours per inquiry, plus which day each
  // event happened on (for bucketing the time-series charts).
  const firstResponses = inquiries.map((inquiry) => {
    const firstAgentReply = messages
      .filter((m) => m.inquiryId === inquiry.id && m.senderType === "AGENT" && !m.isInternalNote)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
    if (!firstAgentReply) return null;
    const hours = (new Date(firstAgentReply.createdAt).getTime() - new Date(inquiry.createdAt).getTime()) / MS_PER_HOUR;
    if (hours < 0) return null;
    return { inquiryId: inquiry.id, assignedUserId: inquiry.assignedUserId, hours, day: dayKey(firstAgentReply.createdAt) };
  }).filter((v): v is { inquiryId: string; assignedUserId: string | null; hours: number; day: string } => v !== null);

  const resolutions = inquiries
    .filter((i) => i.closedAt)
    .map((inquiry) => {
      const hours = (new Date(inquiry.closedAt!).getTime() - new Date(inquiry.createdAt).getTime()) / MS_PER_HOUR;
      if (hours < 0) return null;
      return {
        inquiryId: inquiry.id,
        assignedUserId: inquiry.assignedUserId,
        hours,
        day: dayKey(inquiry.closedAt!),
      };
    })
    .filter((v): v is { inquiryId: string; assignedUserId: string | null; hours: number; day: string } => v !== null);

  // spec.md section 13.5.2 — Volume Over Time (New / Resolved / Closed per day).
  const volumeByDay = dayKeys.map((day) => ({
    date: day,
    new: inquiries.filter((i) => dayKey(i.createdAt) === day).length,
    resolved: inquiries.filter((i) => i.status === "RESOLVED" && i.closedAt && dayKey(i.closedAt) === day).length,
    closed: inquiries.filter((i) => i.status === "CLOSED" && i.closedAt && dayKey(i.closedAt) === day).length,
  }));

  // spec.md section 13.5.3 — Response & Resolution Times over time.
  const responseResolutionByDay = dayKeys.map((day) => ({
    date: day,
    avgFirstResponseHours: average(firstResponses.filter((r) => r.day === day).map((r) => r.hours)),
    avgResolutionHours: average(resolutions.filter((r) => r.day === day).map((r) => r.hours)),
  }));

  // spec.md section 13.5.4 — Agent Performance.
  const agentPerformance = users
    .filter((u) => u.role === "AGENT")
    .map((agent) => {
      const assigned = inquiries.filter((i) => i.assignedUserId === agent.id);
      const agentResolutions = resolutions.filter((r) => r.assignedUserId === agent.id);
      const withinSla = agentResolutions.filter((r) => r.hours <= SLA_HOURS).length;
      return {
        agentId: agent.id,
        agentName: agent.name,
        totalHandled: assigned.length,
        avgFirstResponseHours: average(firstResponses.filter((r) => r.assignedUserId === agent.id).map((r) => r.hours)),
        avgResolutionHours: average(agentResolutions.map((r) => r.hours)),
        resolvedWithinSlaPct: agentResolutions.length
          ? Math.round((withinSla / agentResolutions.length) * 1000) / 10
          : null,
      };
    });

  // spec.md section 13.2.5 — Aging Analysis (open inquiries by age bucket).
  const now = Date.now();
  const openInquiries = inquiries.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED");
  const ageBuckets = [
    { bucket: "0-1 days", min: 0, max: 1 },
    { bucket: "1-3 days", min: 1, max: 3 },
    { bucket: "3-7 days", min: 3, max: 7 },
    { bucket: "7+ days", min: 7, max: Infinity },
  ];
  const aging = ageBuckets.map(({ bucket, min, max }) => ({
    bucket,
    count: openInquiries.filter((i) => {
      const ageDays = (now - new Date(i.createdAt).getTime()) / MS_PER_DAY;
      return ageDays >= min && ageDays < max;
    }).length,
  }));

  return { volumeByDay, responseResolutionByDay, agentPerformance, aging, slaHours: SLA_HOURS };
}
