'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Editorial building blocks from the athletic design system: big mono
// numerals with a hairline and caption, and a ruled 1..N scale.

export interface StatProps {
  value: React.ReactNode;
  /** Small superscript unit set tight to the digits (%, h, k) */
  unit?: string;
  caption: React.ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

export function Stat({ value, unit, caption, size = 'md', className }: StatProps) {
  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <div
        className={cn(
          'num flex items-start',
          size === 'lg' ? 'text-[clamp(64px,7vw,136px)]' : 'text-[clamp(44px,4.4vw,88px)]'
        )}
      >
        <span>{value}</span>
        {unit && <span className="ml-[0.06em] mt-[0.06em] text-[0.42em] leading-none">{unit}</span>}
      </div>
      <div className="mt-4 border-t border-foreground pt-2 text-sm leading-snug">{caption}</div>
    </div>
  );
}

export interface ScaleProps {
  label: string;
  max: number;
  value: number | null;
  onChange: (value: number | null) => void;
  /** Words for the two ends of the scale */
  low?: string;
  high?: string;
}

/** A ruled row of numbers; tap the selected one again to clear it */
export function Scale({ label, max, value, onChange, low, high }: ScaleProps) {
  const id = React.useId();
  return (
    <div role="radiogroup" aria-labelledby={id}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={id} className="text-sm font-bold">
          {label}
        </span>
        {(low || high) && (
          <span className="text-xs text-muted-foreground">
            {low} — {high}
          </span>
        )}
      </div>
      <div className="mt-2 flex border-t border-foreground">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? null : n)}
              className={cn(
                'num flex-1 border-l border-border py-2.5 text-lg first:border-l-0 transition-colors',
                selected ? 'bg-foreground text-background' : 'hover:bg-accent'
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
