import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { listInquiries } from "../inquiries/inquiries.repository";
import { parseListQuery } from "../inquiries/inquiries.controller";

export const reportsRouter = Router();

function toCsvField(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(toCsvField).join(",");
}

// spec.md section 4.2.2 — CSV export (MVP). Accepts the same filters as
// GET /api/inquiries.
reportsRouter.get(
  "/inquiries.csv",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = parseListQuery(req.query);
    const inquiries = await listInquiries(params);

    const header = toCsvRow([
      "ID",
      "Subject",
      "Customer Name",
      "Customer Email",
      "Source",
      "Status",
      "Priority",
      "Assigned Agent Id",
      "Created At",
      "Updated At",
      "Closed At",
    ]);
    const rows = inquiries.map((i) =>
      toCsvRow([
        i.id,
        i.subject,
        i.customerName,
        i.customerEmail,
        i.source,
        i.status,
        i.priority,
        i.assignedUserId,
        i.createdAt,
        i.updatedAt,
        i.closedAt,
      ])
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=inquiries.csv");
    res.send([header, ...rows].join("\n"));
  })
);
