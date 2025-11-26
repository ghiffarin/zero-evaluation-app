'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bell, Search, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/contexts/theme-context';

// Map paths to page titles
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/daily-log': 'Daily Log',
  '/ielts': 'IELTS Practice',
  '/journals': 'Journal Reading',
  '/books': 'Books',
  '/skills': 'Skills',
  '/workouts': 'Workouts',
  '/wellness': 'Wellness',
  '/financial': 'Financial',
  '/reflections': 'Reflections',
  '/career': 'Career',
  '/masters-prep': "Master's Prep",
  '/goals': 'Goals',
  '/projects': 'Projects',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  // Check exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];

  // Check for parent path match
  const basePath = '/' + pathname.split('/')[1];
  return pageTitles[basePath] || 'Zero Evaluation';
}

export interface HeaderProps {
  className?: string;
  userName?: string;
}

export function Header({ className, userName = 'User' }: HeaderProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Cycle through themes: light -> dark -> system
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // Get the appropriate icon based on current theme setting
  const getThemeIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-5 w-5" />;
    }
    return resolvedTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
  };

  const pageTitle = getPageTitle(pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:px-6',
        className
      )}
    >
      {/* Left: Page title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold md:pl-0 pl-12">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className={cn('relative', searchOpen ? 'w-64' : 'w-auto')}>
          {searchOpen ? (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="h-9 pl-8 pr-4"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={cycleTheme} title={`Theme: ${theme}`}>
          {getThemeIcon()}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User avatar */}
        <Avatar name={userName} size="sm" className="cursor-pointer" />
      </div>
    </header>
  );
}
