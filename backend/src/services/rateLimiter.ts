// TODO(04-backend-rate-limiting): replace with the real Redis fixed-window counter
export async function checkAndIncrementRateLimit(
  senderId: string
): Promise<{ allowed: true } | { allowed: false; retryAt: number }> {
  return { allowed: true };
}
