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

const BUCKET_TTL_SEC = 3600 + 60; //buffer past the hour so stale keys clean themselves up

// checks both buckets against their limits and only increments if BOTH pass, all inside one
// EVAL so concurrent workers/process crashes can't split the check from the increment (that
// would either let a job slip through unmetered, or burn a slot on a bucket for a send that
// never happened, silently tightening the limit over time). hasCampaignLimit is a separate
// flag rather than inferring "no limit" from campaignLimit's value, since 0 must stay a valid
// (fully blocking) limit rather than being mistaken for "no override set".
const CHECK_AND_INCR_SCRIPT = `
local senderKey = KEYS[1]
local campaignKey = KEYS[2]
local senderLimit = tonumber(ARGV[1])
local hasCampaignLimit = ARGV[2] == '1'
local campaignLimit = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local senderCount = tonumber(redis.call('GET', senderKey) or '0')
local campaignCount = tonumber(redis.call('GET', campaignKey) or '0')

if senderCount + 1 > senderLimit then
  return 0
end
if hasCampaignLimit and campaignCount + 1 > campaignLimit then
  return 0
end

local newSenderCount = redis.call('INCR', senderKey)
if newSenderCount == 1 then
  redis.call('EXPIRE', senderKey, ttl)
end
if hasCampaignLimit then
  local newCampaignCount = redis.call('INCR', campaignKey)
  if newCampaignCount == 1 then
    redis.call('EXPIRE', campaignKey, ttl)
  end
end

return 1
`;

//fixed-window counters in Redis, safe across multiple worker processes since the check and
//both increments run atomically in a single Lua script (see CHECK_AND_INCR_SCRIPT).
//two caps apply together: the sender-wide bucket always enforces the sending identity's total
//hourly volume (mirrors real providers throttling by sending domain/IP reputation - a sender
//can't get around it by splitting traffic across many campaigns), and a campaign's own
//hourlyLimit, if set, additionally caps that campaign's own share within the hour.
export async function checkAndIncrementRateLimit(
  senderId: string,
  campaignId: string,
  limitOverride?: number | null
): Promise<{ allowed: true; retryAt: null } | { allowed: false; retryAt: number }> {
  const bucket = currentHourBucket();
  const senderLimit = config.maxEmailsPerHourPerSender ?? config.maxEmailsPerHour;
  const hasCampaignLimit = limitOverride != null;

  const result = await connection.eval(
    CHECK_AND_INCR_SCRIPT,
    2,
    `rate:${senderId}:${bucket}`,
    `rate:${senderId}:${campaignId}:${bucket}`,
    String(senderLimit),
    hasCampaignLimit ? '1' : '0',
    String(limitOverride ?? 0),
    String(BUCKET_TTL_SEC)
  );

  if (result === 0) {
    return { allowed: false, retryAt: Date.now() + msUntilNextHour() };
  }
  return { allowed: true, retryAt: null };
}
