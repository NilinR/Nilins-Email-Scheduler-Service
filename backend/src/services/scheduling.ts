import { v4 as uuid } from 'uuid';
import { db } from '../db/client.js';
import { campaigns, emails, campaignAttachments } from '../db/schema.js';
import { emailQueue, emailJobId } from '../queue/emailQueue.js';
import { config } from '../config.js';

//runs when campaigns is called from api

export interface CampaignAttachmentInput {
  filename: string;
  mimeType: string;
  data: string; // base64-encoded file content
}

interface CreateCampaignInput {
  userId: string;
  subject: string;
  body: string;
  senderId: string;
  startTime: Date;
  delayMs: number;
  hourlyLimit?: number;
  recipients: string[]; // validated email addresses
  attachments?: CampaignAttachmentInput[];
}

export async function createCampaign(input: CreateCampaignInput) {
  const campaignId = uuid();

  await db.insert(campaigns).values({
    id: campaignId,
    userId: input.userId,
    subject: input.subject,
    body: input.body,
    senderId: input.senderId,
    startTime: input.startTime,
    delayMs: input.delayMs,
    hourlyLimit: input.hourlyLimit ?? null,
    totalRecipients: input.recipients.length,
  });

  if (input.attachments && input.attachments.length > 0) {
    await db.insert(campaignAttachments).values(
      input.attachments.map((a) => ({
        id: uuid(),
        campaignId,
        filename: a.filename,
        mimeType: a.mimeType,
        size: Buffer.byteLength(a.data, 'base64'),
        data: a.data,
      }))
    );
  }

  // clamp to the server-enforced minimum so scheduledAt reflects what the
  // queue-level limiter will actually honor - otherwise a delayMs smaller than
  // minSendDelayMs makes the displayed schedule drift further from reality
  // with every recipient (limiter throttles sends, but this column wouldn't know)
  const effectiveDelayMs = Math.max(input.delayMs, config.minSendDelayMs);

  //build all email rows with their computed scheduled_at
  const emailRows = input.recipients.map((recipientEmail, index) => {
    const emailId = uuid();
    const scheduledAt = new Date(input.startTime.getTime() + index * effectiveDelayMs);
    return {
      id: emailId,
      campaignId,
      senderId: input.senderId,
      recipientEmail,
      subject: input.subject,
      status: 'pending' as const,
      scheduledAt,
      jobId: emailJobId(emailId),
    };
  });

  await db.insert(emails).values(emailRows);

  //enqueue after the DB write succeeds
  //DB for intent,BullMQ for execution timing.
  //If the process crashes mid-loop, the reconciliation sweep re-enqueues any pending rows that missed, using the same jobId, so it stays safe even on partial enqueue.
  for (const row of emailRows) {
    const delay = Math.max(0, row.scheduledAt.getTime() - Date.now());
    await emailQueue.add(
      'send-email',
      { emailId: row.id },
      { jobId: row.jobId, delay, removeOnComplete: true, removeOnFail: false }
    );
  }

  return { campaignId, count: emailRows.length };
}
