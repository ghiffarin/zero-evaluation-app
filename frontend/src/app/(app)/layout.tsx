'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppLayout } from '@/components/layout';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Middleware handles initial redirect, so we can render layout immediately
  // This prevents the full-screen spinner blocking on every page navigation
  // Only show nothing briefly if auth check fails (rare case, user will redirect)
  if (!isLoading && !isAuthenticated) {
    return null;
  }

  // Render layout immediately - show content even while loading
  // This allows the sidebar and header to appear instantly
  return <AppLayout>{children}</AppLayout>;
}
