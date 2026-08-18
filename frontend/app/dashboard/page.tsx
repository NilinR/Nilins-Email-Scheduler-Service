'use client';
import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmailToolbar } from '@/components/EmailToolbar';
import { ScheduledEmailsTable } from '@/components/ScheduledEmailsTable';
import { SentEmailsTable } from '@/components/SentEmailsTable';
import { ComposeView } from '@/components/ComposeView';
import { EmailDetail } from '@/components/EmailDetail';
import { Toast } from '@/components/Toast';
import type { EmailListItemData } from '@/components/EmailListItem';
import { apiClient } from '@/lib/apiClient';
import { mapEmailRowToListItem } from '@/lib/mapEmailRow';
import type { EmailRow } from '@/lib/types';

type View = { kind: 'list' } | { kind: 'compose' } | { kind: 'detail'; email: EmailListItemData };

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [view, setView] = useState<View>({ kind: 'list' });
  const [scheduled, setScheduled] = useState<EmailListItemData[] | null>(null);
  const [sent, setSent] = useState<EmailListItemData[] | null>(null);
  const [scheduledError, setScheduledError] = useState<string | null>(null);
  const [sentError, setSentError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refetch = useCallback(() => {
    apiClient
      .get<EmailRow[]>('/api/emails/scheduled')
      .then((rows) => setScheduled(rows.map(mapEmailRowToListItem)))
      .catch(() => setScheduledError('Could not load scheduled emails. Is the backend running?'));

    apiClient
      .get<EmailRow[]>('/api/emails/sent')
      .then((rows) => setSent(rows.map(mapEmailRowToListItem)))
      .catch(() => setSentError('Could not load sent emails. Is the backend running?'));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setView({ kind: 'list' });
        }}
        onCompose={() => setView({ kind: 'compose' })}
        scheduledCount={scheduled?.length ?? null}
        sentCount={sent?.length ?? null}
      />
      <main className="flex-1 p-6">
        {view.kind === 'compose' && (
          <ComposeView
            onBack={(message) => {
              setView({ kind: 'list' });
              if (message) setNotice(message);
              refetch();
            }}
          />
        )}
        {view.kind === 'detail' && (
          <EmailDetail item={view.email} onBack={() => setView({ kind: 'list' })} />
        )}
        {view.kind === 'list' && (
          <>
            <EmailToolbar />
            {activeTab === 'scheduled' ? (
              <ScheduledEmailsTable
                items={scheduled}
                error={scheduledError}
                onSelect={(email) => setView({ kind: 'detail', email })}
              />
            ) : (
              <SentEmailsTable
                items={sent}
                error={sentError}
                onSelect={(email) => setView({ kind: 'detail', email })}
              />
            )}
          </>
        )}
      </main>
      {notice && <Toast message={notice} onDismiss={() => setNotice(null)} />}
    </div>
  );
}
