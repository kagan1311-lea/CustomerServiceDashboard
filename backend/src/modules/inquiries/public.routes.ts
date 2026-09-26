import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { createInquiry } from "./inquiries.repository";
import { createMessage } from "./messages.repository";

export const publicInquiriesRouter = Router();

// spec.md section 4.1.1 "Create Inquiry — Via web form (public)". No auth —
// this is the endpoint a public "Contact Us" form on the company site posts to.
const publicInquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1),
  category: z.string().optional(),
  message: z.string().min(1),
  consent: z.literal(true),
});

publicInquiriesRouter.post(
  "/inquiries",
  asyncHandler(async (req, res) => {
    const parsed = publicInquirySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
    }

    const inquiry = await createInquiry({
      customerName: parsed.data.name,
      customerEmail: parsed.data.email,
      customerPhone: parsed.data.phone,
      subject: parsed.data.subject,
      category: parsed.data.category,
      source: "WEB",
    });

    await createMessage({
      inquiryId: inquiry.id,
      senderType: "CUSTOMER",
      content: parsed.data.message,
      isInternalNote: false,
    });

    res.status(201).json({ id: inquiry.id });
  })
);
