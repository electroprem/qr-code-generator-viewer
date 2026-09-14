import React, { useState, useRef, useEffect, useId, ReactNode, KeyboardEvent, Fragment, forwardRef, createContext, useContext, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export type DropdownPlacement = 'bottom' | 'top' | 'left' | 'right';
export type DropdownAlign = 'start' | 'center' | 'end';

export interface DropdownItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  group?: string;
  shortcut?: string;
}

export interface DropdownProps {
  trigger?: ReactNode;
  items?: DropdownItem[];
  onSelect?: (value: string, item: DropdownItem) => void;
  placement?: DropdownPlacement;
  align?: DropdownAlign;
  width?: number | 'trigger';
  closeOnSelect?: boolean;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

const DropdownContext = createContext<{ close: () => void; onSelect?: (value: string, item: DropdownItem) => void } | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown compound components must be used within Dropdown.Root');
  }
  return context;
}

export function DropdownRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx('relative inline-flex', className)}>{children}</div>;
}

export const DropdownTrigger = forwardRef<HTMLButtonElement, { children: ReactNode; className?: string; disabled?: boolean }>(
  ({ children, className, disabled, ...props }, ref) => {
    const { close } = useDropdownContext();
    return (
      <button
        ref={ref}
        type="button"
        onClick={close}
        disabled={disabled}
        className={clsx('inline-flex items-center gap-2', className)}
        {...props}
      >
        {children}
        <ChevronDown className="w-4 h-4 transition-transform" />
      </button>
    );
  }
);
DropdownTrigger.displayName = 'DropdownTrigger';

export const DropdownMenu = forwardRef<HTMLDivElement, { 
  children: ReactNode; 
  className?: string;
  placement?: DropdownPlacement;
  align?: DropdownAlign;
  width?: number | 'trigger';
}>(
  ({ children, className, placement = 'bottom', align: _align = 'start', width = 'trigger', ...props }, _ref) => {
    const { close } = useDropdownContext();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current?.contains(e.target as Node)) return;
        close();
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [close]);

    return (
      <AnimatePresence>
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: placement === 'top' ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: placement === 'top' ? 8 : -8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={clsx(
            'absolute z-[var(--z-dropdown)] min-w-[160px] max-w-[320px]',
            'bg-card border border-glass-border dark:border-glass-border-dark',
            'rounded-xl shadow-lg py-1.5',
            'focus:outline-none',
            className
          )}
          role="menu"
          aria-orientation="vertical"
          tabIndex={-1}
          style={{
            width: width === 'trigger' ? undefined : typeof width === 'number' ? `${width}px` : width,
          }}
          {...props}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }
);
DropdownMenu.displayName = 'DropdownMenu';

export const DropdownGroup = forwardRef<HTMLDivElement, { children: ReactNode; label?: string; className?: string }>(
  ({ children, label, className, ...props }, ref) => (
    <div ref={ref} className={clsx('py-1.5', className)} {...props}>
      {label && (
        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
      )}
      {children}
    </div>
  )
);
DropdownGroup.displayName = 'DropdownGroup';

export const DropdownItem = forwardRef<HTMLButtonElement, { 
  children: ReactNode; 
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
  onSelect?: (value: string) => void;
  onClick?: () => void;
  className?: string;
}>(
  ({ children, value, icon, disabled, danger, shortcut, onSelect, onClick, className, ...props }, ref) => {
    const { close, onSelect: contextOnSelect } = useDropdownContext();
    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => { 
          onClick?.(); 
          onSelect?.(value) ?? contextOnSelect?.(value, { value, label: children }); 
          close(); 
        }}
        className={clsx(
          'w-full flex items-center gap-3 px-3 py-2 text-sm',
          'text-foreground hover:bg-surface transition-colors',
          'focus:outline-none focus:bg-surface',
          disabled && 'opacity-50 cursor-not-allowed',
          danger && 'text-red-500 hover:bg-red-500/10',
          className
        )}
        aria-disabled={disabled}
        {...props}
      >
        {icon && <span className="flex-shrink-0 w-5 h-5">{icon}</span>}
        <span className="flex-1">{children}</span>
        {shortcut && (
          <kbd className="px-1.5 py-0.5 text-xs font-mono text-muted-foreground bg-surface rounded">
            {shortcut}
          </kbd>
        )}
      </button>
    );
  }
);
DropdownItem.displayName = 'DropdownItem';

export const DropdownDivider = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('h-px bg-glass-border dark:bg-glass-border-dark my-1', className)} role="separator" {...props} />
  )
);
DropdownDivider.displayName = 'DropdownDivider';

