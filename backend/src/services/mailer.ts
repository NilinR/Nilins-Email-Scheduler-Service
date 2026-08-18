import nodemailer, { type Transporter } from 'nodemailer';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { senders, campaigns, campaignAttachments } from '../db/schema.js';
import type { emails } from '../db/schema.js';

type EmailRow = typeof emails.$inferSelect;

//cached per sender so we dont rebuild the SMTP connection on every send
const transporterCache = new Map<string, { transporter: Transporter; fromEmail: string }>();

async function getTransporter(senderId: string): Promise<{ transporter: Transporter; fromEmail: string }> {
  const cached = transporterCache.get(senderId);
  if (cached) return cached;

  const [sender] = await db.select().from(senders).where(eq(senders.id, senderId));
  if (!sender) throw new Error(`Unknown sender: ${senderId}`);

  const transporter = nodemailer.createTransport({
    host: sender.smtpHost,
    port: sender.smtpPort,
    auth: { user: sender.smtpUser, pass: sender.smtpPass },
  });

  const entry = { transporter, fromEmail: sender.fromEmail };
  transporterCache.set(senderId, entry);
  return entry;
}

export async function sendEmail(row: EmailRow): Promise<void> {
  const { transporter, fromEmail } = await getTransporter(row.senderId);

  const [campaign] = await db.select({ body: campaigns.body }).from(campaigns).where(eq(campaigns.id, row.campaignId));
  if (!campaign) throw new Error(`Unknown campaign: ${row.campaignId}`);

  const attachmentRows = await db
    .select({ filename: campaignAttachments.filename, mimeType: campaignAttachments.mimeType, data: campaignAttachments.data })
    .from(campaignAttachments)
    .where(eq(campaignAttachments.campaignId, row.campaignId));

  const info = await transporter.sendMail({
    from: fromEmail,
    to: row.recipientEmail,
    subject: row.subject,
    html: campaign.body, // composed via the rich text editor, stored as HTML
    attachments: attachmentRows.map((a) => ({
      filename: a.filename,
      content: a.data,
      encoding: 'base64',
      contentType: a.mimeType,
    })),
  });

  console.log(`[mailer] sent ${row.id} to ${row.recipientEmail} — preview: ${nodemailer.getTestMessageUrl(info)}`);
}
