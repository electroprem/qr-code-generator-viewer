import { useState, useRef, useEffect, useMemo, useCallback, KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Search, X, Command } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  shortcut?: string;
  keywords?: string[];
  section?: string;
  disabled?: boolean;
  action: () => void;
}

export interface CommandSection {
  id: string;
  title: string;
  items: CommandItem[];
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
  title?: string;
  description?: string;
  className?: string;
}

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let i = 0;
  for (const char of t) {
    if (char === q[i]) i++;
    if (i === q.length) return true;
  }
  return false;
}

function scoreMatch(query: string, text: string, keywords?: string[]): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let score = 0;
  let i = 0;
  for (let j = 0; j < t.length; j++) {
    if (t[j] === q[i]) {
      score += i === 0 ? 10 : 1;
      i++;
      if (i === q.length) break;
    }
  }
  if (i !== q.length) return -1;
  if (t.startsWith(q)) score += 50;
  if (keywords?.some((k) => k.toLowerCase().includes(q))) score += 20;
  return score;
}

export function CommandPalette({
  isOpen,
  onClose,
  items,
  placeholder = 'Type a command or search...',
  title,
  description,
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      const section = item.section || 'Commands';
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    }, {} as Record<string, CommandItem[]>);

    return Object.entries(grouped).map(([title, items]) => ({
      id: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      items,
    }));
  }, [items]);

  const filteredSections = useMemo(() => {
    return sections
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => ({
            ...item,
            _score: scoreMatch(query, item.label, item.keywords),
          }))
          .filter((item) => item._score >= 0 || !query)
          .sort((a, b) => (b._score || 0) - (a._score || 0)),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, query]);

  const allFilteredItems = useMemo(() => filteredSections.flatMap((s) => s.items), [filteredSections]);
  const selectedItem = allFilteredItems[selectedIndex];

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown as EventListener);
    return () => document.removeEventListener('keydown', handleKeyDown as EventListener);
  }, [isOpen, onClose]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allFilteredItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedItem) {
          selectedItem.action();
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleItemClick = (item: CommandItem) => {
    item.action();
    onClose();
  };

  if (!isOpen) return null;

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-16 px-4"
        onClick={onClose}
        role="presentation"
      >
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={clsx(
            'w-full max-w-2xl bg-card border border-glass-border dark:border-glass-border-dark',
            'rounded-2xl shadow-[var(--shadow-2xl)] overflow-hidden',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Command palette'}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-glass-border dark:border-glass-border-dark">
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-glass-border dark:border-glass-border-dark bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
                aria-label="Search commands"
                aria-autocomplete="list"
                aria-controls="command-list"
                aria-activedescendant={selectedItem?.id}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-mono text-muted-foreground bg-surface rounded">
                <Command className="w-3 h-3 mr-1 inline-block" /> K
              </kbd>
            </div>
          </div>

          <div
            ref={listRef}
            id="command-list"
            role="listbox"
            className="max-h-[400px] overflow-y-auto"
            aria-label="Commands"
          >
            {filteredSections.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No commands found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredSections.map((section) => (
                <div key={section.id}>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-surface/50 border-b border-glass-border dark:border-glass-border-dark">
                    {section.title}
                  </div>
                  <AnimatePresence mode="popLayout">
                    {section.items.map((item, index) => {
                      const globalIndex = allFilteredItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <motion.button
                          key={item.id}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={item.disabled}
                          onClick={() => !item.disabled && handleItemClick(item)}
                          disabled={item.disabled}
                          className={clsx(
                            'w-full flex items-center gap-3 px-4 py-3 text-left',
                            'transition-colors focus:outline-none',
                            isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-surface text-foreground',
                            item.disabled && 'opacity-50 cursor-not-allowed'
                          )}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.1 }}
                          style={{ transitionDelay: `${index * 10}ms` }}
                        >
                          {item.icon && <span className="flex-shrink-0 w-5 h-5 text-muted-foreground">{item.icon}</span>}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{item.label}</span>
                            {item.description && (
                              <span className="text-sm text-muted-foreground truncate block">{item.description}</span>
                            )}
                          </div>
                          {item.shortcut && (
                            <kbd className="px-2 py-0.5 text-xs font-mono text-muted-foreground bg-surface rounded flex items-center gap-1">
                              {item.shortcut.split('+').map((k, i) => (
                                <span key={i}>{k}</span>
                              ))}
                            </kbd>
                          )}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CommandItem[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const registerItems = useCallback((newItems: CommandItem[]) => setItems(newItems), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', handleKeyDown as EventListener);
    return () => document.removeEventListener('keydown', handleKeyDown as EventListener);
  }, [toggle]);

  return { isOpen, open, close, toggle, items, registerItems };
}