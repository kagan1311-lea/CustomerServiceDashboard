import type { Record as AirtableRecord, FieldSet } from "airtable";
import { inquiriesTable } from "../../db/airtable";
import {
  InquiryPriority,
  InquirySource,
  InquiryStatus,
  PRIORITY_FROM_AIRTABLE,
  PRIORITY_TO_AIRTABLE,
  SOURCE_FROM_AIRTABLE,
  SOURCE_TO_AIRTABLE,
  STATUS_FROM_AIRTABLE,
  STATUS_TO_AIRTABLE,
} from "../../types/inquiry";

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

function mapRecord(record: AirtableRecord<FieldSet>): Inquiry {
  const status = record.get("Status") as string | undefined;
  const priority = record.get("Priority") as string | undefined;
  const source = record.get("Source") as string | undefined;
  const assignedAgent = record.get("Assigned Agent") as string[] | undefined;

  return {
    id: record.id,
    subject: (record.get("Subject") as string) ?? "",
    customerName: (record.get("Customer Name") as string) ?? "",
    customerEmail: (record.get("Customer Email") as string) ?? "",
    customerPhone: (record.get("Customer Phone") as string) ?? null,
    category: (record.get("Category") as string) ?? null,
    source: (source ? SOURCE_FROM_AIRTABLE[source] : undefined) ?? "OTHER",
    status: (status ? STATUS_FROM_AIRTABLE[status] : undefined) ?? "NEW",
    priority: (priority ? PRIORITY_FROM_AIRTABLE[priority] : undefined) ?? "MEDIUM",
    assignedUserId: assignedAgent?.[0] ?? null,
    createdAt: (record.get("Created At") as string) ?? "",
    updatedAt: (record.get("Updated At") as string) ?? "",
    closedAt: (record.get("Closed At") as string) ?? null,
  };
}

export interface ListInquiriesParams {
  status?: InquiryStatus[];
  priority?: InquiryPriority[];
  source?: InquirySource;
  category?: string;
  agentId?: string;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
  sortDir?: "asc" | "desc";
}

const PRIORITY_RANK: Record<InquiryPriority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, URGENT: 3 };
const STATUS_RANK: Record<InquiryStatus, number> = {
  NEW: 0,
  IN_PROGRESS: 1,
  WAITING_ON_CUSTOMER: 2,
  RESOLVED: 3,
  CLOSED: 4,
};

export async function listInquiries(params: ListInquiriesParams): Promise<Inquiry[]> {
  const formulaParts: string[] = [];
  if (params.status?.length) {
    formulaParts.push(`OR(${params.status.map((s) => `{Status} = "${STATUS_TO_AIRTABLE[s]}"`).join(", ")})`);
  }
  if (params.priority?.length) {
    formulaParts.push(
      `OR(${params.priority.map((p) => `{Priority} = "${PRIORITY_TO_AIRTABLE[p]}"`).join(", ")})`
    );
  }
  if (params.source) {
    formulaParts.push(`{Source} = "${SOURCE_TO_AIRTABLE[params.source]}"`);
  }
  const filterByFormula = formulaParts.length ? `AND(${formulaParts.join(", ")})` : undefined;

  const records = await inquiriesTable.select(filterByFormula ? { filterByFormula } : {}).all();
  let inquiries = records.map(mapRecord);

  if (params.agentId) {
    inquiries = inquiries.filter((i) => i.assignedUserId === params.agentId);
  }
  if (params.category) {
    const category = params.category.toLowerCase();
    inquiries = inquiries.filter((i) => i.category?.toLowerCase() === category);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    inquiries = inquiries.filter(
      (i) => i.subject.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)
    );
  }

  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir === "asc" ? 1 : -1;
  inquiries.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "priority") cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    else if (sortBy === "status") cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    else cmp = new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime();
    return cmp * sortDir;
  });

  return inquiries;
}

export async function getInquiryById(id: string): Promise<Inquiry | null> {
  try {
    const record = await inquiriesTable.find(id);
    return mapRecord(record);
  } catch {
    return null;
  }
}

export interface CreateInquiryInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  category?: string;
  source: InquirySource;
  status?: InquiryStatus;
  priority?: InquiryPriority;
  assignedUserId?: string;
}

export async function createInquiry(input: CreateInquiryInput): Promise<Inquiry> {
  const now = new Date().toISOString();
  const [record] = await inquiriesTable.create([
    {
      fields: {
        Subject: input.subject,
        "Customer Name": input.customerName,
        "Customer Email": input.customerEmail,
        ...(input.customerPhone ? { "Customer Phone": input.customerPhone } : {}),
        ...(input.category ? { Category: input.category } : {}),
        Source: SOURCE_TO_AIRTABLE[input.source],
        Status: STATUS_TO_AIRTABLE[input.status ?? "NEW"],
        Priority: PRIORITY_TO_AIRTABLE[input.priority ?? "MEDIUM"],
        ...(input.assignedUserId ? { "Assigned Agent": [input.assignedUserId] } : {}),
        "Created At": now,
        "Updated At": now,
      },
    },
  ]);
  return mapRecord(record);
}

export interface UpdateInquiryInput {
  status?: InquiryStatus;
  priority?: InquiryPriority;
  assignedUserId?: string | null;
}

export async function updateInquiry(id: string, patch: UpdateInquiryInput): Promise<Inquiry> {
  const fields: Record<string, string | string[]> = { "Updated At": new Date().toISOString() };
  if (patch.status) {
    fields.Status = STATUS_TO_AIRTABLE[patch.status];
    if (patch.status === "RESOLVED" || patch.status === "CLOSED") {
      fields["Closed At"] = new Date().toISOString();
    }
  }
  if (patch.priority) {
    fields.Priority = PRIORITY_TO_AIRTABLE[patch.priority];
  }
  if (patch.assignedUserId !== undefined) {
    fields["Assigned Agent"] = patch.assignedUserId ? [patch.assignedUserId] : [];
  }

  const [record] = await inquiriesTable.update([{ id, fields }]);
  return mapRecord(record);
}
