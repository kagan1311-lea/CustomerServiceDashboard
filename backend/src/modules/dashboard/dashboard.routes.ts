import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { inquiriesTable } from "../../db/airtable";

export const dashboardRouter = Router();

// Placeholder for the Phase 1 skeleton. Status/priority breakdowns, agent
// workload, and SLA widgets from spec.md section 13.2 land in Phase 3.
dashboardRouter.get("/summary", requireAuth, async (_req, res) => {
  const openRecords = await inquiriesTable
    .select({
      filterByFormula: `NOT(OR({Status} = "Resolved", {Status} = "Closed"))`,
      fields: ["Status"],
    })
    .all();

  res.json({ openInquiries: openRecords.length });
});
