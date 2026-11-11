'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { areaFor, isActivePage } from '@/lib/areas';

// Editorial page grid: 4 columns. Column 1 holds the title block and the
// area's navigation; columns 2-4 hold the content. Everything hangs from the
// same top line. On phones the columns stack.

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  const items = React.Children.toArray(children);
  const header = items.find((child) => React.isValidElement(child) && child.type === PageHeader);
  const content = items.filter((child) => child !== header);

  return (
    <div className={cn('px-[var(--gutter)] pb-24 pt-[var(--gutter)]', className)}>
      {header ? (
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-4 lg:gap-x-[var(--gutter)]">
          <aside className="lg:sticky lg:top-[calc(var(--header-h)+var(--gutter))] lg:self-start">
            {header}
            <AreaNav />
          </aside>
          <div className="min-w-0 lg:col-span-3">{content}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/** Sub-pages of the current area, as ruled rows under the title block */
function AreaNav() {
  const pathname = usePathname();
  const area = areaFor(pathname);
  if (area.pages.length < 2) return null;

  return (
    <nav aria-label={area.label} className="mt-8 border-b border-foreground">
      {area.pages.map((page) => {
        const active = isActivePage(pathname, page.href);
        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={active ? 'page' : undefined}
            className={cn('block border-t border-foreground py-2 text-base', active ? 'font-bold' : 'hover:underline')}
          >
            {page.label}
          </Link>
        );
      })}
    </nav>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Title block: bold title, short rule, deck, then actions */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <h1 className="page-title">{title}</h1>
      <div className="title-rule mt-4" aria-hidden />
      {description && <p className="page-deck mt-4 max-w-[34ch]">{description}</p>}
      {actions && <div className="mt-6 flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface PageSectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** A content section: hairline rule on top, bold head, no box */
export function PageSection({ title, description, actions, children, className }: PageSectionProps) {
  return (
    <section className={cn('mb-10', className)}>
      {(title || description || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4 border-t border-foreground pt-3">
          <div>
            {title && <h2 className="text-lg font-bold leading-tight">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
