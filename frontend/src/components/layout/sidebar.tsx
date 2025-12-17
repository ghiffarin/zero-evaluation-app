'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Languages,
  Dumbbell,
  Heart,
  DollarSign,
  PenLine,
  Briefcase,
  GraduationCap,
  Target,
  FolderKanban,
  Wrench,
  Settings,
  LogOut,
  Menu,
  X,
  Download,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Daily Log', href: '/daily-log', icon: CalendarDays },
];

const modulesNavItems: NavItem[] = [
  { title: 'IELTS', href: '/ielts', icon: Languages },
  { title: 'Journals', href: '/journals', icon: BookOpen },
  { title: 'Books', href: '/books', icon: BookOpen },
  { title: 'Skills', href: '/skills', icon: Wrench },
  { title: 'Quizzes', href: '/quizzes', icon: Brain },
  { title: 'Workouts', href: '/workouts', icon: Dumbbell },
  { title: 'Wellness', href: '/wellness', icon: Heart },
  { title: 'Financial', href: '/financial', icon: DollarSign },
  { title: 'Reflections', href: '/reflections', icon: PenLine },
];

const planningNavItems: NavItem[] = [
  { title: 'Career', href: '/career', icon: Briefcase },
  { title: 'Masters Prep', href: '/masters-prep', icon: GraduationCap },
  { title: 'Goals', href: '/goals', icon: Target },
  { title: 'Projects', href: '/projects', icon: FolderKanban },
];

interface NavSectionProps {
  title?: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}

function NavSection({ title, items, pathname, onNavigate }: NavSectionProps) {
  return (
    <div className="px-3 py-2">
      {title && (
        <h3 className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.title}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close mobile menu on navigation
  const handleNavigate = React.useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Close mobile menu when pathname changes
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 modal-overlay md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r bg-sidebar transition-transform duration-300 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" prefetch={true} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">ZE</span>
            </div>
            <span className="text-lg font-semibold">Zero Evaluation</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <NavSection items={mainNavItems} pathname={pathname} onNavigate={handleNavigate} />
          <NavSection title="Modules" items={modulesNavItems} pathname={pathname} onNavigate={handleNavigate} />
          <NavSection title="Planning" items={planningNavItems} pathname={pathname} onNavigate={handleNavigate} />
        </div>

        {/* Footer */}
        <div className="border-t p-3">
          <nav className="space-y-1">
            <Link
              href="/export"
              prefetch={true}
              onClick={handleNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/export'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Download className="h-4 w-4" />
              <span>Transfer Data</span>
            </Link>
            <Link
              href="/settings"
              prefetch={true}
              onClick={handleNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === '/settings'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => {
                // Handle logout
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
