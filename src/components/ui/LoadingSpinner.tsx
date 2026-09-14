import { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ariaLabel?: string;
}

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className, ariaLabel = 'Loading' }, ref) => {
    const sizes = {
      sm: 'w-4 h-4 border-2',
      md: 'w-6 h-6 border-2',
      lg: 'w-8 h-8 border-3',
      xl: 'w-12 h-12 border-4'
    };

    return (
      <div
        ref={ref}
        className={clsx('inline-block animate-spin rounded-full border-primary border-t-transparent', sizes[size], className)}
        role="status"
        aria-label={ariaLabel}
      >
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

export function LoadingOverlay({ isLoading, children, message }: LoadingOverlayProps) {
  return (
    <div className="relative" aria-busy={isLoading}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="flex flex-col items-center gap-4 p-6 glass rounded-2xl">
            <LoadingSpinner size="lg" />
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, lines = 1 }, ref) => {
    const baseStyles = 'animate-pulse bg-muted rounded overflow-hidden';
    
    const variants = {
      text: 'h-4 rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-lg'
    };

    if (variant === 'text' && lines > 1) {
      return (
        <div ref={ref} className={clsx('space-y-2', className)} aria-hidden="true">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={clsx(baseStyles, variants[variant])}
              style={{ width: i === lines - 1 ? '60%' : '100%', height: '1rem' }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={clsx(baseStyles, variants[variant], className)}
        style={{ width, height }}
        aria-hidden="true"
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';