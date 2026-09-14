import { useContext } from 'react';
import { ThemeContext, Theme } from '../components/providers/ThemeProvider';

/**
 * Theme mode type
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Resolved theme type
 */
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

/**
 * Hook for accessing theme context
 * Must be used within ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext) as ThemeContextValue | undefined;
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  const { theme, resolvedTheme, setTheme } = context;

  /**
   * Toggle between light and dark (skips system)
   */
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  /**
   * Set theme with validation
   */
  const setThemeSafe = (newTheme: ThemeMode) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme as Theme);
    } else {
      console.warn(`Invalid theme mode: ${newTheme}`);
    }
  };

  return {
    /** Current theme setting ('light' | 'dark' | 'system') */
    theme,
    /** Actually resolved theme ('light' | 'dark') */
    resolvedTheme,
    /** Set theme mode */
    setTheme: setThemeSafe,
    /** Toggle between light/dark */
    toggleTheme,
    /** Check if dark mode is active */
    isDark: resolvedTheme === 'dark',
    /** Check if light mode is active */
    isLight: resolvedTheme === 'light',
    /** Check if system mode is active */
    isSystem: theme === 'system',
  };
}

/**
 * Hook for getting theme-aware values
 * @param lightValue - Value for light theme
 * @param darkValue - Value for dark theme
 * @returns Resolved value based on current theme
 */
export function useThemeValue<T>(lightValue: T, darkValue: T): T {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? darkValue : lightValue;
}

/**
 * Hook for theme-aware class names
 * @param lightClasses - Classes for light theme
 * @param darkClasses - Classes for dark theme
 * @returns Resolved class string
 */
export function useThemeClasses(lightClasses: string, darkClasses: string): string {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark' ? darkClasses : lightClasses;
}

/**
 * Hook for CSS-in-JS theme values
 * Returns object with theme-aware values
 */
export function useThemeColors() {
  const { resolvedTheme } = useTheme();

  return {
    // Backgrounds
    bg: resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff',
    bgSurface: resolvedTheme === 'dark' ? '#171717' : '#fafafa',
    bgElevated: resolvedTheme === 'dark' ? '#262626' : '#ffffff',
    bgHover: resolvedTheme === 'dark' ? '#262626' : '#f5f5f5',

    // Borders
    border: resolvedTheme === 'dark' ? '#262626' : '#e5e5e5',
    borderStrong: resolvedTheme === 'dark' ? '#404040' : '#d4d4d4',

    // Text
    textPrimary: resolvedTheme === 'dark' ? '#fafafa' : '#171717',
    textSecondary: resolvedTheme === 'dark' ? '#d4d4d4' : '#525252',
    textMuted: resolvedTheme === 'dark' ? '#a3a3a3' : '#737373',
    textInverse: resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff',

    // Primary
    primary: resolvedTheme === 'dark' ? '#38bdf8' : '#0ea5e9',
    primaryHover: resolvedTheme === 'dark' ? '#7dd3fc' : '#0284c7',
    primaryLight: resolvedTheme === 'dark' ? '#0c4a6e' : '#e0f2fe',
    primaryText: resolvedTheme === 'dark' ? '#e0f2fe' : '#0369a1',

    // Semantic
    success: '#10b981',
    successLight: resolvedTheme === 'dark' ? '#064e3b' : '#d1fae5',
    successText: resolvedTheme === 'dark' ? '#d1fae5' : '#065f46',

    warning: '#f59e0b',
    warningLight: resolvedTheme === 'dark' ? '#78350f' : '#fef3c7',
    warningText: resolvedTheme === 'dark' ? '#fef3c7' : '#92400e',

    error: '#f43f5e',
    errorLight: resolvedTheme === 'dark' ? '#881337' : '#ffe4e6',
    errorText: resolvedTheme === 'dark' ? '#ffe4e6' : '#9f123c',

    info: '#8b5cf6',
    infoLight: resolvedTheme === 'dark' ? '#4c1d95' : '#ede9fe',
    infoText: resolvedTheme === 'dark' ? '#ede9fe' : '#5b21b6',

    // Glassmorphism
    glassBg: resolvedTheme === 'dark' ? 'rgba(23, 23, 23, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    glassBorder: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    glassShadow: resolvedTheme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',

    // Focus
    focusRing: resolvedTheme === 'dark' ? '#38bdf8' : '#0ea5e9',
    focusRingOffset: resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff',
  };
}

export default useTheme;