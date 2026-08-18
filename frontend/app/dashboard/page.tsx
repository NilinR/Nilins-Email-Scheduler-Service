'use client';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmailToolbar } from '@/components/EmailToolbar';
import { ScheduledEmailsTable } from '@/components/ScheduledEmailsTable';
import { SentEmailsTable } from '@/components/SentEmailsTable';
import { ComposeView } from '@/components/ComposeView';
import { EmailDetail } from '@/components/EmailDetail';
import type { EmailListItemData } from '@/components/EmailListItem';

type View = { kind: 'list' } | { kind: 'compose' } | { kind: 'detail'; email: EmailListItemData };

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [view, setView] = useState<View>({ kind: 'list' });

  return (
    <div className="flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setView({ kind: 'list' });
        }}
        onCompose={() => setView({ kind: 'compose' })}
        scheduledCount={12}
        sentCount={785}
      />
      <main className="flex-1 p-6">
        {view.kind === 'compose' && <ComposeView onBack={() => setView({ kind: 'list' })} />}
        {view.kind === 'detail' && (
          <EmailDetail item={view.email} onBack={() => setView({ kind: 'list' })} />
        )}
        {view.kind === 'list' && (
          <>
            <EmailToolbar />
            {activeTab === 'scheduled' ? (
              <ScheduledEmailsTable onSelect={(email) => setView({ kind: 'detail', email })} />
            ) : (
              <SentEmailsTable onSelect={(email) => setView({ kind: 'detail', email })} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
