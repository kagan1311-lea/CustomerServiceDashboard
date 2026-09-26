import { Request, Response } from "express";
import { z } from "zod";
import { getCurrentUser, InvalidCredentialsError, login } from "./auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
  }

  try {
    const result = await login(parsed.data.email, parsed.data.password);
    res.json(result);
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return res.status(401).json({ error: err.message });
    }
    throw err;
  }
}

export async function meHandler(req: Request, res: Response) {
  const user = await getCurrentUser(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
}
