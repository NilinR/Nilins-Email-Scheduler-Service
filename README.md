# Nilin's-Email-Scheduler-Service
Production grade email scheduler service and dashboard, following the Outbox specifications. BullMQ+redis, no cron scheduling

## Setup

> **Note on committed secrets:** This repo intentionally commits real, working environment variables (including OAuth credentials) directly for reviewer convenience — this repo is private and access-restricted to two named reviewers for a short-lived take-home assessment. This is a deliberate trade-off for this context, not an oversight, and would **not** be appropriate practice for a real production repository.

## Database setup

The schema is in `backend/src/db/schema.ts` (it uses Drizzle ORM on MySQL). 

Tables: `senders`, `campaigns`, `emails`, with Foreign Key constraints (`campaigns.sender_id → senders.id`, `emails.campaign_id → campaigns.id` `ON DELETE CASCADE`, `emails.sender_id → senders.id`).

1. Start MySQL (env vars are already committed in `backend/.env`, see note above):
   ```bash
   docker compose up -d
   ```
   publishes on **3307** (not 3306, in case you have a local MySQL server like me). `DATABASE_URL` in `backend/.env` points at 3307, you can change it if you remap the port.
2. From `backend/`, install deps, apply migrations, and to test seed two example Ethereal test senders:
   ```bash
   cd backend
   npm install
   npm run db:migrate
   npm run db:seed
   ```
3. Verify: query the `senders` table and confirm two rows with real `@ethereal.email` addresses came back.
   ```bash
   docker exec -it <mysql-container-name> mysql -uroot -proot email_scheduler \
     -e "SELECT id, name, from_email FROM senders;"
   ```
   (find `<mysql-container-name>` with `docker compose ps`)

To change the schema: edit `backend/src/db/schema.ts`, then run `npx drizzle-kit generate` from `backend/` to produce a new migration file — never hand-edit an existing one under `backend/drizzle/`.

