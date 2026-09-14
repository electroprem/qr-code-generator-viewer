import React, { useState, useRef, useEffect, useContext, createContext, ReactNode, KeyboardEvent, forwardRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
  variant?: 'line' | 'enclosed' | 'soft';
  orientation?: 'horizontal' | 'vertical';
  defaultValue?: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within Tabs.Root');
  }
  return context;
}

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  variant?: 'line' | 'enclosed' | 'soft';
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const TabsRoot = forwardRef<HTMLDivElement, TabsProps>(
  ({ value, defaultValue, onChange, onValueChange, children, variant = 'line', className, orientation = 'horizontal', ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const controlled = value !== undefined;
    const currentValue = controlled ? value : internalValue;
    const handleChange = useCallback((newValue: string) => {
      if (!controlled) setInternalValue(newValue);
      onChange?.(newValue);
      onValueChange?.(newValue);
    }, [controlled, onChange, onValueChange]);

    const indicatorRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
    const tabsListRef = useRef<HTMLDivElement>(null);

    const updateIndicator = () => {
      const activeTab = tabsRef.current.find((tab) => tab?.dataset.value === currentValue);
      if (activeTab && indicatorRef.current && tabsListRef.current) {
        if (orientation === 'horizontal') {
          setIndicatorStyle({
            width: activeTab.offsetWidth,
            left: activeTab.offsetLeft,
          });
        } else {
          setIndicatorStyle({
            height: activeTab.offsetHeight,
            top: activeTab.offsetTop,
          });
        }
      }
    };

    useEffect(() => {
      updateIndicator();
      window.addEventListener('resize', updateIndicator);
      return () => window.removeEventListener('resize', updateIndicator);
    }, [currentValue]);

    const variantStyles = {
      line: {
        container: 'relative',
        trigger: 'relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg',
        activeTrigger: 'text-foreground',
        indicator: 'absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-200 ease-out',
      },
      enclosed: {
        container: 'relative bg-muted p-1 rounded-xl',
        trigger: 'relative px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary rounded-md',
        activeTrigger: 'text-primary-foreground bg-primary shadow-sm',
        indicator: 'absolute inset-0 bg-primary rounded-md shadow-sm transition-all duration-200 ease-out opacity-0',
      },
      soft: {
        container: 'relative',
        trigger: 'relative px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg',
        activeTrigger: 'bg-accent text-accent-foreground',
        indicator: 'absolute bottom-0 h-0.5 bg-transparent transition-all duration-200 ease-out',
      },
    };

    const styles = variantStyles[variant];

    return (
      <TabsContext.Provider value={{ value: currentValue, onChange: handleChange, variant, orientation }}>
        <div ref={ref} className={clsx(styles.container, className)} role="tablist" aria-orientation={orientation} {...props}>
          <div
            ref={tabsListRef}
            className="flex gap-1"
            role="presentation"
          >
            {React.Children.map(children, (child) => {
              if (!React.isValidElement(child)) return null;
              if (child.type === TabsList) {
                return React.cloneElement(child, { tabsRef, indicatorRef, indicatorStyle, styles, value: currentValue, onChange: handleChange, orientation });
              }
              return child;
            })}
          </div>
          <div className="mt-4">
            {React.Children.map(children, (child) => {
              if (!React.isValidElement(child)) return null;
              if (child.type === TabsContent) {
                return React.cloneElement(child, { value: currentValue });
              }
              return child;
            })}
          </div>
        </div>
      </TabsContext.Provider>
    );
  }
);
TabsRoot.displayName = 'TabsRoot';

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className, ...props }, ref) => {
    const { variant, orientation, value, onChange } = useTabsContext();
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
    const tabsListRef = useRef<HTMLDivElement>(null);

    const variantStyles = {
      line: {
        trigger: 'relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg',
        activeTrigger: 'text-foreground',
        indicator: 'absolute bottom-0 h-0.5 bg-primary rounded-full transition-all duration-200 ease-out',
      },
      enclosed: {
        trigger: 'relative px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary rounded-md',
        activeTrigger: 'text-primary-foreground bg-primary shadow-sm',
        indicator: 'absolute inset-0 bg-primary rounded-md shadow-sm transition-all duration-200 ease-out opacity-0',
      },
      soft: {
        trigger: 'relative px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg',
        activeTrigger: 'bg-accent text-accent-foreground',
        indicator: 'absolute bottom-0 h-0.5 bg-transparent transition-all duration-200 ease-out',
      },
    };

    const styles = variantStyles[variant || 'line'];

    const tabs: TabItem[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && (child.type === TabsTrigger || (typeof child.type !== 'string' && (child.type as any).displayName === 'TabsTrigger'))) {
        tabs.push({
          value: child.props.value,
          label: child.props.children as string,
          icon: child.props.icon,
          disabled: child.props.disabled,
          badge: child.props.badge,
        });
      }
    });

    const updateIndicator = () => {
      const activeTab = tabsRef.current.find((tab) => tab?.dataset.value === value);
      if (activeTab && indicatorRef.current && tabsListRef.current) {
        if (orientation === 'horizontal') {
          setIndicatorStyle({
            width: activeTab.offsetWidth,
            left: activeTab.offsetLeft,
          });
        } else {
          setIndicatorStyle({
            height: activeTab.offsetHeight,
            top: activeTab.offsetTop,
          });
        }
      }
    };

    useEffect(() => {
      updateIndicator();
      window.addEventListener('resize', updateIndicator);
      return () => window.removeEventListener('resize', updateIndicator);
    }, [value, tabs]);

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let newIndex = index;
      const enabledTabs = tabs.filter((t) => !t.disabled);

      if (orientation === 'horizontal') {
        if (e.key === 'ArrowRight') newIndex = (index + 1) % tabs.length;
        if (e.key === 'ArrowLeft') newIndex = (index - 1 + tabs.length) % tabs.length;
      } else {
        if (e.key === 'ArrowDown') newIndex = (index + 1) % tabs.length;
        if (e.key === 'ArrowUp') newIndex = (index - 1 + tabs.length) % tabs.length;
      }
      if (e.key === 'Home') newIndex = 0;
      if (e.key === 'End') newIndex = tabs.length - 1;

      const targetTab = enabledTabs.find((_, i) => i === newIndex) || tabs[newIndex];
      if (targetTab && !targetTab.disabled) {
        e.preventDefault();
        onChange(targetTab.value);
        tabsRef.current[newIndex]?.focus();
      }
    };

    return (
      <div ref={ref} className={clsx('flex gap-1', className)} role="presentation" {...props}>
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null;
          if (child.type === TabsTrigger) {
            return React.cloneElement(child, {
              tabsRef,
              styles,
              value,
              onChange,
              orientation,
              handleKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => handleKeyDown(e, index),
              index,
            });
          }
          return child;
        })}
        {variant !== 'soft' && (
          <AnimatePresence mode="wait">
            <motion.div
              ref={indicatorRef}
              className={styles.indicator}
              style={indicatorStyle}
              initial={false}
              animate={indicatorStyle as any}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </AnimatePresence>
        )}
      </div>
    );
  }
);
TabsList.displayName = 'TabsList';

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
  className?: string;
  tabsRef?: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  styles?: any;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  handleKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
  index?: number;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, icon, disabled, badge, tabsRef, styles, value: contextValue, onChange, orientation, handleKeyDown, index, className, ...props }, _ref) => {
    const isActive = contextValue === value;
    return (
      <motion.button
        ref={(el) => { if (tabsRef && index !== undefined) tabsRef.current[index] = el; }}
        role="tab"
        aria-selected={isActive}
        aria-controls={`panel-${value}`}
        id={`tab-${value}`}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(value)}
        onKeyDown={handleKeyDown}
        className={clsx(
          styles?.trigger,
          isActive && styles?.activeTrigger,
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        data-value={value}
        whileTap={{ scale: 0.98 }}
        initial={false}
        {...props}
      >
        {icon && <span className="inline-flex items-center gap-2">{icon}</span>}
        {children}
        {badge && (
          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
            {badge}
          </span>
        )}
      </motion.button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, children, className, ...props }, ref) => {
    const { value: contextValue } = useTabsContext();
    const isActive = contextValue === value;

    return (
      <motion.div
        ref={ref}
        role="tabpanel"
        id={`panel-${value}`}
        aria-labelledby={`tab-${value}`}
        hidden={!isActive}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={clsx('focus:outline-none', className)}
        {...props}
      >
        {isActive && children}
      </motion.div>
    );
  }
);
TabsContent.displayName = 'TabsContent';

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
  TabList: TabsList,
  TabTrigger: TabsTrigger,
  TabContent: TabsContent,
});

// Named exports for direct import
export { TabsList as TabList, TabsTrigger as TabTrigger, TabsContent as TabContent };