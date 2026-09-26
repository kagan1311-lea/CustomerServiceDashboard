import { apiClient } from "./client";
import { Inquiry, InquiryMessage, InquiryPriority, InquirySource, InquiryStatus } from "../types/inquiry";

export interface ListInquiriesParams {
  status?: InquiryStatus[];
  priority?: InquiryPriority[];
  source?: InquirySource;
  agentId?: string;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
  sortDir?: "asc" | "desc";
}

function toQueryParams(params: ListInquiriesParams) {
  const query: Record<string, string> = {};
  if (params.status?.length) query.status = params.status.join(",");
  if (params.priority?.length) query.priority = params.priority.join(",");
  if (params.source) query.source = params.source;
  if (params.agentId) query.agentId = params.agentId;
  if (params.search) query.search = params.search;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortDir) query.sortDir = params.sortDir;
  return query;
}

export async function listInquiries(params: ListInquiriesParams): Promise<Inquiry[]> {
  const { data } = await apiClient.get<{ inquiries: Inquiry[] }>("/inquiries", {
    params: toQueryParams(params),
  });
  return data.inquiries;
}

export async function getInquiry(id: string): Promise<{ inquiry: Inquiry; messages: InquiryMessage[] }> {
  const { data } = await apiClient.get<{ inquiry: Inquiry; messages: InquiryMessage[] }>(`/inquiries/${id}`);
  return data;
}

export interface CreateInquiryInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  category?: string;
  source: InquirySource;
  priority?: InquiryPriority;
  assignedUserId?: string;
  message: string;
}

export async function createInquiry(input: CreateInquiryInput): Promise<Inquiry> {
  const { data } = await apiClient.post<{ inquiry: Inquiry }>("/inquiries", input);
  return data.inquiry;
}

export interface UpdateInquiryInput {
  status?: InquiryStatus;
  priority?: InquiryPriority;
  assignedUserId?: string | null;
}

export async function updateInquiry(id: string, patch: UpdateInquiryInput): Promise<Inquiry> {
  const { data } = await apiClient.patch<{ inquiry: Inquiry }>(`/inquiries/${id}`, patch);
  return data.inquiry;
}

export async function addMessage(
  id: string,
  input: { content: string; isInternalNote: boolean }
): Promise<InquiryMessage> {
  const { data } = await apiClient.post<{ message: InquiryMessage }>(`/inquiries/${id}/messages`, input);
  return data.message;
}

export async function downloadInquiriesCsv(params: ListInquiriesParams): Promise<void> {
  const response = await apiClient.get("/reports/inquiries.csv", {
    params: toQueryParams(params),
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "inquiries.csv";
  link.click();
  URL.revokeObjectURL(url);
}
