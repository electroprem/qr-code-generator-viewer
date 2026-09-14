// QR Hooks
export * from './useQR';
export { useQR, useQRBatch } from './useQR';

// LocalStorage Hooks
export * from './useLocalStorage';
export { useLocalStorage, useLocalStorageCustom, useSessionStorage, useLocalStorageObject } from './useLocalStorage';

// Toast Hook
export * from './useToast';
export { useToast } from './useToast';
export type { ToastType, ToastOptions } from './useToast';

// Keyboard Hooks
export * from './useKeyboard';
export { useKeyboardShortcuts, useShortcut, useGlobalKeyboard, useKeyCombo, commonShortcuts } from './useKeyboard';
export type { KeyboardShortcut } from './useKeyboard';

// Theme Hook
export * from './useTheme';
export { useTheme, useThemeValue, useThemeClasses, useThemeColors } from './useTheme';
export type { ThemeMode, ResolvedTheme } from './useTheme';