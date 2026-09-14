import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { generateCSSVariables } from '@lib/themes/tokens';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export { ThemeContext };

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    let resolved: 'light' | 'dark' = 'light';

    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = theme;
    }

    setResolvedTheme(resolved);
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    localStorage.setItem('theme', theme);

    const vars = generateCSSVariables(resolved);
    // Apply each CSS variable individually
    vars.replace(':root {', '').replace('}', '').split(';').forEach(line => {
      const [prop, value] = line.split(':').map(s => s.trim());
      if (prop && value) {
        root.style.setProperty(prop, value);
      }
    });
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(resolved);
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
        
        const vars = generateCSSVariables(resolved);
        vars.replace(':root {', '').replace('}', '').split(';').forEach(line => {
          const [prop, value] = line.split(':').map(s => s.trim());
          if (prop && value) {
            root.style.setProperty(prop, value);
          }
        });
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}