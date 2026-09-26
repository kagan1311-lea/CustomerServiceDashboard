import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createInquiryHandler,
  createMessageHandler,
  getInquiryHandler,
  listInquiriesHandler,
  updateInquiryHandler,
} from "./inquiries.controller";

export const inquiriesRouter = Router();

inquiriesRouter.use(requireAuth);
inquiriesRouter.get("/", asyncHandler(listInquiriesHandler));
inquiriesRouter.post("/", asyncHandler(createInquiryHandler));
inquiriesRouter.get("/:id", asyncHandler(getInquiryHandler));
inquiriesRouter.patch("/:id", asyncHandler(updateInquiryHandler));
inquiriesRouter.post("/:id/messages", asyncHandler(createMessageHandler));
