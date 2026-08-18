import { Search, Filter, RotateCw } from 'lucide-react';

export function EmailToolbar() {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex w-200 max-w-full items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
      <button type="button" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-50" aria-label="Filter">
        <Filter size={16} />
      </button>
      <button type="button" className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-50" aria-label="Refresh">
        <RotateCw size={16} />
      </button>
    </div>
  );
}
