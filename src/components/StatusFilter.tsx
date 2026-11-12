import { STATUS_FILTERS } from '../lib/status';
import type { StatusFilterValue } from '../types/paymentLink';

interface StatusFilterProps {
  value: StatusFilterValue;
  counts: Record<StatusFilterValue, number>;
  onChange: (value: StatusFilterValue) => void;
}

export function StatusFilter({ value, counts, onChange }: StatusFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="inline-flex max-w-full flex-wrap gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5"
    >
      {STATUS_FILTERS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
              selected
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option.label}
            <span className="text-xs tabular-nums text-slate-500">{counts[option.value]}</span>
          </button>
        );
      })}
    </div>
  );
}
