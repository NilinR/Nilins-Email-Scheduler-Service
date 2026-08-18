import type { NextFunction, Request, Response } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

// TODO: dedupe requests by Idempotency-Key against a store (see 03/04)
export function idempotency(req: Request, res: Response, next: NextFunction): void {
  const key = req.header('Idempotency-Key');
  if (key) {
    req.idempotencyKey = key;
  }
  next();
}
