import type { EmailListItemData } from '@/components/EmailListItem';
import type { EmailRow } from '@/lib/types';

export function mapEmailRowToListItem(row: EmailRow): EmailListItemData {
  const isSent = row.status === 'sent';
  const timestampSource = isSent ? row.sentAt : row.scheduledAt;
  const date = timestampSource ? new Date(timestampSource) : null;

  return {
    id: row.id,
    threadId: row.id.slice(0, 8).toUpperCase(),
    recipientName: row.recipientEmail,
    recipientEmail: row.recipientEmail,
    timestamp: date ? date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '',
    date: date ? date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '',
    subject: row.subject,
    preview: row.status === 'failed' ? `Failed: ${row.errorMessage ?? 'unknown error'}` : row.status,
    body: ['Full message content is not available from the list view yet.'],
    status: isSent ? 'sent' : 'scheduled',
  };
}
