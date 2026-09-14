import { forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  animated?: boolean;
  striped?: boolean;
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const variantStyles = {
  default: 'bg-primary',
  primary: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  destructive: 'bg-red-500',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, label, size = 'md', variant = 'default', animated = false, striped = false, children, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div ref={ref} className={clsx('w-full', className)} {...props}>
        {(label || showLabel) && (
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1">
            {label}
            {showLabel && <span>{Math.round(percentage)}%</span>}
          </div>
        )}
        <div
          className={clsx(
            'relative w-full overflow-hidden rounded-full bg-muted',
            sizeStyles[size]
          )}
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <motion.div
            className={clsx(
              'h-full rounded-full transition-all duration-500 ease-out',
              variantStyles[variant],
              striped && 'bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]'
            )}
            initial={animated ? { width: 0 } : false}
            animate={{ width: `${percentage}%` }}
            transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
            style={{
              backgroundSize: striped ? '1rem 1rem' : undefined,
            }}
          >
            {animated && striped && (
              <motion.div
                className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]"
                animate={{ backgroundPositionX: ['0%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        </div>
        {children}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  animated?: boolean;
}

const circularVariantStyles = {
  default: 'text-primary',
  primary: 'text-primary',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  destructive: 'text-red-500',
};

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ className, value, max = 100, size = 48, strokeWidth = 4, showLabel = false, label, variant = 'default', animated = false, children, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div ref={ref} className={clsx('relative inline-flex items-center justify-center', className)} {...props}>
        <svg width={size} height={size} className={clsx(circularVariantStyles[variant], 'transform -rotate-90')}>
          <circle
            className="text-muted-foreground/20"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <motion.circle
            className="transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            strokeDasharray={circumference}
            strokeDashoffset={animated ? circumference : strokeDashoffset}
            initial={animated ? { strokeDashoffset: circumference } : false}
            animate={{ strokeDashoffset }}
            transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
            strokeLinecap="round"
          />
        </svg>
        {(showLabel || label) && (
          <div className="absolute inset-0 flex items-center justify-center">
            {label || <span className="font-mono font-medium">{Math.round(percentage)}%</span>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';