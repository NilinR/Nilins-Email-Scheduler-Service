import { and, eq, lt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { emails } from '../db/schema.js';
import { emailQueue, emailJobId } from '../queue/emailQueue.js';
import { config } from '../config.js';

//protects against a hard crash: a row marked 'processing' whose process died
//before it could be marked 'sent' or 'failed' would otherwise sit stuck forever.
export async function runReconciliationSweep(): Promise<void> {
  const staleThreshold = new Date(Date.now() - config.stuckProcessingThresholdMs);

  const stuckRows = await db
    .select()
    .from(emails)
    .where(and(eq(emails.status, 'processing'), lt(emails.updatedAt, staleThreshold)));

  for (const row of stuckRows) {
    //reset to pending, re-enqueue immediately with the SAME jobId - if a job
    //with this jobId somehow still exists in Redis, BullMQ no-ops the add
    await db.update(emails).set({ status: 'pending' }).where(eq(emails.id, row.id));
    await emailQueue.add(
      'send-email',
      { emailId: row.id },
      { jobId: emailJobId(row.id), delay: 0, removeOnComplete: true, removeOnFail: false }
    );
  }

  console.log(`Reconciliation: re-enqueued ${stuckRows.length} stuck job(s)`);
}
