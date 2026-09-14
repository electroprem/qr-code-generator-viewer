import { ReactNode, useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  History, 
  Settings, 
  FileStack,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Command
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '@components/providers/ThemeProvider';
import { useKeyboard } from '@components/providers/KeyboardProvider';
import { useToast } from '@components/providers/ToastProvider';
import { CommandPalette } from '@components/ui/CommandPalette';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { useQRStore } from '@store/qrStore';

const navItems = [
  { path: '/', label: 'Generate', icon: QrCode, shortcut: 'G' },
  { path: '/scanner', label: 'Scan', icon: Camera, shortcut: 'S' },
  { path: '/history', label: 'History', icon: History, shortcut: 'H' },
  { path: '/batch', label: 'Batch', icon: FileStack, shortcut: 'B' },
  { path: '/settings', label: 'Settings', icon: Settings, shortcut: ',' }
] as const;

export function Layout({ children }: { children?: ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { shortcuts, registerShortcut } = useKeyboard();
  const { showToast } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setCommandPaletteOpenStore = useQRStore(state => state.setCommandPaletteOpen);
  const commandPaletteOpenStore = useQRStore(state => state.ui.commandPaletteOpen);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(next);
  };

  useEffect(() => {
    const unregister = registerShortcut({
      key: 'k',
      ctrl: true,
      action: () => {
        setCommandPaletteOpen(true);
        setCommandPaletteOpenStore(true);
      },
      description: 'Open command palette',
      global: true
    });
    return unregister;
  }, [registerShortcut, setCommandPaletteOpenStore]);

  useEffect(() => {
    const unregister = registerShortcut({
      key: 't',
      ctrl: true,
      shift: true,
      action: toggleTheme,
      description: 'Toggle theme',
      global: true
    });
    return unregister;
  }, [registerShortcut]);

  useEffect(() => {
    const unregister = registerShortcut({
      key: 'Escape',
      action: () => {
        setCommandPaletteOpen(false);
        setCommandPaletteOpenStore(false);
      },
      description: 'Close command palette',
      global: true
    });
    return unregister;
  }, [registerShortcut, setCommandPaletteOpenStore]);

  useEffect(() => {
    setCommandPaletteOpen(commandPaletteOpenStore);
  }, [commandPaletteOpenStore]);

  const currentItem = navItems.find(item => location.pathname.startsWith(item.path)) || navItems[0];

  return (
    <div className="min-h-screen bg-background flex">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={clsx(
          'fixed lg:static z-50 h-full w-64 bg-glass dark:bg-glass backdrop-blur-xl border-r border-glass-border dark:border-glass-border-dark',
          'flex flex-col transition-transform duration-300 ease-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-glass-border dark:border-glass-border-dark">
          <h1 className="text-xl font-bold text-foreground">QR Studio</h1>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-surface transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { setSidebarOpen(false); setMobileNavOpen(false); }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  'text-muted-foreground hover:text-foreground hover:bg-surface',
                  isActive && 'text-primary bg-primary/10 font-medium',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
                <kbd className="ml-auto hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60 bg-surface rounded">
                  {item.shortcut}
                </kbd>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-glass-border dark:border-glass-border-dark space-y-3">
          <button
            onClick={toggleTheme}
            className={clsx(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200',
              'text-muted-foreground hover:text-foreground hover:bg-surface',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
            aria-label={`Current theme: ${resolvedTheme}. Click to cycle.`}
          >
            <div className="flex items-center gap-3">
              {resolvedTheme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
              <span>Theme</span>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface">
              {resolvedTheme === 'dark' ? 'Dark' : resolvedTheme === 'light' ? 'Light' : 'System'}
            </span>
          </button>

          <details className="group">
            <summary className="flex items-center justify-between px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer list-none">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Shortcuts</span>
              </div>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-2 p-3 bg-surface/50 rounded-xl text-xs space-y-2 max-h-48 overflow-y-auto">
              {shortcuts
                .filter(s => s.global)
                .map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-muted-foreground">
                    <span>{s.description}</span>
                    <kbd className="px-1.5 py-0.5 font-mono bg-background rounded border border-glass-border">
                      {s.ctrl ? '⌘' : ''}{s.shift ? '⇧' : ''}{s.alt ? '⌥' : ''}{s.key.toUpperCase()}
                    </kbd>
                  </div>
                ))}
            </div>
          </details>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-glass/80 backdrop-blur-xl border-b border-glass-border dark:border-glass-border-dark flex items-center justify-between px-4">
          <button
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground truncate flex-1 px-4">
            {currentItem.label}
          </h1>
          <button
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            onClick={toggleTheme}
            aria-label={`Theme: ${resolvedTheme}`}
          >
            {resolvedTheme === 'dark' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-auto pt-16 lg:pt-0 pb-16 lg:pb-0 px-4 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-7xl mx-auto"
            >
              {children ?? <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-glass/95 backdrop-blur-xl border-t border-glass-border dark:border-glass-border-dark"
            >
              <nav className="flex items-center justify-around h-16" aria-label="Mobile bottom navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileNavOpen(false)}
                      className={clsx(
                        'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                        'active:scale-95'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={item.label}
                    >
                      <Icon className="w-6 h-6" aria-hidden="true" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => {
          setCommandPaletteOpen(false);
          setCommandPaletteOpenStore(false);
        }}
        items={[]}
      />

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] bg-black/30 backdrop-blur-sm flex items-center justify-center"
            role="status"
            aria-live="polite"
            aria-label="Loading"
          >
            <LoadingSpinner size="lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}