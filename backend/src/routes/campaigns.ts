import { Router } from 'express';
import { desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { campaigns } from '../db/schema.js';
import { createCampaign } from '../services/scheduling.js';

const router = Router();

// GET /api/campaigns - list campaigns (dashboard context)
router.get('/', async (_req, res) => {
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  res.json(rows);
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/campaigns - accept email scheduling requests
router.post('/', async (req, res) => {
  const { userId, subject, body, senderId, startTime, delayMs, hourlyLimit, recipients } = req.body ?? {};

  if (typeof userId !== 'string' || !userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (typeof subject !== 'string' || !subject) {
    return res.status(400).json({ error: 'subject is required' });
  }
  if (typeof body !== 'string' || !body) {
    return res.status(400).json({ error: 'body is required' });
  }
  if (typeof senderId !== 'string' || !senderId) {
    return res.status(400).json({ error: 'senderId is required' });
  }
  const startTimeDate = new Date(startTime);
  if (Number.isNaN(startTimeDate.getTime())) {
    return res.status(400).json({ error: 'startTime must be a valid date' });
  }
  if (typeof delayMs !== 'number' || delayMs < 0) {
    return res.status(400).json({ error: 'delayMs must be a non-negative number' });
  }
  if (hourlyLimit !== undefined && (typeof hourlyLimit !== 'number' || hourlyLimit <= 0)) {
    return res.status(400).json({ error: 'hourlyLimit must be a positive number' });
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'recipients must be a non-empty array' });
  }
  const validRecipients = recipients.filter((r): r is string => typeof r === 'string' && EMAIL_RE.test(r));
  const skippedRecipients = recipients.filter((r) => !validRecipients.includes(r));
  if (validRecipients.length === 0) {
    return res.status(400).json({ error: 'No valid recipient emails in request.' });
  }

  const result = await createCampaign({
    userId,
    subject,
    body,
    senderId,
    startTime: startTimeDate,
    delayMs,
    hourlyLimit,
    recipients: validRecipients,
  });

  res.status(201).json({ ...result, skippedRecipients });
});

export default router;
