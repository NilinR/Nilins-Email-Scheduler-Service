import type { EmailListItemData } from '@/components/EmailListItem';
import type { EmailRow } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function mapEmailRowToListItem(row: EmailRow): EmailListItemData {
  const isSent = row.status === 'sent';
  const timestampSource = isSent ? row.sentAt : row.scheduledAt;
  const date = timestampSource ? new Date(timestampSource) : null;

  const isRateLimited =
    row.status === 'pending' && row.nextAttemptAt !== null && new Date(row.nextAttemptAt) > new Date();
  const retryTime = isRateLimited
    ? new Date(row.nextAttemptAt as string).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null;

  return {
    id: row.id,
    threadId: row.id.slice(0, 8).toUpperCase(),
    recipientName: row.recipientEmail,
    recipientEmail: row.recipientEmail,
    timestamp: date ? date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '',
    date: date ? date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '',
    subject: row.subject,
    preview: row.status === 'failed' ? `Failed: ${row.errorMessage ?? 'unknown error'}` : row.status,
    retryLabel: isRateLimited ? `Retrying at ${retryTime}` : null,
    bodyHtml: row.body,
    attachments: row.attachments.map((a) => ({
      name: a.filename,
      size: formatBytes(a.size),
      url: `${API_URL}/api/attachments/${a.id}`,
      mimeType: a.mimeType,
    })),
    status: isSent ? 'sent' : 'scheduled',
    starred: row.starred,
  };
}
