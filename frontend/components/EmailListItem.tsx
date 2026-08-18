import { Clock, Star } from 'lucide-react';

export interface EmailAttachment {
  name: string;
  size: string;
}

export interface EmailListItemData {
  id: string;
  threadId: string;
  recipientName: string;
  recipientEmail: string;
  timestamp: string;
  date: string;
  subject: string;
  preview: string;
  body: string[];
  status: 'scheduled' | 'sent';
  attachments?: EmailAttachment[];
}

export function EmailListItem({ item, onClick }: { item: EmailListItemData; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-3 text-left text-sm transition last:border-b-0 hover:bg-gray-50"
    >
      <span className="w-36 shrink-0 truncate text-gray-900">To: {item.recipientName}</span>

      {item.status === 'scheduled' ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
          <Clock size={12} />
          {item.timestamp}
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Sent</span>
      )}

      <span className="min-w-0 flex-1 truncate text-gray-700">
        <span className="font-medium text-gray-900">{item.subject}</span>
        <span className="text-gray-400"> - {item.preview}</span>
      </span>

      <Star size={16} className="shrink-0 text-gray-300" />
    </button>
  );
}
