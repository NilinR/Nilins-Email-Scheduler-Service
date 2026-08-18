import { Queue } from 'bullmq';
import { connection } from './connection.js';

export const EMAIL_QUEUE_NAME = 'emails';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection });

//emails.id uuid is also the BullMQ jobId, so enqueue stays 1:1 with the DB row
export function emailJobId(emailId: string): string {
  return emailId;
}
