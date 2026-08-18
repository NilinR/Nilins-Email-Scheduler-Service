export interface Sender {
  id: string;
  name: string;
  fromEmail: string;
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
}

export interface CreateCampaignResponse {
  campaignId: string;
  count: number;
  skippedRecipients: string[];
}

export type EmailStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface EmailRow {
  id: string;
  campaignId: string;
  senderId: string;
  recipientEmail: string;
  subject: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt: string | null;
  attempts: number;
  errorMessage: string | null;
  jobId: string;
  createdAt: string;
  updatedAt: string;
}
