'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmailToolbar } from '@/components/EmailToolbar';
import { ScheduledEmailsTable } from '@/components/ScheduledEmailsTable';
import { SentEmailsTable } from '@/components/SentEmailsTable';
import { ComposeView } from '@/components/ComposeView';
import { EmailDetail } from '@/components/EmailDetail';
import { Toast } from '@/components/Toast';
import { EmailListItem, type EmailListItemData } from '@/components/EmailListItem';
import { Star } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { mapEmailRowToListItem } from '@/lib/mapEmailRow';
import { useEmailEvents } from '@/lib/useEmailEvents';
import type { EmailRow } from '@/lib/types';

type View =
  | { kind: 'list' }
  | { kind: 'compose' }
  | { kind: 'detail'; email: EmailListItemData; from: 'list' | 'favorites' }
  | { kind: 'favorites' };

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [view, setView] = useState<View>({ kind: 'list' });
  const [scheduled, setScheduled] = useState<EmailListItemData[] | null>(null);
  const [sent, setSent] = useState<EmailListItemData[] | null>(null);
  const [scheduledError, setScheduledError] = useState<string | null>(null);
  const [sentError, setSentError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [attachmentsOnly, setAttachmentsOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refetch = useCallback(() => {
    setRefreshing(true);
    Promise.allSettled([
      apiClient
        .get<EmailRow[]>('/api/emails/scheduled')
        .then((rows) => {
          setScheduled(rows.map(mapEmailRowToListItem));
          setScheduledError(null);
        })
        .catch(() => setScheduledError('Could not load scheduled emails. Is the backend running?')),
      apiClient
        .get<EmailRow[]>('/api/emails/sent')
        .then((rows) => {
          setSent(rows.map(mapEmailRowToListItem));
          setSentError(null);
        })
        .catch(() => setSentError('Could not load sent emails. Is the backend running?')),
    ]).finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filterItems = useCallback(
    (items: EmailListItemData[] | null) => {
      if (!items) return items;
      const query = search.trim().toLowerCase();
      return items.filter((item) => {
        if (attachmentsOnly && !(item.attachments && item.attachments.length > 0)) return false;
        if (!query) return true;
        return (
          item.subject.toLowerCase().includes(query) ||
          item.recipientEmail.toLowerCase().includes(query) ||
          item.recipientName.toLowerCase().includes(query) ||
          item.preview.toLowerCase().includes(query)
        );
      });
    },
    [search, attachmentsOnly],
  );

  const filteredScheduled = useMemo(() => filterItems(scheduled), [filterItems, scheduled]);
  const filteredSent = useMemo(() => filterItems(sent), [filterItems, sent]);

  const favorites = useMemo(
    () => [...(scheduled ?? []), ...(sent ?? [])].filter((e) => e.starred),
    [scheduled, sent],
  );

  // if the last favorite gets unstarred while its tab is open, drop back to the list
  useEffect(() => {
    if (view.kind === 'favorites' && favorites.length === 0) setView({ kind: 'list' });
  }, [view.kind, favorites.length]);

  // an email moving to sent/failed changes both the scheduled and sent lists - refetch is
  // the simplest correct approach given SSE only carries an ID and status, not the full row
  useEmailEvents(useCallback(() => refetch(), [refetch]));

  const patchLocalStar = useCallback((id: string, starred: boolean) => {
    setScheduled((prev) => prev?.map((e) => (e.id === id ? { ...e, starred } : e)) ?? prev);
    setSent((prev) => prev?.map((e) => (e.id === id ? { ...e, starred } : e)) ?? prev);
    setView((v) => (v.kind === 'detail' && v.email.id === id ? { ...v, email: { ...v.email, starred } } : v));
  }, []);

  const handleToggleStar = useCallback(
    (item: EmailListItemData) => {
      const starred = !item.starred;
      patchLocalStar(item.id, starred);
      apiClient.patch(`/api/emails/${item.id}/star`, { starred }).catch(() => {
        patchLocalStar(item.id, item.starred); // revert on failure
        setNotice('Could not update star. Please try again.');
      });
    },
    [patchLocalStar],
  );

  const handleArchive = useCallback(
    (item: EmailListItemData) => {
      setView({ kind: 'list' });
      apiClient
        .patch(`/api/emails/${item.id}/archive`, { archived: true })
        .then(() => {
          setNotice('Email archived.');
          refetch();
        })
        .catch(() => setNotice('Could not archive email. Please try again.'));
    },
    [refetch],
  );

  const handleDelete = useCallback(
    (item: EmailListItemData) => {
      setView({ kind: 'list' });
      apiClient
        .delete(`/api/emails/${item.id}`)
        .then(() => {
          setNotice('Email deleted.');
          refetch();
        })
        .catch(() => setNotice('Could not delete email. Please try again.'));
    },
    [refetch],
  );

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
          <EmailDetail
            item={view.email}
            onBack={() => setView(view.from === 'favorites' ? { kind: 'favorites' } : { kind: 'list' })}
            onToggleStar={() => handleToggleStar(view.email)}
            onArchive={() => handleArchive(view.email)}
            onDelete={() => handleDelete(view.email)}
          />
        )}
        {view.kind === 'list' && (
          <>
            <EmailToolbar
              search={search}
              onSearchChange={setSearch}
              attachmentsOnly={attachmentsOnly}
              onToggleAttachmentsOnly={() => setAttachmentsOnly((v) => !v)}
              onRefresh={refetch}
              refreshing={refreshing}
            />
            {activeTab === 'scheduled' ? (
              <ScheduledEmailsTable
                items={filteredScheduled}
                error={scheduledError}
                onSelect={(email) => setView({ kind: 'detail', email, from: 'list' })}
                onToggleStar={handleToggleStar}
              />
            ) : (
              <SentEmailsTable
                items={filteredSent}
                error={sentError}
                onSelect={(email) => setView({ kind: 'detail', email, from: 'list' })}
                onToggleStar={handleToggleStar}
              />
            )}
          </>
        )}
        {view.kind === 'favorites' && (
          <>
            <h2 className="mb-4 text-sm font-medium text-gray-900">Favorites</h2>
            <div className="rounded-xl border border-gray-100">
              {favorites.map((item) => (
                <EmailListItem
                  key={item.id}
                  item={item}
                  onClick={() => setView({ kind: 'detail', email: item, from: 'favorites' })}
                  onToggleStar={() => handleToggleStar(item)}
                />
              ))}
            </div>
          </>
        )}
      </main>
      {favorites.length > 0 && view.kind !== 'favorites' && (
        <button
          type="button"
          onClick={() => setView({ kind: 'favorites' })}
          aria-label={`Favorites (${favorites.length})`}
          className="fixed right-0 top-6 flex items-center gap-1.5 rounded-l-lg bg-yellow-400 py-2 pl-3 pr-2 text-xs font-medium text-white shadow-md transition hover:bg-yellow-500"
        >
          <Star size={14} className="fill-white" />
          {favorites.length}
        </button>
      )}
      {notice && <Toast message={notice} onDismiss={() => setNotice(null)} />}
    </div>
  );
}
