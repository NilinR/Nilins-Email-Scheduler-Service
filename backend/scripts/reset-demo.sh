#!/usr/bin/env bash
# Wipes campaign/email data and rate-limit state for a clean demo, while keeping
# the seeded Ethereal senders intact (no need to re-provision test accounts).
set -euo pipefail

MYSQL_CONTAINER="${MYSQL_CONTAINER:-nilins-email-scheduler-service-mysql-1}"
REDIS_CONTAINER="${REDIS_CONTAINER:-nilins-email-scheduler-service-redis-1}"
DB_USER="${DB_USER:-scheduler}"
DB_PASS="${DB_PASS:-scheduler}"
DB_NAME="${DB_NAME:-email_scheduler}"

echo "Clearing emails, campaigns, and attachments..."
docker exec "$MYSQL_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
  SET FOREIGN_KEY_CHECKS = 0;
  TRUNCATE TABLE emails;
  TRUNCATE TABLE campaign_attachments;
  TRUNCATE TABLE campaigns;
  SET FOREIGN_KEY_CHECKS = 1;
"

echo "Clearing BullMQ queue (delayed/waiting/active/completed/failed jobs, events)..."
docker exec "$REDIS_CONTAINER" redis-cli --scan --pattern "bull:emails:*" | \
  xargs -r -I{} docker exec "$REDIS_CONTAINER" redis-cli del {} >/dev/null

echo "Clearing rate-limit counters..."
docker exec "$REDIS_CONTAINER" redis-cli --scan --pattern "rate:*" | \
  xargs -r -I{} docker exec "$REDIS_CONTAINER" redis-cli del {} >/dev/null

echo "Clearing idempotency cache..."
docker exec "$REDIS_CONTAINER" redis-cli --scan --pattern "idempotency:*" | \
  xargs -r -I{} docker exec "$REDIS_CONTAINER" redis-cli del {} >/dev/null

echo "Done. Senders are untouched - restart the backend (npm run dev) so the worker's in-memory BullMQ queue instance re-syncs cleanly."
