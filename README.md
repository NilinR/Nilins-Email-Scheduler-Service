# Email Scheduler

A production style email scheduling service.

 That schedules bulk emails via API, have them sent reliably at the right time through a persistent job queue, and track their status live from a web dashboard.

---

## Tech stack

**Backend:** TypeScript, Express.js, MySQL, Drizzle ORM, BullMQ + Redis, Ethereal Email (nodemailer)
**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Auth.js (Google OAuth)
**Infra:** Docker Compose (MySQL + Redis, local only)


---

## Setup

### Prerequisites

- Node.js 18+
- Docker

### Backend

```bash
docker compose up -d       # starts MySQL + Redis
cd backend
npm install
npm run db:migrate         # applies schema
npm run db:seed            # generates fresh Ethereal test accounts as senders
npm run dev                # runs API + worker together
```

npm run dev in the backend runs both the server and worker that were created for concurrency. If there is any need to test both independently run:

```bash
npm run dev:server   # terminal 1 — Express API only
npm run dev:worker   # terminal 2 — BullMQ worker only
```

Used if you want to kill just the worker and watch jobs survive the restart, or run the worker at a different concurrency without touching the API.

API runs on `http://localhost:4000`. A Bull Board queue dashboard is available at `http://localhost:4000/admin/queues` for watching delayed jobs sit and fire in real time.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### Ethereal Email

Ethereal test accounts are generated automatically by `npm run db:seed`. There is no manual signup needed. These accounts are ephemeral.

### Environment variables

Create your local environment file from the checked-in template:

```bash
cd backend
cp .env.example .env
```


For reference, here's what each variable controls:

```bash
# Server
PORT=4000
NODE_ENV=development

# MySQL (docker-compose publishes MySQL on host port 3307, not 3306)
DATABASE_URL=mysql://scheduler:scheduler@localhost:3307/email_scheduler

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate limiting
MAX_EMAILS_PER_HOUR=200                  # global/default fallback
MAX_EMAILS_PER_HOUR_PER_SENDER=          # per-sender override, takes priority if set

# Minimum delay enforced between individual sends (ms), at the queue level
MIN_SEND_DELAY_MS=2000

# Worker
WORKER_CONCURRENCY=5

# Boot-time reconciliation sweep — how long a row can sit stuck before being re-enqueued
STUCK_PROCESSING_THRESHOLD_MS=300000

# Retry/backoff for failed sends
EMAIL_MAX_ATTEMPTS=3
EMAIL_BACKOFF_DELAY_MS=10000

# Auth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_secure_random_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FRONTEND_URL=http://localhost:3000
```

---
## Video Walkthrough
https://drive.google.com/file/d/1Z4Yon2iqWytcVo8qQS9yU1VxEAK7NXNr/view?usp=sharing
---
## Architecture overview

### How scheduling works

I have called each compose mail process a campaign. When scheduling a campaign, there is a row created per recipient in the `emails` table and enqueues one **BullMQ delayed job per recipient**, each with a `jobId` from the row's ID. There is no cron in this codebase (no OS crontab, no `node-cron`, no polling loop). Each email's fire time is computed once at schedule-time (`startTime + index × delay`, clamped to at least `MIN_SEND_DELAY_MS` so displayed times always match real throughput) and handed to Redis as an individual delayed job; Redis wakes the job up at the right moment on its own.

The worker can run as a separate process from the API server.This works how it would scale in a real deployment (more API replicas vs. more worker replicas, scaled independently for different bottlenecks).

### How restart persistence is handled

Two layers work together:

1. **BullMQ jobs live in Redis, not in the Node process.** If the API or worker restarts, nothing about already scheduled jobs are lost. They are in Redis.On boot, the worker simply reconnects,the schedule is not rebuilt again from the database.

2. **Idempotency is enforced at two points**, so even a hard crash mid-send can't cause a duplicate:
   - Every job uses a **deterministic `jobId`** tied to its email row. BullMQ refuses to create a second job with an ID that already exists, so re-enqueuing the same email is a safe.
   - Marking as sent step is done with a **conditional database update** (`UPDATE emails SET status='sent' WHERE id=? AND status != 'sent'`). If a prior attempt already marked it sent, this affects zero rows.This is another deduplication guarantee.

