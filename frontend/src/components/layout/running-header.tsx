'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AREAS, SYSTEM_AREA, areaFor, isActivePage, type Area } from '@/lib/areas';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';

// Running header: a paper-colored band with a hairline rule, four mono
// uppercase slots on the major column starts. On phones the menu opens the
// accordion table of contents.

const todayLabel = () =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date())
    .replace(/,/g, '');

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  return (
    <button type="button" onClick={() => setTheme(next)} className={cn('hover:underline', className)} title="Change theme">
      Theme: {theme}
    </button>
  );
}

export function RunningHeader() {
  const pathname = usePathname();
  const area = areaFor(pathname);
  const { logout } = useAuth();
  // The menu remembers the page it was opened on, so navigating closes it
  const [menuOpenedAt, setMenuOpenedAt] = React.useState<string | null>(null);
  const menuOpen = menuOpenedAt === pathname;
  const toggleMenu = () => setMenuOpenedAt(menuOpen ? null : pathname);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header className="band label-mono sticky top-0 z-40 h-[var(--header-h)] border-b border-foreground">
        <div className="grid h-full grid-cols-[1fr_auto_auto] items-center gap-x-[var(--gutter)] px-[var(--gutter)] lg:grid-cols-4">
          <Link href="/today" className="truncate font-medium hover:underline">
            Zero Evaluation
          </Link>

          {/* Desktop: area navigation across columns 2 and 3 */}
          <nav className="hidden items-center gap-x-5 lg:col-span-2 lg:flex" aria-label="Areas">
            {AREAS.map((a) => (
              <Link
                key={a.key}
                href={a.href}
                aria-current={a.key === area.key ? 'page' : undefined}
                className={cn(
                  'underline-offset-[6px] hover:underline',
                  a.key === area.key && 'underline decoration-1'
                )}
              >
                {a.label}
              </Link>
            ))}
          </nav>

          {/* Desktop: date and account in column 4 */}
          <div className="hidden items-center gap-x-5 lg:flex">
            {/* The server may be in another timezone; the browser's date wins */}
            <span className="tabular-nums" suppressHydrationWarning>
              {todayLabel()}
            </span>
            <Link href="/settings" className={cn('hover:underline', area.key === 'system' && 'underline underline-offset-[6px]')}>
              Settings
            </Link>
            <button type="button" onClick={logout} className="hover:underline">
              Sign out
            </button>
          </div>

          {/* Phone: current area and the menu */}
          <span className="truncate lg:hidden">{area.label}</span>
          <button
            type="button"
            className="lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="area-menu"
            onClick={toggleMenu}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </header>

      {menuOpen && (
        <AccordionMenu id="area-menu" pathname={pathname} current={area} onSignOut={logout} />
      )}
    </>
  );
}

function AccordionMenu({
  id,
  pathname,
  current,
  onSignOut,
}: {
  id: string;
  pathname: string;
  current: Area;
  onSignOut: () => void;
}) {
  return (
    <div
      id={id}
      className="band fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 overflow-y-auto px-[var(--gutter)] pb-10 animate-fade-in lg:hidden"
    >
      <nav aria-label="Areas">
        {[...AREAS, SYSTEM_AREA].map((a) => {
          const open = a.key === current.key;
          return (
            <div key={a.key} className="border-b border-foreground">
              <Link
                href={a.href}
                aria-current={open ? 'page' : undefined}
                className={cn('block py-3', open ? 'text-[44px] font-bold leading-[0.95] tracking-tight' : 'text-[26px]')}
              >
                {a.label}
              </Link>
              {open && a.pages.length > 0 && (
                <ul className="pb-4">
                  {a.pages.map((p) => (
                    <li key={p.href}>
                      <Link
                        href={p.href}
                        className={cn('block py-1.5 text-lg', isActivePage(pathname, p.href) && 'font-bold')}
                      >
                        {p.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
      <div className="label-mono mt-6 flex flex-wrap gap-x-6 gap-y-3">
        <ThemeToggle />
        <button type="button" onClick={onSignOut} className="hover:underline">
          Sign out
        </button>
      </div>
    </div>
  );
}

export { ThemeToggle };
