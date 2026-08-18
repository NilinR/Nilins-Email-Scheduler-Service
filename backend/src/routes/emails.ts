import { Router } from 'express';
import { and, eq, ne, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { emails } from '../db/schema.js';

const router = Router();

// GET /api/emails/scheduled - "Scheduled Emails" tab data (pending/processing)
router.get('/scheduled', async (_req, res) => {
  const rows = await db
    .select()
    .from(emails)
    .where(and(ne(emails.status, 'sent'), ne(emails.status, 'failed')))
    .orderBy(emails.scheduledAt);
  res.json(rows);
});

// GET /api/emails/sent - "Sent Emails" tab data
router.get('/sent', async (_req, res) => {
  const rows = await db
    .select()
    .from(emails)
    .where(eq(emails.status, 'sent'))
    .orderBy(desc(emails.sentAt));
  res.json(rows);
});

export default router;
