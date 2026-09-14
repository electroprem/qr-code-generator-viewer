import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

const positionStyles: Record<string, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const typeStyles: Record<ToastType, { icon: React.ReactNode; bg: string; border: string }> = {
  success: { icon: <CheckCircle className="w-5 h-5" />, bg: 'bg-green-500/10', border: 'border-green-500/30' },
  error: { icon: <AlertCircle className="w-5 h-5" />, bg: 'bg-red-500/10', border: 'border-red-500/30' },
  warning: { icon: <AlertTriangle className="w-5 h-5" />, bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  info: { icon: <Info className="w-5 h-5" />, bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  loading: { icon: <Info className="w-5 h-5 animate-spin" />, bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};

export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast = { ...toast, id, duration: toast.duration ?? (toast.type === 'loading' ? 0 : 5000) };
    setToasts((prev) => [...prev.slice(-(maxToasts - 1)), newToast]);
    return id;
  }, [maxToasts]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, dismissAll }}>
      {children}
      <AnimatePresence>
        <div
          className={clsx(
            'fixed z-[var(--z-toast)] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-1rem)] pointer-events-none',
            positionStyles[position]
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={dismissToast}
            />
          ))}
        </div>
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { type, title, message, duration, action, dismissible = true } = toast;
  const { icon, bg, border } = typeStyles[type];
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration && duration > 0) {
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
      }, 50);
      const timeout = setTimeout(() => onDismiss(toast.id), duration);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  }, [duration, toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 300, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={clsx(
        'pointer-events-auto relative flex items-start gap-3 p-4 rounded-xl border shadow-lg',
        'backdrop-blur-xl bg-background/80',
        bg,
        border
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className={clsx('flex-shrink-0 mt-0.5', type === 'success' && 'text-green-500', type === 'error' && 'text-red-500', type === 'warning' && 'text-amber-500', type === 'info' && 'text-blue-500', type === 'loading' && 'text-blue-500')}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {message && <p className="text-sm text-muted-foreground mt-0.5">{message}</p>}
        {action && (
          <button
            onClick={() => { action.onClick(); onDismiss(toast.id); }}
            className="mt-2 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {duration && duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 rounded-b-xl bg-primary/30"
          style={{ width: `${progress}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 50, ease: 'linear' }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Toast auto-dismiss progress"
        />
      )}
    </motion.div>
  );
}

export function ToastList() {
  const { toasts, dismissToast } = useToast();
  return (
    <div className="fixed top-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-1rem)] pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}