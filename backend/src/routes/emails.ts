import { Router } from 'express';
import { and, eq, ne, desc, inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import { emails, campaigns, campaignAttachments } from '../db/schema.js';
import { emailQueue, emailJobId } from '../queue/emailQueue.js';

const router = Router();

//attaches each row's campaign body (rendered content) and attachment metadata
//(not the base64 data itself - that's fetched on demand via /api/attachments/:id)
async function withBodyAndAttachments<T extends { campaignId: string }>(rows: T[]) {
  if (rows.length === 0) return [];

  const campaignIds = [...new Set(rows.map((r) => r.campaignId))];
  const campaignRows = await db
    .select({ id: campaigns.id, body: campaigns.body })
    .from(campaigns)
    .where(inArray(campaigns.id, campaignIds));
  const bodyByCampaign = new Map(campaignRows.map((c) => [c.id, c.body]));

  const attachmentRows = await db
    .select({
      id: campaignAttachments.id,
      campaignId: campaignAttachments.campaignId,
      filename: campaignAttachments.filename,
      mimeType: campaignAttachments.mimeType,
      size: campaignAttachments.size,
    })
    .from(campaignAttachments)
    .where(inArray(campaignAttachments.campaignId, campaignIds));
  const attachmentsByCampaign = new Map<string, typeof attachmentRows>();
  for (const a of attachmentRows) {
    const list = attachmentsByCampaign.get(a.campaignId) ?? [];
    list.push(a);
    attachmentsByCampaign.set(a.campaignId, list);
  }

  return rows.map((row) => ({
    ...row,
    body: bodyByCampaign.get(row.campaignId) ?? '',
    attachments: attachmentsByCampaign.get(row.campaignId) ?? [],
  }));
}

// GET /api/emails/scheduled - "Scheduled Emails" tab data (pending/processing)
router.get('/scheduled', async (_req, res) => {
  const rows = await db
    .select()
    .from(emails)
    .where(and(ne(emails.status, 'sent'), ne(emails.status, 'failed'), eq(emails.archived, false)))
    .orderBy(emails.scheduledAt);
  res.json(await withBodyAndAttachments(rows));
});

// GET /api/emails/sent - "Sent Emails" tab data
router.get('/sent', async (_req, res) => {
  const rows = await db
    .select()
    .from(emails)
    .where(and(eq(emails.status, 'sent'), eq(emails.archived, false)))
    .orderBy(desc(emails.sentAt));
  res.json(await withBodyAndAttachments(rows));
});

// PATCH /api/emails/:id/star - toggle the starred flag
router.patch('/:id/star', async (req, res) => {
  const { starred } = req.body as { starred: boolean };
  const [row] = await db.select({ id: emails.id }).from(emails).where(eq(emails.id, req.params.id));
  if (!row) return res.status(404).json({ error: 'Email not found' });

  await db.update(emails).set({ starred }).where(eq(emails.id, req.params.id));
  res.json({ id: req.params.id, starred });
});

// PATCH /api/emails/:id/archive - toggle the archived flag (hides it from the scheduled/sent lists)
router.patch('/:id/archive', async (req, res) => {
  const { archived } = req.body as { archived: boolean };
  const [row] = await db.select({ id: emails.id }).from(emails).where(eq(emails.id, req.params.id));
  if (!row) return res.status(404).json({ error: 'Email not found' });

  await db.update(emails).set({ archived }).where(eq(emails.id, req.params.id));
  res.json({ id: req.params.id, archived });
});

// DELETE /api/emails/:id - cancels the pending BullMQ job (if any) and removes the row
router.delete('/:id', async (req, res) => {
  const [row] = await db.select({ status: emails.status }).from(emails).where(eq(emails.id, req.params.id));
  if (!row) return res.status(404).json({ error: 'Email not found' });

  if (row.status === 'pending' || row.status === 'processing') {
    const job = await emailQueue.getJob(emailJobId(req.params.id));
    await job?.remove().catch(() => {}); // job may already be active/locked - deleting the row still stops it from showing up
  }

  await db.delete(emails).where(eq(emails.id, req.params.id));
  res.status(204).end();
});

export default router;
