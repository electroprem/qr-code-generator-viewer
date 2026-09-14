import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'ref'> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-card border border-glass-border dark:border-glass-border-dark',
  elevated: 'bg-card shadow-lg border-none hover:shadow-xl',
  outlined: 'bg-transparent border-2 border-glass-border dark:border-glass-border-dark',
  glass: 'bg-glass backdrop-blur-xl border border-glass-border dark:border-glass-border-dark',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const baseClass = clsx(
      'rounded-2xl transition-all duration-300',
      variantStyles[variant],
      paddingStyles[padding],
      hover && 'hover:-translate-y-1 hover:shadow-lg cursor-pointer',
      className
    );

    if (hover) {
      return (
        <motion.div
          ref={ref as any}
          className={baseClass}
          whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)' }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClass} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={clsx('text-xl font-semibold text-foreground', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={clsx('text-sm text-muted-foreground mt-1', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('mt-4 flex items-center gap-2', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';