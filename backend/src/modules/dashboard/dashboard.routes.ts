import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "../../db/prisma";

export const dashboardRouter = Router();

// Placeholder for the Phase 1 skeleton. Status/priority breakdowns, agent
// workload, and SLA widgets from spec.md section 13.2 land in Phase 3.
dashboardRouter.get("/summary", requireAuth, async (_req, res) => {
  const openInquiries = await prisma.inquiry.count({
    where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
  });

  res.json({ openInquiries });
});
