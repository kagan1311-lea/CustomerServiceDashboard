import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { getDashboardSummary } from "./dashboard.service";

export const dashboardRouter = Router();

// Widgets per spec.md section 13.2: status/priority breakdown, agent
// workload, overdue count, resolved-this-week, and response/resolution
// times computed from the InquiryMessages log (section 4.2.1).
dashboardRouter.get(
  "/summary",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const summary = await getDashboardSummary();
    res.json(summary);
  })
);
