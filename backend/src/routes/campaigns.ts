import { Router } from 'express';
import { desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { campaigns } from '../db/schema.js';

const router = Router();

// GET /api/campaigns - list campaigns (dashboard context)
router.get('/', async (_req, res) => {
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  res.json(rows);
});

// POST /api/campaigns - accept email scheduling requests
// TODO(03-backend-scheduling-queue): wire up services/scheduling.ts to compute
// per-recipient scheduled_at, insert email rows, and enqueue BullMQ jobs.
router.post('/', async (_req, res) => {
  res.status(501).json({ error: 'not implemented yet - see services/scheduling.ts' });
});

export default router;
