import type { emails } from '../db/schema.js';

type EmailRow = typeof emails.$inferSelect;

// TODO(05-...-mailer): replace with real Ethereal/nodemailer sending logic
export async function sendEmail(row: EmailRow): Promise<void> {
  console.log(`[mailer stub] would send email ${row.id} to ${row.recipientEmail}`);
}
