import { apiClient } from "./client";

export interface VolumeDay {
  date: string;
  new: number;
  resolved: number;
  closed: number;
}

export interface ResponseResolutionDay {
  date: string;
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
}

export interface AgentPerformanceRow {
  agentId: string;
  agentName: string;
  totalHandled: number;
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
  resolvedWithinSlaPct: number | null;
}

export interface AgingBucket {
  bucket: string;
  count: number;
}

export interface ReportsAnalytics {
  volumeByDay: VolumeDay[];
  responseResolutionByDay: ResponseResolutionDay[];
  agentPerformance: AgentPerformanceRow[];
  aging: AgingBucket[];
  slaHours: number;
}

export async function getReportsAnalytics(days: number): Promise<ReportsAnalytics> {
  const { data } = await apiClient.get<ReportsAnalytics>("/reports/analytics", { params: { days } });
  return data;
}
