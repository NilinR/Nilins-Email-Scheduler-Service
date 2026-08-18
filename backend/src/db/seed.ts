import 'dotenv/config';
import { randomUUID } from 'node:crypto'; //generate unique ids
import nodemailer from 'nodemailer'; //for creating ethereal test accounts
import { db, pool } from './client.js';
import { senders } from './schema.js';

//seed the senders table with ethereal test accounts
const SEED_SENDER_NAMES = ['example1', 'example2'];

async function createEtherealSender(name: string) {
  const account = await nodemailer.createTestAccount();
  return {
    id: randomUUID(),
    name,
    smtpHost: account.smtp.host,
    smtpPort: account.smtp.port,
    smtpUser: account.user,
    smtpPass: account.pass,
    fromEmail: account.user,
  };
}

//main function to seed the senders table with ethereal test accounts
async function main() {
  console.log(`Provisioning ${SEED_SENDER_NAMES.length} Ethereal test account(s)...`);
  const rows = await Promise.all(SEED_SENDER_NAMES.map(createEtherealSender));

  await db.insert(senders).values(rows);

  for (const row of rows) {
    console.log(`  ${row.name}: ${row.smtpUser} (id=${row.id})`);
  }
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
