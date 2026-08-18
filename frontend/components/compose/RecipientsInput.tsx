'use client';
import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { parseRecipientsFile, type ParsedRecipients } from '@/lib/parseRecipients';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VISIBLE_COUNT = 3;

interface RecipientsInputProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

export function RecipientsInput({ recipients, onChange }: RecipientsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<ParsedRecipients | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addRecipient(value: string) {
    const trimmed = value.trim().replace(/,$/, '');
    if (trimmed && EMAIL_RE.test(trimmed) && !recipients.includes(trimmed)) {
      onChange([...recipients, trimmed]);
    }
    setInputValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addRecipient(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
  }

  function removeRecipient(email: string) {
    onChange(recipients.filter((r) => r !== email));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseRecipientsFile(text);
    setUploadSummary(parsed);
    const merged = Array.from(new Set([...recipients, ...parsed.valid]));
    onChange(merged);
    e.target.value = '';
  }

  const visible = expanded ? recipients : recipients.slice(0, VISIBLE_COUNT);
  const hiddenCount = recipients.length - visible.length;

  return (
    <div className="border-b border-gray-100 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          <span className="w-16 shrink-0 text-sm text-gray-500">To</span>
          {visible.map((email) => (
            <span
              key={email}
              className="flex items-center gap-1 rounded-full border border-green-200 bg-white px-2.5 py-0.5 text-xs text-green-700"
            >
              {email}
              <button type="button" onClick={() => removeRecipient(email)} aria-label={`Remove ${email}`}>
                <X size={11} className="text-green-500 hover:text-green-700" />
              </button>
            </span>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded-full border border-green-200 bg-white px-2.5 py-0.5 text-xs text-green-700"
            >
              +{hiddenCount}
            </button>
          )}
          <input
            type="email"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addRecipient(inputValue)}
            placeholder={recipients.length === 0 ? 'recipient@example.com' : ''}
            className="min-w-[160px] flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex shrink-0 items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
        >
          <Upload size={12} />
          Upload List
        </button>
        <input ref={fileInputRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={handleFileUpload} />
      </div>

      {uploadSummary && (
        <p className="mt-1.5 pl-16 text-xs text-gray-400">
          {uploadSummary.valid.length} valid, {uploadSummary.invalid.length} invalid, {uploadSummary.duplicateCount} duplicates
        </p>
      )}
    </div>
  );
}