3. **A boot-time reconciliation sweep** if there is a hard crash between marking a row `processing` and finishing the send, or any case where a job is lost from Redis entirely while its DB row is never updated. The sweep catches both stuck-`processing` rows past a threshold *and* `pending` rows whose scheduled time has long passed with no live job behind them, and re-enqueues them with the same `jobId`.

This last case was a bug found during testing, an earlier version of the rate-limit retry path readded a job with the same `jobId` while the original job was still active,causing the job to vanish entirely. BullMQ's `job.moveToDelayed()` is used in the fix to reschedule the *existing* job in place instead of creating a colliding one. 

### How rate limiting & concurrency work

Four mechanisms work together to satisfy that it behave like a real-world email system under load:

- **Worker concurrency** (`WORKER_CONCURRENCY`) — how many jobs one worker processes in parallel. Verified for no duplicate sends and no skipped rows at any concurrency level. Concurrency only affects throughput not correctness, since the rate limiter and conditional DB update are the actual safety net regardless of how many jobs run in parallel.

- **Minimum delay between sends** (`MIN_SEND_DELAY_MS`, default 2000ms) — enforced via BullMQ's queue-level `limiter` option (`{ max: 1, duration: MIN_SEND_DELAY_MS }`), not an in-worker `sleep()`. The `limiter` enforces pacing across the whole queue regardless of concurrency.

- **Two-tier hourly rate limiting**
The hourly rate is checked at 2 levels.
  - A **sender-wide bucket** 
  This is the global env set one.
  It is checked and incremented for every send, capped at `MAX_EMAILS_PER_HOUR_PER_SENDER` (falling back to `MAX_EMAILS_PER_HOUR` if unset). This ensures a sender's total hourly volume is genuinely capped, no matter how many campaigns its traffic is split across.(if campaign is higher, sender limit is followed).
  - A **campaign-scoped bucket**  only applied when a campaign sets its own `hourlyLimit` in the compose email page, capping just that campaign's share of the sender's traffic. This exists so one low-limit campaign isn't blocked by unrelated volume from other campaigns sharing the same sender.
  

  **Trade-off:** this uses a **fixed window** counter (`INCR` + `EXPIRE` per hour bucket), not a sliding window. Only one Redis round trip is needed per check.But if the sender could sends a mail close to the time limit, they may briefly exceed the rate in the few minutes around each hour boundary.
  
   A sliding-window implementation (Redis sorted set, trimmed by timestamp) would close this gap at the cost of more Redis calls and code per check. Which would be not time efficient.


- **Rate-limited jobs are rescheduled, never dropped.** When a send fails either rate check, the worker calls `job.moveToDelayed()` to push the *same* job into the next open hour window, rather than creating a new job or failing it outright.The dashboard reflects this with a live "Retrying at HH:MM" label ( from `next_attempt_at` field in the worker updates), rather than an "pending" that could look stuck.

**Behavior under load (1000+ emails scheduled at once):** every recipient gets their own DB row and BullMQ job immediately at schedule-time, so nothing is lost or dropped even for very large recipient lists. The `limiter` paces actual sends once jobs start firing. The two-tier hourly counter pushes anything over quota into later windows using the exact same code path a single rate-limited email uses.

 Every email is already treated as an independent job from the moment it's scheduled. This means the system's behavior under 1000+ simultaneous schedules is not a special case to reason about separately: it's the same guarantees already tested at smaller scale, applied uniformly.

