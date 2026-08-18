export interface Sender {
  id: string;
  email: string;
  name: string;
}

export interface Campaign {
  id: string;
  name: string;
  createdAt: string;
}

export interface Email {
  id: string;
  campaignId: string;
  recipient: string;
  subject: string;
  status: 'scheduled' | 'sent' | 'failed';
  scheduledAt: string;
  sentAt?: string;
}
