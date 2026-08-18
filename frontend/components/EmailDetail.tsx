'use client';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { ArrowLeft, Star, Archive, Trash2, ChevronDown, Paperclip } from 'lucide-react';
import type { EmailListItemData } from '@/components/EmailListItem';

export function EmailDetail({ item, onBack }: { item: EmailListItemData; onBack: () => void }) {
  const { data: session } = useSession();

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-100"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
          {item.subject} <span className="text-gray-300">|</span>{' '}
          <span className="text-gray-400">{item.threadId}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-3 text-gray-400">
          <Star size={16} className="cursor-pointer hover:text-gray-600" />
          <Archive size={16} className="cursor-pointer hover:text-gray-600" />
          <Trash2 size={16} className="cursor-pointer hover:text-gray-600" />
          <span className="mx-1 h-4 w-px bg-gray-200" />
          {session?.user?.image && (
            <Image src={session.user.image} alt="" width={24} height={24} className="rounded-full" />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <Image src={session.user.image} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-medium text-white">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-900">
                {session?.user?.name} <span className="text-gray-400">&lt;{session?.user?.email}&gt;</span>
              </p>
              <p className="flex items-center gap-1 text-xs text-gray-400">
                to {item.recipientName} <ChevronDown size={12} />
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs text-gray-400">{item.date}</span>
        </div>

        <div className="space-y-3 text-sm text-gray-700">
          {item.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {item.attachments && item.attachments.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {item.attachments.map((attachment) => (
              <div key={attachment.name} className="rounded-lg border border-gray-100 p-3">
                <div className="mb-2 flex h-16 items-center justify-center rounded-md bg-gray-50">
                  <Paperclip size={20} className="text-gray-300" />
                </div>
                <p className="truncate text-xs text-gray-700">{attachment.name}</p>
                <p className="text-xs text-gray-400">{attachment.size}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
