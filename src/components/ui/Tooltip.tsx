import { useState, useRef, useEffect, ReactNode, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipSize = 'sm' | 'md' | 'lg';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  size?: TooltipSize;
  delay?: number;
  className?: string;
  arrow?: boolean;
}

const placementStyles: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowStyles: Record<TooltipPlacement, string> = {
  top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-primary',
  bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-primary',
  left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-primary',
  right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-primary',
};

const sizeStyles: Record<TooltipSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function Tooltip({ content, children, placement = 'top', size = 'md', delay = 200, className, arrow = true }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<number>();
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).slice(2)}`);

  const show = () => {
    timeoutRef.current = window.setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, []);

  const triggerProps = {
    ref: triggerRef,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    'aria-describedby': open ? tooltipId.current : undefined,
  };

  const tooltipContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          id={tooltipId.current}
          role="tooltip"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={clsx(
            'absolute z-[var(--z-tooltip)] whitespace-nowrap',
            'bg-primary text-primary-foreground rounded-lg shadow-lg',
            'pointer-events-none',
            placementStyles[placement],
            sizeStyles[size],
            className
          )}
          style={{ transformOrigin: placement === 'top' ? 'center bottom' : placement === 'bottom' ? 'center top' : placement === 'left' ? 'right center' : 'left center' }}
        >
          {content}
          {arrow && (
            <div
              className={clsx(
                'absolute w-0 h-0 border-2 border-transparent',
                arrowStyles[placement]
              )}
              style={{ borderColor: 'transparent transparent transparent transparent' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <Fragment>
      <span {...triggerProps} className="relative inline-block">{children}</span>
      {typeof window !== 'undefined' && createPortal(tooltipContent, document.body)}
    </Fragment>
  );
}

export interface TooltipTriggerProps {
  children: ReactNode;
  'aria-label'?: string;
}

export function TooltipTrigger({ children, 'aria-label': ariaLabel, ...props }: TooltipTriggerProps & React.HTMLAttributes<HTMLElement>) {
  return <span {...props} aria-label={ariaLabel}>{children}</span>;
}