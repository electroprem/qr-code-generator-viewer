import { forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export type BadgeVariant = 
  | 'default' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'outline' 
  | 'ghost'
  | 'primary'
  | 'secondary'
  | 'destructive';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  success: 'bg-green-500/10 text-green-500 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  destructive: 'bg-red-500/10 text-red-500 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  outline: 'bg-transparent text-foreground border-border',
  ghost: 'bg-transparent text-muted-foreground border-transparent',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-primary',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  destructive: 'bg-red-500',
  info: 'bg-blue-500',
  outline: 'bg-foreground',
  ghost: 'bg-muted-foreground',
};

const dotSizes: Record<BadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, removable = false, onRemove, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center font-medium rounded-full border transition-all duration-200',
          'animate-in fade-in zoom-in-95 duration-200',
          variantStyles[variant],
          sizeStyles[size],
          removable && 'pr-1 cursor-pointer',
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={clsx(
              'rounded-full flex-shrink-0',
              dotColors[variant],
              dotSizes[size]
            )}
            aria-hidden="true"
          />
        )}
        {children}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className={clsx(
              'flex-shrink-0 rounded-full p-0.5',
              'hover:bg-black/10 dark:hover:bg-white/10',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
              size === 'sm' && 'ml-0.5',
              size === 'md' && 'ml-1',
              size === 'lg' && 'ml-1.5'
            )}
            aria-label="Remove"
          >
            <X className={clsx('w-3 h-3', size === 'sm' && 'w-2.5 h-2.5', size === 'lg' && 'w-3.5 h-3.5')} />
          </button>
        )}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

export interface BadgeGroupProps {
  badges: BadgeItem[];
  maxVisible?: number;
  className?: string;
}

export interface BadgeItem {
  value: string;
  label: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  removable?: boolean;
  onRemove?: (value: string) => void;
}

export function BadgeGroup({ badges, maxVisible = 3, className }: BadgeGroupProps) {
  const visible = badges.slice(0, maxVisible);
  const remaining = badges.length - maxVisible;

  return (
    <div className={clsx('flex flex-wrap items-center gap-1.5', className)} role="group" aria-label={`${badges.length} badges`}>
      {visible.map((badge) => (
        <Badge
          key={badge.value}
          variant={badge.variant}
          dot={badge.dot}
          removable={badge.removable}
          onRemove={() => badge.onRemove?.(badge.value)}
        >
          {badge.label}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" size="sm">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}