function isCompoundChild(child: ReactNode): boolean {
  if (!isValidElement(child)) return false;
  return child.type === DropdownTrigger || child.type === DropdownMenu || child.type === DropdownGroup || child.type === DropdownItem || child.type === DropdownDivider;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  placement = 'bottom',
  align: _align = 'start',
  width = 'trigger',
  closeOnSelect = true,
  className,
  disabled,
  children,
}: DropdownProps) {
  const useCompound = children != null && React.Children.toArray(children).some(isCompoundChild);
  
  if (useCompound) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const dropdownId = useId();

    const close = () => setOpen(false);
    const openMenu = () => !disabled && setOpen(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'Tab') {
        setOpen(false);
      }
    };

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (triggerRef.current?.contains(e.target as Node)) return;
        if (menuRef.current?.contains(e.target as Node)) return;
        setOpen(false);
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuContent = (
      <DropdownContext.Provider value={{ close, onSelect }}>
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: placement === 'top' ? 8 : -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: placement === 'top' ? 8 : -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={clsx(
                'absolute z-[var(--z-dropdown)] min-w-[160px] max-w-[320px]',
                'bg-card border border-glass-border dark:border-glass-border-dark',
                'rounded-xl shadow-lg py-1.5',
                'focus:outline-none'
              )}
              role="menu"
              aria-orientation="vertical"
              aria-labelledby={dropdownId}
              tabIndex={-1}
              style={{
                width: width === 'trigger' ? undefined : typeof width === 'number' ? `${width}px` : width,
              }}
            >
              {React.Children.map(children, (child) => {
                if (!isValidElement(child)) return child;
                if (child.type === DropdownMenu) {
                  return React.cloneElement(child, { placement, width });
                }
                return child;
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </DropdownContext.Provider>
    );

    return (
      <DropdownContext.Provider value={{ close, onSelect }}>
        <Fragment>
          <button
            ref={triggerRef}
            id={dropdownId}
            type="button"
            onClick={openMenu}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={clsx('inline-flex items-center gap-2', className)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? dropdownId : undefined}
          >
            {trigger}
            <ChevronDown className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} />
          </button>
          {typeof window !== 'undefined' && createPortal(menuContent, document.body)}
        </Fragment>
      </DropdownContext.Provider>
    );
  }

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLButtonElement[]>([]);
  const dropdownId = useId();

  const close = () => setOpen(false);
  const openMenu = () => !disabled && setOpen(true);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    const enabledItems = (items || []).filter((i) => !i.disabled && !i.divider);
    const currentIndex = itemsRef.current.findIndex((el) => el === document.activeElement);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % enabledItems.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = enabledItems.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) {
          const item = enabledItems[currentIndex];
          onSelect?.(item.value, item);
          if (closeOnSelect) setOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
    }

    if (nextIndex !== currentIndex && nextIndex >= 0) {
      itemsRef.current[nextIndex]?.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groupedItems = (items || []).reduce((acc, item) => {
    const group = item.group || 'default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, DropdownItem[]>);

  const menuContent = (
    <DropdownContext.Provider value={{ close, onSelect }}>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: placement === 'top' ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: placement === 'top' ? 8 : -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={clsx(
              'absolute z-[var(--z-dropdown)] min-w-[160px] max-w-[320px]',
              'bg-card border border-glass-border dark:border-glass-border-dark',
              'rounded-xl shadow-lg py-1.5',
              'focus:outline-none'
            )}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby={dropdownId}
            tabIndex={-1}
            style={{
              width: width === 'trigger' ? undefined : typeof width === 'number' ? `${width}px` : width,
            }}
          >
            {Object.entries(groupedItems).map(([group, groupItems], groupIndex) => (
              <div key={group} className={groupIndex > 0 ? 'pt-1.5 border-t border-glass-border dark:border-glass-border-dark' : ''}>
                {group !== 'default' && (
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group}
                  </div>
                )}
                {groupItems.map((item, _index) => (
                  item.divider ? (
                    <div key={`${item.value}-divider`} className="h-px bg-glass-border dark:bg-glass-border-dark my-1" role="separator" />
                  ) : (
                    <button
                      key={item.value}
                      ref={(el) => { if (el) itemsRef.current.push(el); }}
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      disabled={item.disabled}
                      onClick={() => {
                        if (item.disabled) return;
                        onSelect?.(item.value, item);
                        if (closeOnSelect) setOpen(false);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2 text-sm',
                        'text-foreground hover:bg-surface transition-colors',
                        'focus:outline-none focus:bg-surface',
                        item.disabled && 'opacity-50 cursor-not-allowed',
                        item.danger && 'text-red-500 hover:bg-red-500/10'
                      )}
                      aria-disabled={item.disabled}
                    >
                      {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-xs font-mono text-muted-foreground bg-surface rounded">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </DropdownContext.Provider>
  );

  return (
    <DropdownContext.Provider value={{ close, onSelect }}>
      <Fragment>
        <button
          ref={triggerRef}
          id={dropdownId}
          type="button"
          onClick={openMenu}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={clsx('inline-flex items-center gap-2', className)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? dropdownId : undefined}
        >
          {trigger}
          <ChevronDown className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} />
        </button>
        {typeof window !== 'undefined' && createPortal(menuContent, document.body)}
      </Fragment>
    </DropdownContext.Provider>
  );
}

Dropdown.Root = DropdownRoot;
Dropdown.Trigger = DropdownTrigger;
Dropdown.Menu = DropdownMenu;
Dropdown.Group = DropdownGroup;
Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;

export default Dropdown;