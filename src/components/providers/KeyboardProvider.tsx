import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  global?: boolean;
}

export interface KeyboardContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => () => void;
  unregisterShortcut: (shortcut: KeyboardShortcut) => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export { KeyboardContext };

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => [...prev, shortcut]);
    return () => {
      setShortcuts(prev => prev.filter(s => s !== shortcut));
    };
  }, []);

  const unregisterShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => prev.filter(s => s !== shortcut));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || 
                      activeElement?.tagName === 'TEXTAREA' || 
                      activeElement?.getAttribute('contenteditable') === 'true';

      for (const shortcut of shortcutsRef.current) {
        if (!shortcut.global && isInput) continue;

        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <KeyboardContext.Provider value={{ shortcuts, registerShortcut, unregisterShortcut }}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}

export function useShortcut(
  key: string,
  action: () => void,
  description: string,
  options: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean; global?: boolean } = {}
) {
  const { registerShortcut, unregisterShortcut } = useKeyboard();

  useEffect(() => {
    const unregister = registerShortcut({ key, action, description, ...options });
    return unregister;
  }, [key, action, description, options, registerShortcut, unregisterShortcut]);
}