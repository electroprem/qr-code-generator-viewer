/**
 * Design tokens for QR Studio
 * Centralized design system values for colors, spacing, typography, etc.
 */

/**
 * Color palette for light and dark themes
 */
export const colors = {
  // Base colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Neutral grays (used for both themes)
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Primary brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Accent colors
  accent: {
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    amber: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    violet: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    rose: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },
  },

  // Semantic colors (light theme)
  light: {
    background: '#ffffff',
    surface: '#fafafa',
    surfaceElevated: '#ffffff',
    surfaceHover: '#f5f5f5',
    border: '#e5e5e5',
    borderStrong: '#d4d4d4',

    textPrimary: '#171717',
    textSecondary: '#525252',
    textMuted: '#737373',
    textInverse: '#ffffff',

    primary: '#0ea5e9',
    primaryHover: '#0284c7',
    primaryLight: '#e0f2fe',
    primaryText: '#0369a1',

    success: '#10b981',
    successLight: '#d1fae5',
    successText: '#065f46',

    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningText: '#92400e',

    error: '#f43f5e',
    errorLight: '#ffe4e6',
    errorText: '#9f123c',

    info: '#8b5cf6',
    infoLight: '#ede9fe',
    infoText: '#5b21b6',

    // Glassmorphism
    glassBg: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    glassShadow: 'rgba(0, 0, 0, 0.1)',

    // Focus ring
    focusRing: '#0ea5e9',
    focusRingOffset: '#ffffff',
  },

  // Semantic colors (dark theme)
  dark: {
    background: '#0a0a0a',
    surface: '#171717',
    surfaceElevated: '#262626',
    surfaceHover: '#262626',
    border: '#262626',
    borderStrong: '#404040',

    textPrimary: '#fafafa',
    textSecondary: '#d4d4d4',
    textMuted: '#a3a3a3',
    textInverse: '#0a0a0a',

    primary: '#38bdf8',
    primaryHover: '#7dd3fc',
    primaryLight: '#0c4a6e',
    primaryText: '#e0f2fe',

    success: '#34d399',
    successLight: '#064e3b',
    successText: '#d1fae5',

    warning: '#fbbf24',
    warningLight: '#78350f',
    warningText: '#fef3c7',

    error: '#fb7185',
    errorLight: '#881337',
    errorText: '#ffe4e6',

    info: '#a78bfa',
    infoLight: '#4c1d95',
    infoText: '#ede9fe',

    // Glassmorphism
    glassBg: 'rgba(23, 23, 23, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassShadow: 'rgba(0, 0, 0, 0.3)',

    // Focus ring
    focusRing: '#38bdf8',
    focusRingOffset: '#0a0a0a',
  },
} as const;

/**
 * Spacing scale (based on 4px unit)
 */
export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem',  // 8px
  3: '0.75rem', // 12px
  4: '1rem',    // 16px
  5: '1.25rem', // 20px
  6: '1.5rem',  // 24px
  7: '1.75rem', // 28px
  8: '2rem',    // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  14: '3.5rem', // 56px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
  24: '6rem',   // 96px
  28: '7rem',   // 112px
  32: '8rem',   // 128px
} as const;

/**
 * Border radius scale
 */
export const radius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

/**
 * Shadow scale
 */
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Colored shadows for elevated elements
  primary: '0 10px 40px -10px rgb(14 165 233 / 0.4)',
  success: '0 10px 40px -10px rgb(16 185 129 / 0.4)',
  warning: '0 10px 40px -10px rgb(245 158 11 / 0.4)',
  error: '0 10px 40px -10px rgb(244 63 94 / 0.4)',
} as const;

/**
 * Transition durations and easings
 */
export const transitions = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Spring-like
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

/**
 * Z-index scale
 */
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const;

/**
 * Glassmorphism values
 */
