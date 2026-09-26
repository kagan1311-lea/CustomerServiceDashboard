import { NextFunction, Request, Response } from "express";

// Express 4 does not forward a rejected promise from an async handler to
// error middleware on its own — without this, a thrown error hangs the
// request instead of reaching errorHandler.
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
