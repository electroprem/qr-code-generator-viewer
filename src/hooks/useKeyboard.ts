import { useEffect, useRef, useCallback, useContext } from 'react';
import { KeyboardContext, KeyboardContextType } from '../components/providers/KeyboardProvider';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Key to listen for (e.g., 'k', 'Enter', 'Escape') */
  key: string;
  /** Require Ctrl/Cmd key */
  ctrl?: boolean;
  /** Require Meta key (Cmd on Mac) */
  meta?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt key */
  alt?: boolean;
  /** Action to execute */
  action: () => void;
  /** Description for help display */
  description: string;
  /** Whether shortcut works globally (even in inputs) */
  global?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 * @param shortcuts - Record of shortcut key -> shortcut definition
 * @param enabled - Whether shortcuts are active
 * @returns Object with register/unregister functions
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, KeyboardShortcut>,
  enabled: boolean = true
) {
  const context = useContext(KeyboardContext) as KeyboardContextType | undefined;
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardProvider');
  }
  const { registerShortcut } = context;
  const unregisterRefs = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Register all shortcuts
    const unregisterFns = Object.values(shortcuts).map((shortcut) =>
      registerShortcut(shortcut)
    );

    unregisterRefs.current = unregisterFns;

    // Cleanup on unmount or shortcuts change
    return () => {
      unregisterRefs.current.forEach((unregister) => unregister());
      unregisterRefs.current = [];
    };
  }, [shortcuts, enabled, registerShortcut]);

  /**
   * Register a single shortcut dynamically
   */
  const register = useCallback(
    (shortcut: KeyboardShortcut) => {
      return registerShortcut(shortcut);
    },
    [registerShortcut]
  );

  /**
   * Unregister all shortcuts
   */
  const unregisterAll = useCallback(() => {
    unregisterRefs.current.forEach((unregister) => unregister());
    unregisterRefs.current = [];
  }, []);

  return { register, unregisterAll };
}

/**
 * Hook for a single keyboard shortcut
 * @param key - Key to listen for
 * @param action - Action to execute
 * @param description - Description for help
 * @param options - Modifier keys and global flag
 * @param enabled - Whether shortcut is active
 */
export function useShortcut(
  key: string,
  action: () => void,
  description: string,
  options: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    global?: boolean;
  } = {},
  enabled: boolean = true
) {
  const context = useContext(KeyboardContext) as KeyboardContextType | undefined;
  if (!context) {
    throw new Error('useShortcut must be used within a KeyboardProvider');
  }
  const { registerShortcut } = context;
  const unregisterRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return;

    unregisterRef.current = registerShortcut({ key, action, description, ...options });

    return () => {
      unregisterRef.current?.();
      unregisterRef.current = null;
    };
  }, [key, action, description, options, enabled, registerShortcut]);

  return {
    unregister: useCallback(() => unregisterRef.current?.(), []),
  };
}

/**
 * Hook for global keyboard events (not using KeyboardProvider)
 * Use when you need direct event handling
 */
export function useGlobalKeyboard(
  handler: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in input/textarea
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow Escape and global shortcuts in inputs
      if (isInput && event.key !== 'Escape') return;

      handlerRef.current(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}

/**
 * Hook for detecting specific key combinations
 */
export function useKeyCombo(
  combo: {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  },
  onMatch: () => void,
  enabled: boolean = true
) {
  const comboRef = useRef(combo);
  comboRef.current = combo;

  useGlobalKeyboard(
    useCallback(
      (event: KeyboardEvent) => {
        const { key, ctrl, shift, alt } = comboRef.current;

        const keyMatch = event.key.toLowerCase() === key.toLowerCase();
        const ctrlMatch = !!ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!shift === event.shiftKey;
        const altMatch = !!alt === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          onMatch();
        }
      },
      [onMatch]
    ),
    enabled
  );
}

/**
 * Common keyboard shortcuts for the app
 */
export const commonShortcuts = {
  // Navigation
  newQR: { key: 'n', ctrl: true, description: 'Create new QR code' },
  openHistory: { key: 'h', ctrl: true, description: 'Open history' },
  openSettings: { key: ',', ctrl: true, description: 'Open settings' },
  openBatch: { key: 'b', ctrl: true, description: 'Open batch generator' },

  // Actions
  generate: { key: 'Enter', ctrl: true, description: 'Generate QR code' },
  export: { key: 'e', ctrl: true, description: 'Export QR code' },
  copy: { key: 'c', ctrl: true, description: 'Copy to clipboard' },
  save: { key: 's', ctrl: true, description: 'Save to history' },

  // UI
  toggleSidebar: { key: 'b', meta: true, description: 'Toggle sidebar' },
  toggleTheme: { key: 't', ctrl: true, description: 'Toggle theme' },
  commandPalette: { key: 'k', ctrl: true, description: 'Open command palette' },
  search: { key: '/', ctrl: true, description: 'Focus search' },

  // History
  deleteSelected: { key: 'Delete', description: 'Delete selected' },
  selectAll: { key: 'a', ctrl: true, description: 'Select all' },

  // Modal/Dialog
  close: { key: 'Escape', description: 'Close dialog/modal' },
} as const;

export default useKeyboardShortcuts;