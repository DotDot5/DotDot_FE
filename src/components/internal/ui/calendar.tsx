'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

export function Calendar({
  selected,
  onSelect,
  mode,
  initialFocus,
}: {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  mode?: string;
  initialFocus?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      onSelect(date);
    } else {
      onSelect(undefined);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <CalendarIcon className="w-4 h-4 text-gray-500" />
      <input
        type="date"
        onChange={handleChange}
        value={selected ? format(selected, 'yyyy-MM-dd') : ''}
        className="border px-3 py-2 rounded text-sm"
      />
    </div>
  );
}
