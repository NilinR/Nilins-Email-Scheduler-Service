'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-700 shadow-lg">
      <p className="flex-1">{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  );
}
