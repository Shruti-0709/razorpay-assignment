import type { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  /** Rendered after the label, e.g. "Optional". */
  labelHint?: string;
  helpText?: ReactNode;
  error?: string;
  /** Receives the aria props that wire the control to its help/error text. */
  children: (aria: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => ReactNode;
}

export const inputClassName =
  'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 ' +
  'aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20 disabled:bg-slate-50';

export function FormField({ id, label, labelHint, helpText, error, children }: FormFieldProps) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-slate-700">
        {label}
        {labelHint && <span className="text-xs font-normal text-slate-500">{labelHint}</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={helpId} className="mt-1.5 text-xs text-slate-500">
          {helpText}
        </p>
      )}
    </div>
  );
}
