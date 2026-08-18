import { EmailListItem, type EmailListItemData } from '@/components/EmailListItem';

const mockScheduled: EmailListItemData[] = [
  {
    id: '1',
    threadId: 'MJWYT44 BM#52W01',
    recipientName: 'John Smith',
    recipientEmail: 'john.smith@example.com',
    timestamp: 'Tue 9:15:12 AM',
    date: 'Nov 3, 10:23 AM',
    subject: 'Meeting follow-up - Scheduled',
    preview: 'Hi John, just wanted to follow up on our meeting...',
    body: [
      'Hi John,',
      'Just wanted to follow up on our meeting and confirm the next steps we discussed.',
      "Let me know if anything needs adjusting before this goes out.",
    ],
    status: 'scheduled',
  },
  {
    id: '2',
    threadId: 'MJWYT44 BM#52W02',
    recipientName: 'Olive',
    recipientEmail: 'olive@example.com',
    timestamp: 'Thu 8:15:12 PM',
    date: 'Nov 4, 8:15 PM',
    subject: "Ramit, great to meet you - you'll love it",
    preview: 'Hi Olive, just wanted to follow up on our meeting...',
    body: [
      'Hi Olive,',
      'Just wanted to follow up on our meeting - great to meet you, and I think you will love it.',
    ],
    status: 'scheduled',
  },
];

export function ScheduledEmailsTable({ onSelect }: { onSelect: (item: EmailListItemData) => void }) {
  return (
    <div className="rounded-xl border border-gray-100">
      {mockScheduled.map((item) => (
        <EmailListItem key={item.id} item={item} onClick={() => onSelect(item)} />
      ))}
    </div>
  );
}
