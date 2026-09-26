import { Request, Response } from "express";
import { z } from "zod";
import {
  createInquiry,
  getInquiryById,
  listInquiries,
  updateInquiry,
} from "./inquiries.repository";
import { createMessage, listMessagesForInquiry } from "./messages.repository";
import { ALLOWED_STATUS_TRANSITIONS } from "../../types/inquiry";

const STATUS_VALUES = ["NEW", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"] as const;
const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const SOURCE_VALUES = ["WEB", "PHONE", "EMAIL", "CHAT", "OTHER"] as const;

const listQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  source: z.enum(SOURCE_VALUES).optional(),
  category: z.string().optional(),
  agentId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "priority", "status"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

type Status = (typeof STATUS_VALUES)[number];
type Priority = (typeof PRIORITY_VALUES)[number];

function isStatus(value: string): value is Status {
  return (STATUS_VALUES as readonly string[]).includes(value);
}

function isPriority(value: string): value is Priority {
  return (PRIORITY_VALUES as readonly string[]).includes(value);
}

export function parseListQuery(query: unknown) {
  const parsed = listQuerySchema.parse(query);
  return {
    status: parsed.status ? parsed.status.split(",").filter(isStatus) : undefined,
    priority: parsed.priority ? parsed.priority.split(",").filter(isPriority) : undefined,
    source: parsed.source,
    category: parsed.category,
    agentId: parsed.agentId,
    search: parsed.search,
    sortBy: parsed.sortBy,
    sortDir: parsed.sortDir,
  };
}

export async function listInquiriesHandler(req: Request, res: Response) {
  const params = parseListQuery(req.query);
  const inquiries = await listInquiries(params);
  res.json({ inquiries });
}

export async function getInquiryHandler(req: Request, res: Response) {
  const inquiry = await getInquiryById(req.params.id);
  if (!inquiry) {
    return res.status(404).json({ error: "Inquiry not found" });
  }
  const messages = await listMessagesForInquiry(inquiry.id);
  res.json({ inquiry, messages });
}

const createInquirySchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  subject: z.string().min(1),
  category: z.string().optional(),
  source: z.enum(SOURCE_VALUES).default("WEB"),
  priority: z.enum(PRIORITY_VALUES).optional(),
  assignedUserId: z.string().optional(),
  message: z.string().min(1),
});

export async function createInquiryHandler(req: Request, res: Response) {
  const parsed = createInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }

  const inquiry = await createInquiry(parsed.data);
  await createMessage({
    inquiryId: inquiry.id,
    senderType: "CUSTOMER",
    content: parsed.data.message,
    isInternalNote: false,
  });

  res.status(201).json({ inquiry });
}

const updateInquirySchema = z.object({
  status: z.enum(STATUS_VALUES).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  assignedUserId: z.string().nullable().optional(),
});

export async function updateInquiryHandler(req: Request, res: Response) {
  const parsed = updateInquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }

  if (parsed.data.assignedUserId !== undefined && req.user!.role === "AGENT") {
    return res.status(403).json({ error: "Only managers and admins can assign inquiries" });
  }

  if (parsed.data.status) {
    const current = await getInquiryById(req.params.id);
    if (!current) {
      return res.status(404).json({ error: "Inquiry not found" });
    }
    const allowed = ALLOWED_STATUS_TRANSITIONS[current.status];
    if (!allowed.includes(parsed.data.status)) {
      return res.status(400).json({
        error: `Cannot move status from ${current.status} to ${parsed.data.status}`,
      });
    }
  }

  const inquiry = await updateInquiry(req.params.id, parsed.data);
  res.json({ inquiry });
}

const createMessageSchema = z.object({
  content: z.string().min(1),
  isInternalNote: z.boolean().default(false),
});

export async function createMessageHandler(req: Request, res: Response) {
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }

  const inquiry = await getInquiryById(req.params.id);
  if (!inquiry) {
    return res.status(404).json({ error: "Inquiry not found" });
  }

  const message = await createMessage({
    inquiryId: inquiry.id,
    senderType: "AGENT",
    senderId: req.user!.id,
    content: parsed.data.content,
    isInternalNote: parsed.data.isInternalNote,
  });

  res.status(201).json({ message });
}
