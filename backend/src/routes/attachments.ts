import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { campaignAttachments } from '../db/schema.js';

const router = Router();

// GET /api/attachments/:id - streams the raw file so it can be viewed/downloaded
router.get('/:id', async (req, res) => {
  const [row] = await db
    .select()
    .from(campaignAttachments)
    .where(eq(campaignAttachments.id, req.params.id));

  if (!row) return res.status(404).json({ error: 'Attachment not found' });

  res.setHeader('Content-Type', row.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.filename)}"`);
  res.send(Buffer.from(row.data, 'base64'));
});

export default router;
