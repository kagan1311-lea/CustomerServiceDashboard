import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { listUsers } from "./users.repository";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const users = await listUsers();
    res.json({
      users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
    });
  })
);
