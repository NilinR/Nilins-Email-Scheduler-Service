import { EmailListItem, type EmailListItemData } from '@/components/EmailListItem';

const mockSent: EmailListItemData[] = [
  {
    id: '1',
    threadId: 'MJWYT44 BM#61A11',
    recipientName: 'Sarah Wilson',
    recipientEmail: 'sarah.wilson@example.com',
    timestamp: '',
    date: 'Nov 1, 4:02 PM',
    subject: 'Re: Project Update',
    preview: 'Thanks for the update, Sarah. Looks good!',
    body: ['Thanks for the update, Sarah.', 'Looks good - let’s move ahead as planned.'],
    status: 'sent',
    attachments: [
      { name: 'Project_Summary.pdf', size: '1.1 MB' },
    ],
  },
  {
    id: '2',
    threadId: 'MJWYT44 BM#61A12',
    recipientName: 'Support',
    recipientEmail: 'support@example.com',
    timestamp: '',
    date: 'Oct 29, 11:47 AM',
    subject: 'Issue with login',
    preview: 'I am having trouble logging in to the dashboard...',
    body: [
      'I am having trouble logging in to the dashboard.',
      'It just spins on the login screen after I click sign in - could you take a look?',
    ],
    status: 'sent',
  },
];

export function SentEmailsTable({ onSelect }: { onSelect: (item: EmailListItemData) => void }) {
  return (
    <div className="rounded-xl border border-gray-100">
      {mockSent.map((item) => (
        <EmailListItem key={item.id} item={item} onClick={() => onSelect(item)} />
      ))}
    </div>
  );
}
