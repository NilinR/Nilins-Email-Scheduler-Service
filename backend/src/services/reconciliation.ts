import { and, eq, lt, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import { emails } from '../db/schema.js';
import { emailQueue, emailJobId } from '../queue/emailQueue.js';
import { config } from '../config.js';

//protects against a hard crash: a row marked 'processing' whose process died
//before it could be marked 'sent' or 'failed' would otherwise sit stuck forever.
//Also catches 'pending' rows whose job was lost from Redis for any reason (not just a
//crash - e.g. the add()-with-same-jobId-while-active bug that used to drop rate-limited
//jobs silently) by re-enqueueing anything long past its scheduled time.
export async function runReconciliationSweep(): Promise<void> {
  const staleThreshold = new Date(Date.now() - config.stuckProcessingThresholdMs);

  const stuckRows = await db
    .select()
    .from(emails)
    .where(
      or(
        and(eq(emails.status, 'processing'), lt(emails.updatedAt, staleThreshold)),
        and(eq(emails.status, 'pending'), lt(emails.scheduledAt, staleThreshold))
      )
    );

  let reenqueued = 0;
  for (const row of stuckRows) {
    // a 'pending' row past its scheduled time isn't necessarily orphaned - it may
    // legitimately be sitting in Redis's delayed set waiting on a rate-limit window.
    // Check for an existing job explicitly rather than relying on add()'s same-jobId
    // no-op behavior - that's the exact assumption that caused the original bug.
    const existingJob = await emailQueue.getJob(emailJobId(row.id));
    if (existingJob) continue;

    await db.update(emails).set({ status: 'pending' }).where(eq(emails.id, row.id));
    await emailQueue.add(
      'send-email',
      { emailId: row.id },
      { jobId: emailJobId(row.id), delay: 0, removeOnComplete: true, removeOnFail: false }
    );
    reenqueued++;
  }

  console.log(`Reconciliation: re-enqueued ${reenqueued} stuck job(s), skipped ${stuckRows.length - reenqueued} with a live job already in Redis`);
}
