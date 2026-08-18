import { EmailListItem, type EmailListItemData } from '@/components/EmailListItem';

interface SentEmailsTableProps {
  items: EmailListItemData[] | null;
  error: string | null;
  onSelect: (item: EmailListItemData) => void;
}

export function SentEmailsTable({ items, error, onSelect }: SentEmailsTableProps) {
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!items) return <p className="text-sm text-gray-400">Loading...</p>;
  if (items.length === 0) return <p className="text-sm text-gray-400">No sent emails yet.</p>;

  return (
    <div className="rounded-xl border border-gray-100">
      {items.map((item) => (
        <EmailListItem key={item.id} item={item} onClick={() => onSelect(item)} />
      ))}
    </div>
  );
}
