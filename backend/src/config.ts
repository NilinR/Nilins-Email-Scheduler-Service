import 'dotenv/config';

//read env var
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set (see backend/.env.example)`);
  }
  return value;
}

function optionalInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number, got "${value}"`);
  }
  return parsed;
}

//appl config values
export const config = {
  port: optionalInt('PORT', 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  databaseUrl: required('DATABASE_URL'),

  redisHost: process.env.REDIS_HOST ?? 'localhost',
  redisPort: optionalInt('REDIS_PORT', 6379),

  maxEmailsPerHour: optionalInt('MAX_EMAILS_PER_HOUR', 200),
  //falls back to maxEmailsPerHour if unset
  maxEmailsPerHourPerSender: process.env.MAX_EMAILS_PER_HOUR_PER_SENDER
    ? Number(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER)
    : undefined,

  minSendDelayMs: optionalInt('MIN_SEND_DELAY_MS', 2000),

  workerConcurrency: optionalInt('WORKER_CONCURRENCY', 5),

  stuckProcessingThresholdMs: optionalInt('STUCK_PROCESSING_THRESHOLD_MS', 300000),

  nextAuthUrl: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',

  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
};
