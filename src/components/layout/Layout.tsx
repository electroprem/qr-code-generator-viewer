import { ReactNode, useState, useEffect, useCallback } from 'react';
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
  Command,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '@components/providers/ThemeProvider';
import { useKeyboard } from '@components/providers/KeyboardProvider';
import { useToast } from '@components/providers/ToastProvider';
import { CommandPalette } from '@components/ui/CommandPalette';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { useQRStore } from '@store/qrStore';

const navItems = [
  { path: '/', label: 'Generate', icon: QrCode, shortcut: 'G', description: 'Create QR codes' },
  { path: '/scanner', label: 'Scan', icon: Camera, shortcut: 'S', description: 'Scan QR codes' },
  { path: '/history', label: 'History', icon: History, shortcut: 'H', description: 'View history' },
  { path: '/batch', label: 'Batch', icon: FileStack, shortcut: 'B', description: 'Batch generate' },
  { path: '/settings', label: 'Settings', icon: Settings, shortcut: ',', description: 'App settings' },
] as const;

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabels = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function Layout({ children }: { children?: ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { shortcuts, registerShortcut } = useKeyboard();
  const { showToast } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isLoading] = useState(false);
  const setCommandPaletteOpenStore = useQRStore(state => state.setCommandPaletteOpen);
  const commandPaletteOpenStore = useQRStore(state => state.ui.commandPaletteOpen);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(next);
    showToast({ type: 'info', title: `Theme: ${themeLabels[next]}` });
  }, [theme, setTheme, showToast]);

  // Register keyboard shortcuts
  useEffect(() => {
    const unregister = registerShortcut({
      key: 'k',
      ctrl: true,
      action: () => {
        setCommandPaletteOpen(true);
        setCommandPaletteOpenStore(true);
      },
      description: 'Open command palette',
      global: true,
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
      global: true,
    });
    return unregister;
  }, [registerShortcut, toggleTheme]);

  useEffect(() => {
    const unregister = registerShortcut({
      key: 'Escape',
      action: () => {
        setCommandPaletteOpen(false);
        setCommandPaletteOpenStore(false);
        setSidebarOpen(false);
      },
      description: 'Close panels',
      global: true,
    });
    return unregister;
  }, [registerShortcut, setCommandPaletteOpenStore]);

  useEffect(() => {
    setCommandPaletteOpen(commandPaletteOpenStore);
  }, [commandPaletteOpenStore]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const ThemeIcon = themeIcons[theme] || Monitor;
  const currentItem = navItems.find(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  ) || navItems[0];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-gradient)', backgroundAttachment: 'fixed' }}>

      {/* ─── Mobile backdrop overlay ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ─── Desktop Sidebar ─── */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur-heavy)) saturate(200%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur-heavy)) saturate(200%)',
          borderRight: '1px solid var(--glass-border-subtle)',
          boxShadow: 'var(--shadow-lg)',
        }}
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--glass-border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(270 80% 60%) 100%)',
                boxShadow: '0 2px 8px hsl(var(--primary) / 0.4)',
              }}
            >
              <QrCode className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-none tracking-tight">QR Studio</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Pro</p>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: 'var(--glass-bg-subtle)' }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={clsx(
                  'nav-item w-full group',
                  isActive && 'active'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-transparent text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  )}
                  style={isActive ? { boxShadow: '0 1px 4px hsl(var(--primary) / 0.35)' } : {}}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="flex-1 truncate">{item.label}</span>
                <kbd
                  className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded"
                  style={{
                    background: 'var(--glass-bg-subtle)',
                    color: 'hsl(var(--muted-foreground))',
                    border: '1px solid var(--glass-border-subtle)',
                  }}
                >
                  {item.shortcut}
                </kbd>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: theme toggle + shortcuts */}
        <div
          className="px-3 py-4 space-y-2 shrink-0"
          style={{ borderTop: '1px solid var(--glass-border-subtle)' }}
        >
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-150 group"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label={`Current theme: ${resolvedTheme}. Click to cycle.`}
          >
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <ThemeIcon className="w-4 h-4" />
            </div>
            <span className="flex-1 text-sm font-medium text-left">Theme</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{
                background: 'var(--glass-bg-subtle)',
                border: '1px solid var(--glass-border-subtle)',
              }}
            >
              {themeLabels[theme] || 'System'}
            </span>
          </button>

          {/* Command Palette trigger */}
          <button
            onClick={() => { setCommandPaletteOpen(true); setCommandPaletteOpenStore(true); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-150"
            style={{ background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Open command palette"
          >
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Command className="w-4 h-4" />
            </div>
            <span className="flex-1 text-sm font-medium text-left">Command</span>
            <kbd
              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded"
              style={{
                background: 'var(--glass-bg-subtle)',
                border: '1px solid var(--glass-border-subtle)',
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Keyboard shortcuts hint */}
          {shortcuts.filter(s => s.global).length > 0 && (
            <details className="group">
              <summary className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer list-none select-none transition-colors">
                <span>Shortcuts</span>
                <span className="text-[10px] text-muted-foreground/60 group-open:rotate-90 transition-transform inline-block">›</span>
              </summary>
              <div className="mt-1 px-2 py-2 rounded-xl space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin" style={{ background: 'var(--glass-bg-subtle)' }}>
                {shortcuts.filter(s => s.global).map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{s.description}</span>
                    <kbd className="shrink-0 px-1.5 py-0.5 font-mono rounded" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border-subtle)', fontSize: '10px' }}>
                      {s.ctrl ? '⌘' : ''}{s.shift ? '⇧' : ''}{s.alt ? '⌥' : ''}{s.key.toUpperCase()}
                    </kbd>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </aside>

      {/* ─── Main content area ─── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top header */}
        <header
          className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4 shrink-0"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
            borderBottom: '1px solid var(--glass-border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <button
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: 'var(--glass-bg-subtle)' }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {/* Active page icon */}
            {(() => {
              const Icon = currentItem.icon;
              return (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                </div>
              );
            })()}
            <h1 className="text-base font-semibold text-foreground tracking-tight">{currentItem.label}</h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: 'var(--glass-bg-subtle)' }}
              onClick={toggleTheme}
              aria-label={`Theme: ${resolvedTheme}`}
            >
              <ThemeIcon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            </button>
            <button
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: 'var(--glass-bg-subtle)' }}
              onClick={() => { setCommandPaletteOpen(true); setCommandPaletteOpenStore(true); }}
              aria-label="Open command palette"
            >
              <Command className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6"
            >
              {children ?? <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ─── Mobile Bottom Tab Bar (always visible) ─── */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur-heavy)) saturate(200%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur-heavy)) saturate(200%)',
            borderTop: '1px solid var(--glass-border-subtle)',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          aria-label="Mobile bottom navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] relative"
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                {/* Active indicator pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-tab-indicator"
                    className="absolute top-1 w-8 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div
                  className={clsx(
                    'w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-150',
                    isActive ? 'bg-primary/12 scale-110' : 'bg-transparent'
                  )}
                >
                  <Icon
                    className={clsx('w-5 h-5 transition-colors duration-150', isActive ? 'text-primary' : 'text-muted-foreground')}
                    aria-hidden="true"
                  />
                </div>
                <span
                  className={clsx(
                    'text-[10px] font-medium transition-colors duration-150 leading-none',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ─── Command Palette ─── */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => {
          setCommandPaletteOpen(false);
          setCommandPaletteOpenStore(false);
        }}
        items={[]}
      />

      {/* ─── Global loading overlay ─── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
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