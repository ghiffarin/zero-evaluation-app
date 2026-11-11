import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'flex h-9 w-full rounded-none border-0 border-b border-input bg-transparent px-0 py-2 text-sm transition-colors appearance-none pr-7 focus-visible:outline-none focus-visible:border-foreground focus-visible:shadow-[inset_0_-1px_0_var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground',
            error && 'border-destructive',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
