'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuid } from 'uuid';
import { ArrowLeft, Paperclip, Clock, ChevronDown } from 'lucide-react';
import { RecipientsInput } from '@/components/compose/RecipientsInput';
import { RichTextToolbar } from '@/components/compose/RichTextToolbar';
import { SendLaterPopover, type ScheduledTime } from '@/components/compose/SendLaterPopover';
import { AttachmentsStrip, type ComposeAttachment } from '@/components/compose/AttachmentsStrip';
import { apiClient } from '@/lib/apiClient';
import type { CampaignAttachmentPayload, CreateCampaignPayload, CreateCampaignResponse, Sender } from '@/lib/types';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ComposeView({ onBack }: { onBack: (notice?: string) => void }) {
  const { data: session } = useSession();
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState('');
  const [hourlyLimit, setHourlyLimit] = useState('');
  const [attachments, setAttachments] = useState<ComposeAttachment[]>([]);
  const [sendLaterOpen, setSendLaterOpen] = useState(false);
  const [scheduled, setScheduled] = useState<ScheduledTime | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [senderId, setSenderId] = useState('');
  const [sendersError, setSendersError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const idempotencyKey = useState(() => uuid())[0];

  useEffect(() => {
    apiClient
      .get<Sender[]>('/api/senders')
      .then((rows) => {
        setSenders(rows);
        if (rows[0]) setSenderId(rows[0].id);
      })
      .catch(() => setSendersError('Could not load senders. Is the backend running?'));
  }, []);

  function handleAttachFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next = files.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setAttachments((prev) => [...prev, ...next]);
    e.target.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    if (!session?.user?.id) {
      setSubmitError('You must be signed in to send.');
      return;
    }
    if (!senderId) {
      setSubmitError('Select a sender to send from.');
      return;
    }
    if (!subject.trim()) {
      setSubmitError('Subject is required.');
      return;
    }
    const bodyHtml = editorRef.current?.innerHTML ?? '';
    const bodyText = editorRef.current?.textContent?.trim() ?? '';
    if (!bodyText) {
      setSubmitError('Body is required.');
      return;
    }
    if (recipients.length === 0) {
      setSubmitError('Add at least one recipient.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const encodedAttachments: CampaignAttachmentPayload[] = await Promise.all(
        attachments.map(async (a) => ({
          filename: a.file.name,
          mimeType: a.file.type || 'application/octet-stream',
          data: await fileToBase64(a.file),
        }))
      );

      const payload: CreateCampaignPayload = {
        userId: session.user.id,
        subject,
        body: bodyHtml,
        senderId,
        startTime: scheduled?.isoDate ?? new Date().toISOString(),
        delayMs: Number(delayBetweenEmails) || 0,
        hourlyLimit: hourlyLimit ? Number(hourlyLimit) : undefined,
        recipients,
        attachments: encodedAttachments.length > 0 ? encodedAttachments : undefined,
      };

      const result = await apiClient.post<CreateCampaignResponse>('/api/campaigns', payload, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      if (result.skippedRecipients.length > 0) {
        const n = result.skippedRecipients.length;
        onBack(
          `Campaign scheduled for ${result.count} recipient${result.count === 1 ? '' : 's'} — ${n} address${
            n === 1 ? '' : 'es'
          } invalid and skipped: ${result.skippedRecipients.join(', ')}`,
        );
      } else {
        onBack();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to schedule emails. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="relative mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onBack()}
          className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="flex-1 text-base font-medium text-gray-900">Compose New Email</h2>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
          className={`transition hover:text-gray-700 ${scheduled ? 'text-green-600' : 'text-gray-400'}`}
        >
          <Paperclip size={17} />
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAttachFiles} />

        {scheduled && (
          <button
            type="button"
            onClick={() => setSendLaterOpen(true)}
            className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition hover:bg-green-100"
          >
            {scheduled.label}
          </button>
        )}

        <button
          type="button"
          onClick={() => setSendLaterOpen((v) => !v)}
          aria-label="Send later"
          className={`transition hover:text-gray-700 ${scheduled ? 'text-green-600' : 'text-gray-400'}`}
        >
          <Clock size={17} />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={submitting}
          className="rounded-full border border-green-600 px-4 py-1.5 text-sm font-medium text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Sending...' : scheduled ? 'Send Later' : 'Send'}
        </button>

        {sendLaterOpen && (
          <SendLaterPopover
            initial={scheduled}
            onCancel={() => setSendLaterOpen(false)}
            onDone={(value) => {
              setScheduled(value);
              setSendLaterOpen(false);
            }}
          />
        )}
      </div>

      {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
      {sendersError && <p className="mb-3 text-sm text-red-600">{sendersError}</p>}

      <div className="rounded-xl border border-gray-100">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5">
          <span className="w-16 shrink-0 text-sm text-gray-500">From</span>
          <div className="relative flex items-center">
            <select
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="appearance-none rounded-md bg-gray-50 py-1 pl-2.5 pr-7 text-sm text-gray-700 focus:outline-none"
            >
              {senders.map((sender) => (
                <option key={sender.id} value={sender.id}>
                  {sender.fromEmail}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2 text-gray-400" />
          </div>
        </div>

        <div className="px-4">
          <RecipientsInput recipients={recipients} onChange={setRecipients} />
        </div>

        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5">
          <span className="w-16 shrink-0 text-sm text-gray-500">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-6 border-b border-gray-100 px-4 py-2.5">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Delay between 2 emails
            <input
              type="number"
              min={0}
              value={delayBetweenEmails}
              onChange={(e) => setDelayBetweenEmails(e.target.value)}
              placeholder="00"
              className="w-14 rounded-md bg-gray-50 px-2 py-1 text-center text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Hourly Limit
            <input
              type="number"
              min={0}
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value)}
              placeholder="00"
              className="w-14 rounded-md bg-gray-50 px-2 py-1 text-center text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </label>
        </div>

        <div className="bg-gray-50">
          <div
            ref={editorRef}
            contentEditable
            data-placeholder="Type Your Reply..."
            className="min-h-[80px] px-4 py-3 text-sm text-gray-700 empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] focus:outline-none [&_blockquote]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          />
          <RichTextToolbar editorRef={editorRef} />
        </div>

        <div className="min-h-[220px]" />

        <AttachmentsStrip attachments={attachments} onRemove={removeAttachment} />
      </div>
    </div>
  );
}
