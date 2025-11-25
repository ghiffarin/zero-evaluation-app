import * as React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'default' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  default: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'default', ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    const showFallback = !src || imageError;
    const initials = name ? getInitials(name) : '?';

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full bg-muted',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {showFallback ? (
          <span className="flex h-full w-full items-center justify-center font-medium text-muted-foreground">
            {initials}
          </span>
        ) : (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="aspect-square h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar };
