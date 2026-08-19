'use client';
import { useState } from 'react';

function atHoursFromNow(hoursFromNow: number): Date {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + hoursFromNow);
  return date;
}

function tomorrowAt(hours: number, minutes = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function labelFor(date: Date): string {
  return date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

// "Later today" only offers hours that haven't passed yet - a 3pm option shown at 4pm is useless
const LATER_TODAY_HOURS = [1, 3, 6].map(atHoursFromNow).filter((d) => d.getDate() === new Date().getDate());

const QUICK_OPTIONS: { label: string; date: Date }[] = [
  ...LATER_TODAY_HOURS.map((date) => ({ label: labelFor(date), date })),
  { label: 'Tomorrow morning (9:00 AM)', date: tomorrowAt(9) },
  { label: 'Tomorrow afternoon (1:00 PM)', date: tomorrowAt(13) },
  { label: 'Tomorrow evening (6:00 PM)', date: tomorrowAt(18) },
];

export interface ScheduledTime {
  label: string;
  isoDate: string;
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toTimeInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface SendLaterPopoverProps {
  initial: ScheduledTime | null;
  onCancel: () => void;
  onDone: (scheduled: ScheduledTime | null) => void;
}

export function SendLaterPopover({ initial, onCancel, onDone }: SendLaterPopoverProps) {
  const initialDate = initial ? new Date(initial.isoDate) : null;
  const [selectedLabel, setSelectedLabel] = useState<string | null>(
    initialDate && QUICK_OPTIONS.some((o) => o.label === initial?.label) ? (initial?.label ?? null) : null,
  );
  const [customDate, setCustomDate] = useState(initialDate ? toDateInputValue(initialDate) : '');
  const [customTime, setCustomTime] = useState(initialDate ? toTimeInputValue(initialDate) : '');

  const now = new Date();
  const todayValue = toDateInputValue(now);

  function selectQuick(option: { label: string; date: Date }) {
    setSelectedLabel(option.label);
    setCustomDate(toDateInputValue(option.date));
    setCustomTime(toTimeInputValue(option.date));
  }

  function handleCustomChange(nextDate: string, nextTime: string) {
    setCustomDate(nextDate);
    setCustomTime(nextTime);
    setSelectedLabel(null);
  }

  const customDateObj = customDate && customTime ? new Date(`${customDate}T${customTime}`) : null;
  const isPast = customDateObj !== null && customDateObj.getTime() < now.getTime();

  function handleDone() {
    if (!customDateObj || Number.isNaN(customDateObj.getTime()) || isPast) return;
    onDone({
      label: selectedLabel ?? labelFor(customDateObj),
      isoDate: customDateObj.toISOString(),
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onCancel} />
      <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-100 bg-white p-4 shadow-lg">
        <p className="mb-3 text-sm font-medium text-gray-900">Send Later</p>

        <div className="mb-1 flex gap-2">
          <input
            type="date"
            value={customDate}
            min={todayValue}
            onChange={(e) => handleCustomChange(e.target.value, customTime)}
            className="flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="time"
            value={customTime}
            onChange={(e) => handleCustomChange(customDate, e.target.value)}
            className="w-28 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {isPast && <p className="mb-2 text-xs text-red-600">That time has already passed.</p>}

        <p className="mb-2 mt-3 text-xs font-medium text-gray-400">Or pick a quick option</p>
        <div className="mb-4 flex flex-col gap-1">
          {QUICK_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => selectQuick(option)}
              className={`rounded-md px-2 py-1.5 text-left text-sm transition ${
                selectedLabel === option.label ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          {initial ? (
            <button
              type="button"
              onClick={() => onDone(null)}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Clear
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
            <button
              type="button"
              disabled={!customDateObj || isPast}
              onClick={handleDone}
              className="rounded-full border border-green-600 px-4 py-1 text-sm font-medium text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
