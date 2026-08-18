'use client';
import { useState } from 'react';

function tomorrowAt(hours?: number, minutes = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  if (hours !== undefined) {
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}

const QUICK_OPTIONS: { label: string; date: Date }[] = [
  { label: 'Tomorrow', date: tomorrowAt() },
  { label: 'Tomorrow, 10:00 AM', date: tomorrowAt(10) },
  { label: 'Tomorrow, 11:00 AM', date: tomorrowAt(11) },
  { label: 'Tomorrow, 3:00 PM', date: tomorrowAt(15) },
];

export interface ScheduledTime {
  label: string;
  isoDate: string;
}

interface SendLaterPopoverProps {
  onCancel: () => void;
  onDone: (scheduled: ScheduledTime) => void;
}

export function SendLaterPopover({ onCancel, onDone }: SendLaterPopoverProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState('');

  function handleDone() {
    if (selected) {
      const option = QUICK_OPTIONS.find((o) => o.label === selected);
      if (option) onDone({ label: option.label, isoDate: option.date.toISOString() });
      return;
    }
    if (customDate) {
      const date = new Date(customDate);
      if (!Number.isNaN(date.getTime())) {
        onDone({
          label: date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
          isoDate: date.toISOString(),
        });
      }
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onCancel} />
      <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-100 bg-white p-4 shadow-lg">
        <p className="mb-3 text-sm font-medium text-gray-900">Send Later</p>

        <input
          type="datetime-local"
          value={customDate}
          onChange={(e) => {
            setCustomDate(e.target.value);
            setSelected(null);
          }}
          className="mb-3 w-full rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <div className="mb-4 flex flex-col">
          {QUICK_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                setSelected(option.label);
                setCustomDate('');
              }}
              className={`rounded-md px-2 py-1.5 text-left text-sm transition ${
                selected === option.label ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected && !customDate}
            onClick={handleDone}
            className="rounded-full border border-green-600 px-4 py-1 text-sm font-medium text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
