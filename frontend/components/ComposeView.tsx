'use client';
import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Paperclip, Clock, ChevronDown } from 'lucide-react';
import { RecipientsInput } from '@/components/compose/RecipientsInput';
import { RichTextToolbar } from '@/components/compose/RichTextToolbar';
import { SendLaterPopover } from '@/components/compose/SendLaterPopover';
import { AttachmentsStrip, type ComposeAttachment } from '@/components/compose/AttachmentsStrip';

export function ComposeView({ onBack }: { onBack: () => void }) {
  const { data: session } = useSession();
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState('');
  const [hourlyLimit, setHourlyLimit] = useState('');
  const [attachments, setAttachments] = useState<ComposeAttachment[]>([]);
  const [sendLaterOpen, setSendLaterOpen] = useState(false);
  const [scheduledLabel, setScheduledLabel] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div>
      <div className="relative mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
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
          className={`transition hover:text-gray-700 ${scheduledLabel ? 'text-green-600' : 'text-gray-400'}`}
        >
          <Paperclip size={17} />
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAttachFiles} />

        <button
          type="button"
          onClick={() => setSendLaterOpen((v) => !v)}
          aria-label="Send later"
          className={`transition hover:text-gray-700 ${scheduledLabel ? 'text-green-600' : 'text-gray-400'}`}
        >
          <Clock size={17} />
        </button>

        <button
          type="button"
          className="rounded-full border border-green-600 px-4 py-1.5 text-sm font-medium text-green-600 transition hover:bg-green-50"
        >
          {scheduledLabel ? 'Send Later' : 'Send'}
        </button>

        {sendLaterOpen && (
          <SendLaterPopover
            onCancel={() => setSendLaterOpen(false)}
            onDone={(label) => {
              setScheduledLabel(label);
              setSendLaterOpen(false);
            }}
          />
        )}
      </div>

      <div className="rounded-xl border border-gray-100">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5">
          <span className="w-16 shrink-0 text-sm text-gray-500">From</span>
          <span className="flex items-center gap-1 rounded-md bg-gray-50 px-2.5 py-1 text-sm text-gray-700">
            {session?.user?.email}
            <ChevronDown size={14} className="text-gray-400" />
          </span>
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
            contentEditable
            data-placeholder="Type Your Reply..."
            className="min-h-[80px] px-4 py-3 text-sm text-gray-700 empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] focus:outline-none"
          />
          <RichTextToolbar />
        </div>

        <div className="min-h-[220px]" />

        <AttachmentsStrip attachments={attachments} onRemove={removeAttachment} />
      </div>
    </div>
  );
}