**Failed sends** retry automatically with exponential backoff (`EMAIL_MAX_ATTEMPTS`, `EMAIL_BACKOFF_DELAY_MS`) before being marked `failed` with the error message preserved. The DB status is only set to `failed` on the final exhausted attempt (earlier retries leave the row, so the dashboard doesn't show a misleading "failed" for something BullMQ is about to retry automatically). 

**Idempotency at the API layer:** in addition to the job-level idempotency described above, `POST /api/campaigns` supports an `Idempotency-Key` header, enforced server-side via a Redis-backed cache. A retry with the same key replays the original cached response instead of creating a second campaign. A duplicate request (same key, still in-flight) receives a `409` via a Redis lock (`SET NX`), preventing a create race instead of only handling sequential retries. 

---

## Features implemented

### Backend

- [x] API accepts scheduling requests, stores them in MySQL
- [x] Scheduling via BullMQ delayed jobs (no cron)
- [x] Sends via Ethereal SMTP, supports multiple senders
- [x] Survives restart — future emails still send correctly, no duplicates
- [x] Configurable worker concurrency, verified correct at multiple levels
- [x] Minimum delay between sends, enforced at the queue level
- [x] Two-tier hourly rate limit (sender-wide + optional per-campaign), Redis-backed, atomic, safe across multiple workers
- [x] Rate-limited jobs rescheduled via `moveToDelayed`, never dropped
- [x] Boot-time reconciliation sweep for orphaned/stuck rows (covers both crash-mid-send and lost-job cases)
- [x] Retry with exponential backoff on send failure
- [x] Idempotent by construction (deterministic jobId + conditional DB update)
- [x] `Idempotency-Key` header enforced server-side (cache + lock), not just accepted and ignored
- [x] Server-Sent Events for live status updates via BullMQ's `QueueEvents`, decoupled from the worker process
- [x] Recipient validation filters invalid emails and reports them back (`skippedRecipients`) rather than rejecting the whole batch — only rejects outright if zero valid recipients remain

### Frontend

- [x] Google OAuth login (Auth.js, real, not mocked)
- [x] Redirects to dashboard after login
- [x] Header shows name, email, avatar, with logout
- [x] Dashboard: header, Scheduled/Sent tabs, Compose New Email button
- [x] Compose: subject, body, sender selection
- [x] Compose: CSV/text upload with client-side parsing showing valid/invalid/duplicate counts
- [x] Compose: start time, delay between emails, hourly limit
- [x] Server-side re-validation of recipients (never trusts client input alone)
- [x] Scheduled Emails list: email, subject, scheduled time, status — with loading and empty states
- [x] Sent Emails list: email, subject, sent time, status (sent/failed) — with loading and empty states
- [x] Live updates via SSE, no polling
- [x] Reusable UI components (list items, modal, buttons, toasts)
- [x] TypeScript types for API responses and props
- [x] Error handling with user-facing toast messages, including network failures
- [x] "Retrying at HH:MM" status label for rate-limited rows, instead of a plain "pending" that could look stuck

### Additional features (Figma design elements)

- [x] Live search across both lists (subject, recipient, preview text)
- [x] Star/favorite emails, with a dedicated Favorites view
- [x] Bull Board mounted at `/admin/queues` for visually inspecting the live job queue

---

## Assumptions, shortcuts & trade-offs

- **Rate limiting uses a fixed window**, not a sliding window
- **Rate limiting is two-tier: sender-wide (the real cap) plus an optional per-campaign sub-limit** — not purely global, not purely per-campaign. 
- **`emails.scheduled_at` reflects the originally requested time and is not mutated** when a job is rescheduled due to rate limiting. A separate `next_attempt_at` field and status label show the live retry time instead, so both "what was requested" and "what's actually happening" stay visible rather than one overwriting the other.
- **The requested per-campaign `delayMs` is clamped to `MIN_SEND_DELAY_MS`** if the requested value is lower, so displayed scheduled times always reflect what the queue-level limiter will actually allow.
- **`emails.subject` is denormalized** from `campaigns` to avoid a join on frequently-read list views; `body` is not denormalized since it's only needed once, at send time.
- **Frontend and backend maintain independent type definitions** rather than a shared types package — consistent with the two-folder, no-shared-tooling repo layout chosen for simplicity.
- **Ethereal accounts are ephemeral** and regenerated via a seed script rather than relied upon long-term
- **MySQL** chosen beacuse is well documented and I have existing familiarity with it (reducing debugging time).



## Testing notes

These tests:
Restart persistence, no duplicate sends, rate limiting correctness under concurrent workers, a campaign requesting more than its sender's cap is still getting caped at the sender's limit, rate-limited jobs surviving not silently vanishing, retry/backoff exhaustion, idempotency under genuine concurrency, SSE reconnect after a server restart and live sync across multiple open tabs, killing the worker mid-send and confirming the reconciliation sweep

were verified by running the scenario against live MySQL/Redis.
