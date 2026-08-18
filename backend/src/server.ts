import express from 'express';
import cors from 'cors';
import campaignsRouter from './routes/campaigns.js';
import emailsRouter from './routes/emails.js';
import sendersRouter from './routes/senders.js';
import eventsRouter from './routes/events.js';
import { config } from './config.js';

const app = express();
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.use('/api/campaigns', campaignsRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/senders', sendersRouter);
app.use('/api/events', eventsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => console.log(`API listening on ${config.port}`));
