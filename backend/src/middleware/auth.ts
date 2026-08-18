import type { NextFunction, Request, Response } from 'express';

declare global {
  //to edit express you need namespace so to enable that:
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// TODO: verify the Auth.js session/JWT and populate req.userId
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  next();
}
