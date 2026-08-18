export interface Sender {
  id: string;
  name: string;
  fromEmail: string;
}

export interface CampaignAttachmentPayload {
  filename: string;
  mimeType: string;
  data: string; // base64-encoded file content
}

export interface CreateCampaignPayload {
  userId: string;
  subject: string;
  body: string;
  senderId: string;
  startTime: string; // ISO
  delayMs: number;
  hourlyLimit?: number;
  recipients: string[];
  attachments?: CampaignAttachmentPayload[];
}

export interface CreateCampaignResponse {
  campaignId: string;
  count: number;
  skippedRecipients: string[];
}

export type EmailStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface EmailAttachmentMeta {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface EmailRow {
  id: string;
  campaignId: string;
  senderId: string;
  recipientEmail: string;
  subject: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt: string | null;
  nextAttemptAt: string | null;
  attempts: number;
  errorMessage: string | null;
  jobId: string;
  createdAt: string;
  updatedAt: string;
  body: string; // HTML content composed via the rich text editor
  attachments: EmailAttachmentMeta[];
  starred: boolean;
  archived: boolean;
}
