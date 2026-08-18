'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmailToolbar } from '@/components/EmailToolbar';
import { ScheduledEmailsTable } from '@/components/ScheduledEmailsTable';
import { SentEmailsTable } from '@/components/SentEmailsTable';
import { ComposeModal } from '@/components/ComposeModal';
import { EmailDetail } from '@/components/EmailDetail';
import type { EmailListItemData } from '@/components/EmailListItem';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailListItemData | null>(null);

  return (
    <div className="flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedEmail(null);
        }}
        onCompose={() => setComposeOpen(true)}
        scheduledCount={12}
        sentCount={785}
      />
      <main className="flex-1 p-6">
        {selectedEmail ? (
          <EmailDetail item={selectedEmail} onBack={() => setSelectedEmail(null)} />
        ) : (
          <>
            <EmailToolbar />
            {activeTab === 'scheduled' ? (
              <ScheduledEmailsTable onSelect={setSelectedEmail} />
            ) : (
              <SentEmailsTable onSelect={setSelectedEmail} />
            )}
          </>
        )}
      </main>
      <ComposeModal open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}
