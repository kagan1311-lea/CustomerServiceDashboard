import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { loginHandler, meHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/login", loginHandler);
authRouter.get("/me", requireAuth, meHandler);
