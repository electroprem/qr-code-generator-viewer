import { useContext, useCallback } from 'react';
import { ToastContext, Toast } from '../components/providers/ToastProvider';

/**
 * Toast message type
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast options
 */
export interface ToastOptions {
  /** Toast title */
  title: string;
  /** Toast message */
  message?: string;
  /** Toast type */
  type?: ToastType;
  /** Duration in ms (0 = persistent) */
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

/**
 * Hook for showing toasts
 * Must be used within ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext) as ToastContextValue | undefined;
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { showToast, dismissToast } = context;

  /**
   * Show a toast notification
   */
  const toast = useCallback(
    (options: ToastOptions) => {
      showToast({
        type: options.type ?? 'info',
        title: options.title,
        message: options.message,
        duration: options.duration ?? 4000,
      });
    },
    [showToast]
  );

  /**
   * Show success toast
   */
  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'success', title, message, duration }),
    [toast]
  );

  /**
   * Show error toast
   */
  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'error', title, message, duration }),
    [toast]
  );

  /**
   * Show warning toast
   */
  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'warning', title, message, duration }),
    [toast]
  );

  /**
   * Show info toast
   */
  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      toast({ type: 'info', title, message, duration }),
    [toast]
  );

  /**
   * Show promise-based toast (loading -> success/error)
   */
  const promise = useCallback(
    <T,>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ): Promise<T> => {
      // Show loading toast
      const loadingId = Math.random().toString(36).slice(2, 9);
      showToast({
        type: 'info',
        title: options.loading,
        duration: 0, // Persistent
      });

      return promise
        .then((data) => {
          dismissToast(loadingId);
          const successMessage = typeof options.success === 'function' ? options.success(data) : options.success;
          toast({ type: 'success', title: successMessage });
          return data;
        })
        .catch((err: Error) => {
          dismissToast(loadingId);
          const errorMessage = typeof options.error === 'function' ? options.error(err) : options.error;
          toast({ type: 'error', title: errorMessage, message: err.message });
          throw err;
        });
    },
    [showToast, dismissToast, toast]
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
    promise,
    dismiss: dismissToast,
  };
}

export default useToast;