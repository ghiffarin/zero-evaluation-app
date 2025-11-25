'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Header } from './header';

export interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="md:pl-64">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className={cn('min-h-[calc(100vh-3.5rem)]', className)}>{children}</main>
      </div>
    </div>
  );
}
