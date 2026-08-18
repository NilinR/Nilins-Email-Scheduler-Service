import { Worker, type Job } from 'bullmq';
import { and, eq, ne } from 'drizzle-orm';
import { connection } from './connection.js';
import { EMAIL_QUEUE_NAME, emailQueue, emailJobId } from './emailQueue.js';
import { db } from '../db/client.js';
import { emails, campaigns } from '../db/schema.js';
import { checkAndIncrementRateLimit } from '../services/rateLimiter.js';
import { sendEmail } from '../services/mailer.js';
import { config } from '../config.js';

async function processor(job: Job): Promise<void> {
  const { emailId } = job.data as { emailId: string };

  const [row] = await db
    .select({ email: emails, hourlyLimit: campaigns.hourlyLimit })
    .from(emails)
    .innerJoin(campaigns, eq(emails.campaignId, campaigns.id))
    .where(eq(emails.id, emailId))
    .then((rows) => rows.map((r) => ({ ...r.email, hourlyLimit: r.hourlyLimit })));
  if (!row || row.status === 'sent') return; // already handled - idempotent exit

  const rateLimit = await checkAndIncrementRateLimit(row.senderId, row.hourlyLimit);
  if (!rateLimit.allowed) {
    // no fail, reschedule into the next window, same jobId
    await emailQueue.add(
      'send-email',
      { emailId },
      { jobId: emailJobId(emailId), delay: rateLimit.retryAt - Date.now() }
    );
    return;
  }

  //mark processing
  await db.update(emails).set({ status: 'processing' }).where(eq(emails.id, emailId));

  try {
    await sendEmail(row);

    //Conditional update for idempotency
    //If another attempt already marked this 'sent', this affects 0 rows and no operation is performed
    await db
      .update(emails)
      .set({ status: 'sent', sentAt: new Date() })
      .where(and(eq(emails.id, emailId), ne(emails.status, 'sent')));
  } catch (err) {
    await db
      .update(emails)
      .set({ status: 'failed', errorMessage: (err as Error).message, attempts: row.attempts + 1 })
      .where(eq(emails.id, emailId));
    throw err; //let BullMQ's retry/backoff handle it
  }
}

export const worker = new Worker(EMAIL_QUEUE_NAME, processor, {
  connection,
  concurrency: config.workerConcurrency,
  limiter: {
    max: 1,
    duration: config.minSendDelayMs, //enforced at queue level, safe under any concurrency
  },
});
