import { Router } from 'express';
import { db } from '../db/client.js';
import { senders } from '../db/schema.js';

const router = Router();

// GET /api/senders - populate sender dropdown in Compose
router.get('/', async (_req, res) => {
  const rows = await db
    .select({
      id: senders.id,
      name: senders.name,
      fromEmail: senders.fromEmail,
    })
    .from(senders);
  res.json(rows);
});

export default router;
