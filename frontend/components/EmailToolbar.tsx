'use client';
import { useEffect, useRef, useState } from 'react';
import { Search, Filter, RotateCw, Check } from 'lucide-react';

interface EmailToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  attachmentsOnly: boolean;
  onToggleAttachmentsOnly: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function EmailToolbar({
  search,
  onSearchChange,
  attachmentsOnly,
  onToggleAttachmentsOnly,
  onRefresh,
  refreshing,
}: EmailToolbarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex w-200 max-w-full items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`rounded-lg p-2 transition hover:bg-gray-50 ${
            attachmentsOnly ? 'bg-gray-100 text-gray-700' : 'text-gray-400'
          }`}
          aria-label="Filter"
        >
          <Filter size={16} />
        </button>
        {open && (
          <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onToggleAttachmentsOnly();
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Has attachments
              {attachmentsOnly && <Check size={14} className="text-green-600" />}
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-50 disabled:opacity-50"
        aria-label="Refresh"
      >
        <RotateCw size={16} className={refreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
