'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { areaFor } from '@/lib/areas';
import { RunningHeader } from './running-header';

export interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// The whole page below the header band is the area's color field
export function AppLayout({ children, className }: AppLayoutProps) {
  const area = areaFor(usePathname());

  return (
    <div className="min-h-screen" data-area={area.field ?? 'paper'}>
      <RunningHeader />
      <main className={cn('min-h-[calc(100vh-var(--header-h))]', className)}>{children}</main>
    </div>
  );
}
