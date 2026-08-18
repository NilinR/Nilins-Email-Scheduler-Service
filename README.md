# Nilin's-Email-Scheduler-Service
Production grade email scheduler service and dashboard, following the Outbox specifications. BullMQ+redis, no cron scheduling

## Database setup

The schema is in `backend/src/db/schema.ts` (it uses Drizzle ORM on MySQL). 

Tables: `senders`, `campaigns`, `emails`, with Foreign Key constraints (`campaigns.sender_id → senders.id`, `emails.campaign_id → campaigns.id` `ON DELETE CASCADE`, `emails.sender_id → senders.id`).

1. Copy env config and start MySQL:
   ```bash
   cp backend/.env.example backend/.env
   docker compose up -d
   ```
   publishes on **3307** (not 3306, in case you have a local MySQL server like me). `DATABASE_URL` in `.env.example` points at 3307, you can change it if you remap the port.
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

