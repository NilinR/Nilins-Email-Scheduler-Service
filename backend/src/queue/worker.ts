import { Worker, type Job } from 'bullmq';
import { connection } from './connection.js';
import { EMAIL_QUEUE_NAME } from './emailQueue.js';
import { config } from '../config.js';

// TODO(03-backend-scheduling-queue): replace with the real send-email processor
async function processor(job: Job): Promise<void> {
  console.log(`[worker] processing job ${job.id}`, job.data);
}

export const worker = new Worker(EMAIL_QUEUE_NAME, processor, {
  connection,
  concurrency: config.workerConcurrency,
});
