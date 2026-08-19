import type { NextFunction, Request, Response } from 'express';
import { connection } from '../queue/connection.js';
import { config } from '../config.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

// parses the header into req.idempotencyKey - the actual dedupe check happens per-route via
// runIdempotent, since only the route knows what a "successful response" looks like to cache
export function idempotency(req: Request, res: Response, next: NextFunction): void {
  const key = req.header('Idempotency-Key');
  if (key) {
    req.idempotencyKey = key;
  }
  next();
}

interface RouteResult {
  status: number;
  body: unknown;
}

// thrown to short-circuit runIdempotent when the key is a duplicate/in-flight - callers
// should let it propagate to Express (it already carries the response to send)
export class IdempotencyConflictError extends Error {
  constructor(public readonly result: RouteResult) {
    super('Idempotency-Key conflict');
  }
}

const LOCK_VALUE = 'processing';

function redisKey(scope: string, key: string): string {
  return `idempotency:${scope}:${key}`;
}

// Runs `fn` with Redis-backed Idempotency-Key enforcement:
// - a key with a cached response replays it verbatim, without re-running fn
// - a key that's mid-flight (another request holding the lock) throws IdempotencyConflictError
// - a fresh key claims a short-lived lock, runs fn once, then caches its result for the full
//   TTL; the lock is released on failure so a legitimate retry isn't stuck behind our own error
export async function runIdempotent(scope: string, key: string | undefined, fn: () => Promise<RouteResult>): Promise<RouteResult> {
  if (!key) return fn(); // caller isn't opting into dedupe

  const cacheKey = redisKey(scope, key);

  const existing = await connection.get(cacheKey);
  if (existing && existing !== LOCK_VALUE) {
    return JSON.parse(existing) as RouteResult;
  }
  if (existing === LOCK_VALUE) {
    throw new IdempotencyConflictError({
      status: 409,
      body: { error: 'A request with this Idempotency-Key is already being processed. Retry shortly.' },
    });
  }

  const claimed = await connection.set(cacheKey, LOCK_VALUE, 'EX', config.idempotencyLockTtlSec, 'NX');
  if (claimed !== 'OK') {
    // lost the race to a concurrent request with the same key between our GET and this SET
    throw new IdempotencyConflictError({
      status: 409,
      body: { error: 'A request with this Idempotency-Key is already being processed. Retry shortly.' },
    });
  }

  try {
    const result = await fn();
    await connection.set(cacheKey, JSON.stringify(result), 'EX', config.idempotencyResponseTtlSec);
    return result;
  } catch (err) {
    await connection.del(cacheKey); // don't let our own error permanently block retries
    throw err;
  }
}
