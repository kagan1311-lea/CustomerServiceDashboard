import { apiClient } from "./client";
import { InquiryPriority, InquiryStatus } from "../types/inquiry";

export interface AgentWorkload {
  agentId: string;
  agentName: string;
  openCount: number;
  avgAgeDays: number | null;
  resolvedThisWeek: number;
}

export interface DashboardSummary {
  openInquiries: number;
  byStatus: Record<InquiryStatus, number>;
  byPriority: Record<InquiryPriority, number>;
  overdueCount: number;
  resolvedThisWeek: number;
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
  agentWorkload: AgentWorkload[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary");
  return data;
}
