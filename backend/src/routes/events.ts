import { Router } from 'express';

const router = Router();

// GET /api/events - SSE stream for live updates to scheduled/sent tables
// TODO(04): push real events when email status changes (worker -> pub/sub -> here)
router.get('/', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('retry: 3000\n\n');

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    res.end();
  });
});

export default router;
