import { Queue } from 'bullmq';
import { connection } from './connection.js';

export const EMAIL_QUEUE_NAME = 'emails';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection });

// deterministic - same email row always maps to same jobId, so re-enqueuing
// (e.g. a retried request, or the reconciliation sweep) is a safe no-op
export function emailJobId(emailId: string): string {
  return `email-${emailId}`;
}
