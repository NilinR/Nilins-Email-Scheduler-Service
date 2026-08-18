'use client';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { ChevronDown, Clock, Send } from 'lucide-react';
import onbLogo from '@/public/onb.png';

interface SidebarProps {
  activeTab: 'scheduled' | 'sent';
  onTabChange: (tab: 'scheduled' | 'sent') => void;
  onCompose: () => void;
  scheduledCount: number | null;
  sentCount: number | null;
}

export function Sidebar({ activeTab, onTabChange, onCompose, scheduledCount, sentCount }: SidebarProps) {
  const { data: session } = useSession();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-100 p-4">
      <Image
        src={onbLogo}
        alt="ONB"
        width={64}
        height={20}
        className="mb-6 h-7 w-auto self-start object-contain"
        priority
      />

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="mb-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-left transition hover:bg-gray-100"
      >
        {session?.user?.image && (
          <Image src={session.user.image} alt="" width={32} height={32} className="rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{session?.user?.name}</p>
          <p className="truncate text-xs text-gray-500">{session?.user?.email}</p>
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      <button
        type="button"
        onClick={onCompose}
        className="mb-6 rounded-full border border-green-600 py-2 text-sm font-medium text-green-600 transition hover:bg-green-50"
      >
        Compose
      </button>

      <p className="mb-2 px-1 text-xs font-medium tracking-wide text-gray-400">CORE</p>
      <nav className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onTabChange('scheduled')}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
            activeTab === 'scheduled' ? 'bg-green-50 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock size={16} />
            Scheduled
          </span>
          <span className="text-xs text-gray-500">{scheduledCount ?? '...'}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('sent')}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
            activeTab === 'sent' ? 'bg-green-50 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-2">
            <Send size={16} />
            Sent
          </span>
          <span className="text-xs text-gray-500">{sentCount ?? '...'}</span>
        </button>
      </nav>
    </aside>
  );
}
