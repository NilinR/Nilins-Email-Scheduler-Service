import { mysqlTable, varchar, text, int, timestamp, mysqlEnum, index } from 'drizzle-orm/mysql-core';

//one row for each smtp identity (ethereal test account)
export const senders = mysqlTable('senders', {
  id: varchar('id', { length: 36 }).primaryKey(), //uuid
  name: varchar('name', { length: 255 }).notNull(), //display name
  smtpHost: varchar('smtp_host', { length: 255 }).notNull(), //ethereal host
  smtpPort: int('smtp_port').notNull(),
  smtpUser: varchar('smtp_user', { length: 255 }).notNull(), //ethereal user
  smtpPass: varchar('smtp_pass', { length: 255 }).notNull(),
  fromEmail: varchar('from_email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(), //defaults to current timestamp
});

//for each compose new email, holds its shared settings
export const campaigns = mysqlTable('campaigns', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(), //from auth.js session- google sub id
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  senderId: varchar('sender_id', { length: 36 }).notNull().references(() => senders.id),
  startTime: timestamp('start_time').notNull(), //scheduling start
  delayMs: int('delay_ms').notNull(), //delay btw individual emails
  hourlyLimit: int('hourly_limit'), //can overide global default
  totalRecipients: int('total_recipients').notNull(), //quick display purposes
  createdAt: timestamp('created_at').defaultNow(),
});

//for each email to be sent, holds its status and scheduling info
export const emails = mysqlTable('emails', {
  id: varchar('id', { length: 36 }).primaryKey(), //uuid which is used to build BullMQ jobId
  campaignId: varchar('campaign_id', { length: 36 }).notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }), //deleting a campaign cleans up its emails
  senderId: varchar('sender_id', { length: 36 }).notNull().references(() => senders.id), //denormalozed for fast rate limit lookups
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(), //denormalized copy to avoid join for table views
  status: mysqlEnum('status', ['pending', 'processing', 'sent', 'failed']).default('pending').notNull(), //defualt is pending
  scheduledAt: timestamp('scheduled_at').notNull(),
  sentAt: timestamp('sent_at'), //set at sucess
  attempts: int('attempts').default(0).notNull(), //default is 0, incremented by BullMQ metrics
  errorMessage: text('error_message'), //last failure reason
  jobId: varchar('job_id', { length: 255 }).notNull(), //BullMQ jobId, denormalized for fast lookup
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  statusScheduledIdx: index('idx_emails_status_scheduled').on(table.status, table.scheduledAt), //to make the boot time sweep fast
  senderStatusIdx: index('idx_emails_sender_status').on(table.senderId, table.status),
  campaignIdx: index('idx_emails_campaign').on(table.campaignId),
}));
