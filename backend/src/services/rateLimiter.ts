import { connection } from '../queue/connection.js';
import { config } from '../config.js';

//hour bucket truncated to hour
function currentHourBucket(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
}

function msUntilNextHour(): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
  return next.getTime() - now.getTime();
}

//fixed-window counter in Redis, safe across multiple worker processes since INCR is atomic.
//limitOverride lets a campaign's own hourlyLimit take priority over the sender/global config.
export async function checkAndIncrementRateLimit(
  senderId: string,
  limitOverride?: number | null
): Promise<{ allowed: true; retryAt: null } | { allowed: false; retryAt: number }> {
  const limit = limitOverride ?? config.maxEmailsPerHourPerSender ?? config.maxEmailsPerHour;
  const bucket = currentHourBucket();
  const key = `rate:${senderId}:${bucket}`;

  const count = await connection.incr(key);
  if (count === 1) {
    await connection.expire(key, 3600 + 60); //buffer past the hour so stale keys clean themselves up
  }

  if (count > limit) {
    return { allowed: false, retryAt: Date.now() + msUntilNextHour() };
  }
  return { allowed: true, retryAt: null };
}
