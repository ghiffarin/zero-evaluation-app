import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // Outline pills, monochrome. Only destructive/error carry color.
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-bold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-foreground bg-foreground text-background',
        secondary: 'border-foreground/40 text-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'border-foreground text-foreground',
        success: 'border-foreground bg-foreground text-background',
        warning: 'border-foreground text-foreground',
        error: 'border-transparent bg-destructive text-destructive-foreground',
        info: 'border-foreground/40 text-foreground',
        neutral: 'border-foreground/25 text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
