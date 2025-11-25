import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('flex-1 p-4 md:p-6 lg:p-8', className)}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
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

export function PageSection({ title, description, actions, children, className }: PageSectionProps) {
  return (
    <section className={cn('mb-8', className)}>
      {(title || description || actions) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
