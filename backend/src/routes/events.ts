import { Router } from 'express';
import { QueueEvents } from 'bullmq';
import { eq } from 'drizzle-orm';
import { connection } from '../queue/connection.js';
import { EMAIL_QUEUE_NAME } from '../queue/emailQueue.js';
import { db } from '../db/client.js';
import { emails } from '../db/schema.js';

const router = Router();

// separate BullMQ class that listens to queue events via Redis pub/sub -
// safe to use here even though the worker runs in its own process (worker.ts)
const queueEvents = new QueueEvents(EMAIL_QUEUE_NAME, { connection });

function emailIdFromJobId(jobId: string): string {
  return jobId.replace(/^email-/, '');
}

// GET /api/events - SSE stream for live updates to scheduled/sent tables
router.get('/', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('retry: 3000\n\n');

  const send = (emailId: string, status: string) => {
    res.write(`event: email-updated\ndata: ${JSON.stringify({ emailId, status })}\n\n`);
  };

  // BullMQ's completed/failed events reflect job outcome, not email outcome - a rate-limited
  // job completes normally after requeuing itself, so we look up the real DB status rather
  // than trusting the event type, and only emit for genuinely terminal states
  const reportRealStatus = async (jobId: string) => {
    const emailId = emailIdFromJobId(jobId);
    const [row] = await db.select({ status: emails.status }).from(emails).where(eq(emails.id, emailId));
    if (row && (row.status === 'sent' || row.status === 'failed')) {
      send(emailId, row.status);
    }
  };

  // a rate-limited job gets moved to delayed (not completed/failed) with nextAttemptAt set -
  // without this, the "Retrying at" label only appears on the next unrelated refetch
  const onDelayed = ({ jobId }: { jobId: string }) => send(emailIdFromJobId(jobId), 'pending');

  const onCompleted = ({ jobId }: { jobId: string }) => void reportRealStatus(jobId);
  const onFailed = ({ jobId }: { jobId: string }) => void reportRealStatus(jobId);

  queueEvents.on('completed', onCompleted);
  queueEvents.on('failed', onFailed);
  queueEvents.on('delayed', onDelayed);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    queueEvents.off('completed', onCompleted);
    queueEvents.off('failed', onFailed);
    queueEvents.off('delayed', onDelayed);
    res.end();
  });
});

export default router;
