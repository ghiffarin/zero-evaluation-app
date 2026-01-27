'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
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
  ChevronDown,
  Sparkles,
  Activity,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Daily Log', href: '/daily-log', icon: CalendarDays },
];

const navGroups: NavGroup[] = [
  {
    id: 'learn',
    title: 'Learn',
    icon: BookOpen,
    items: [
      { title: 'IELTS', href: '/ielts', icon: Languages },
      { title: 'Journals', href: '/journals', icon: BookOpen },
      { title: 'Books', href: '/books', icon: BookOpen },
      { title: 'Skills', href: '/skills', icon: Wrench },
      { title: 'Quizzes', href: '/quizzes', icon: Brain },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    icon: Activity,
    items: [
      { title: 'Workouts', href: '/workouts', icon: Dumbbell },
      { title: 'Wellness', href: '/wellness', icon: Heart },
      { title: 'Financial', href: '/financial', icon: DollarSign },
    ],
  },
  {
    id: 'growth',
    title: 'Growth',
    icon: Sparkles,
    items: [
      { title: 'Reflections', href: '/reflections', icon: PenLine },
      { title: 'Career', href: '/career', icon: Briefcase },
      { title: 'Masters Prep', href: '/masters-prep', icon: GraduationCap },
    ],
  },
  {
    id: 'planning',
    title: 'Planning',
    icon: Compass,
    items: [
      { title: 'Goals', href: '/goals', icon: Target },
      { title: 'Projects', href: '/projects', icon: FolderKanban },
    ],
  },
];

interface NavSectionProps {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}

function NavSection({ items, pathname, onNavigate }: NavSectionProps) {
  return (
    <div className="px-3 py-1">
      <nav className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
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

interface CollapsibleNavGroupProps {
  group: NavGroup;
  pathname: string;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

function CollapsibleNavGroup({ group, pathname, isExpanded, onToggle, onNavigate }: CollapsibleNavGroupProps) {
  const hasActiveItem = group.items.some(
    item => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <div className="px-3 py-0.5">
      <button
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          hasActiveItem
            ? 'text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <group.icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{group.title}</span>
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 transition-transform duration-200',
            isExpanded ? 'rotate-180' : ''
          )}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
          {group.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export interface SidebarProps {
  className?: string;
}

const STORAGE_KEY = 'sidebar-expanded-groups';

function getInitialExpandedGroups(pathname: string): Set<string> {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return new Set(JSON.parse(stored));
      } catch {
        // Invalid JSON, fall through to default
      }
    }
  }

  // Default: expand the group containing the active item
  for (const group of navGroups) {
    if (group.items.some(item => pathname === item.href || pathname.startsWith(`${item.href}/`))) {
      return new Set([group.id]);
    }
  }

  return new Set();
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(() =>
    getInitialExpandedGroups(pathname)
  );

  // Close mobile menu on navigation
  const handleNavigate = React.useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Close mobile menu when pathname changes
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Auto-expand group when navigating to an item within it
  React.useEffect(() => {
    for (const group of navGroups) {
      if (group.items.some(item => pathname === item.href || pathname.startsWith(`${item.href}/`))) {
        setExpandedGroups(prev => {
          if (prev.has(group.id)) return prev;
          const next = new Set(prev);
          next.add(group.id);
          return next;
        });
        break;
      }
    }
  }, [pathname]);

  // Persist expanded groups to localStorage
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedGroups]));
  }, [expandedGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

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
            <img
              src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
              alt="Zero Evaluation"
              className="h-8 w-auto"
            />
            <span className="font-semibold text-sm">Zero Evaluation</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Main nav items (Dashboard, Daily Log) */}
          <NavSection items={mainNavItems} pathname={pathname} onNavigate={handleNavigate} />

          {/* Collapsible groups */}
          <div className="mt-2 border-t border-sidebar-border pt-2">
            {navGroups.map(group => (
              <CollapsibleNavGroup
                key={group.id}
                group={group}
                pathname={pathname}
                isExpanded={expandedGroups.has(group.id)}
                onToggle={() => toggleGroup(group.id)}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-3">
          <nav className="space-y-0.5">
            <Link
              href="/export"
              prefetch={true}
              onClick={handleNavigate}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
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
                'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                pathname === '/settings'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
            <button
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