export const glassmorphism = {
  // Light theme glass
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(0, 0, 0, 0.08)',
    shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(12px) saturate(180%)',
  },
  // Dark theme glass
  dark: {
    background: 'rgba(23, 23, 23, 0.7)',
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(12px) saturate(180%)',
  },
  // Stronger glass for modals/cards
  strong: {
    light: {
      background: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(0, 0, 0, 0.1)',
      shadow: '0 16px 48px 0 rgba(0, 0, 0, 0.12)',
      backdropFilter: 'blur(20px) saturate(200%)',
    },
    dark: {
      background: 'rgba(23, 23, 23, 0.85)',
      border: 'rgba(255, 255, 255, 0.12)',
      shadow: '0 16px 48px 0 rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px) saturate(200%)',
    },
  },
} as const;

/**
 * Accent gradients for decorative elements
 */
export const accentGradients = {
  primary: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
  primaryHover: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  error: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
  info: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
  // Meshes
  mesh1: 'radial-gradient(ellipse at 50% 50%, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
  mesh2: 'radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
  mesh3: 'radial-gradient(ellipse at 20% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
} as const;

/**
 * Breakpoints for responsive design
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Typography scale
 */
export const typography = {
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    display: 'Plus Jakarta Sans, Inter, ui-sans-serif, system-ui, sans-serif',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.04em',
  },
} as const;

/**
 * Complete tokens object
 */
export const tokens = {
  colors,
  spacing,
  radius,
  shadows,
  transitions,
  zIndex,
  glassmorphism,
  accentGradients,
  breakpoints,
  typography,
} as const;

/**
 * Generate CSS custom properties (variables) from tokens
 * @param theme - 'light' | 'dark'
 * @returns CSS variable string
 */
export function generateCSSVariables(theme: 'light' | 'dark'): string {
  const t = theme === 'dark' ? colors.dark : colors.light;
  const glass = theme === 'dark' ? glassmorphism.dark : glassmorphism.light;

  const vars: string[] = [
    ':root {',
    // Base colors (matching globals.css convention)
    `  --background: ${t.background};`,
    `  --foreground: ${t.textPrimary};`,
    `  --card: ${t.surface};`,
    `  --card-foreground: ${t.textPrimary};`,
    `  --popover: ${t.surfaceElevated};`,
    `  --popover-foreground: ${t.textPrimary};`,
    `  --primary: ${t.primary};`,
    `  --primary-foreground: ${t.primaryText};`,
    `  --secondary: ${t.surfaceHover};`,
    `  --secondary-foreground: ${t.textPrimary};`,
    `  --muted: ${t.surfaceHover};`,
    `  --muted-foreground: ${t.textMuted};`,
    `  --accent: ${t.surfaceHover};`,
    `  --accent-foreground: ${t.textPrimary};`,
    `  --destructive: ${t.error};`,
    `  --destructive-foreground: ${t.errorText};`,
    `  --border: ${t.border};`,
    `  --input: ${t.border};`,
    `  --ring: ${t.focusRing};`,
    `  --radius: ${radius.md};`,
    // Glassmorphism
    `  --glass-bg: ${glass.background};`,
    `  --glass-border: ${glass.border};`,
    `  --glass-shadow: ${glass.shadow};`,
    `  --glass-backdrop: ${glass.backdropFilter};`,
    // Accent gradients
    `  --gradient-primary: ${accentGradients.primary};`,
    `  --gradient-success: ${accentGradients.success};`,
    `  --gradient-warning: ${accentGradients.warning};`,
    `  --gradient-error: ${accentGradients.error};`,
    `  --gradient-info: ${accentGradients.info};`,
    '}',
  ];

  return vars.join('\n');
}

/**
 * Generate complete CSS for both themes
 */
export function generateThemeCSS(): string {
  return `${generateCSSVariables('light')}

@media (prefers-color-scheme: dark) {
  ${generateCSSVariables('dark').replace(':root {', ':root {').replace('}', '}')}
}

.dark {
  ${generateCSSVariables('dark').replace(':root {', '').replace('}', '')}
}

.light {
  ${generateCSSVariables('light').replace(':root {', '').replace('}', '')}
}`;
}

export default tokens;