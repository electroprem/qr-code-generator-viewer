import { forwardRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';

export interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  showAlpha?: boolean;
  showInput?: boolean;
  showEyedropper?: boolean;
  id?: string;
  className?: string;
}

const DEFAULT_PRESETS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
  '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, label, value, onChange, presets = DEFAULT_PRESETS, showAlpha = false, showInput = true, showEyedropper = true, id }, _ref) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const pickerId = id || `color-picker-${Math.random().toString(36).slice(2)}`;

    useEffect(() => {
      setInputValue(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (/^#[0-9A-Fa-f]{6}$/.test(newValue) || /^#[0-9A-Fa-f]{8}$/.test(newValue)) {
        onChange(newValue);
      }
    };

    const handlePresetClick = (color: string) => {
      setInputValue(color);
      onChange(color);
      setOpen(false);
    };

    const handleEyedropper = async () => {
      if (!('EyeDropper' in window)) return;
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        const color = result.sRGBHex;
        setInputValue(color);
        onChange(color);
        setOpen(false);
      } catch (err) {
        console.warn('EyeDropper cancelled or failed:', err);
      }
    };

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label htmlFor={pickerId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type="color"
            id={pickerId}
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              setInputValue(newValue);
              onChange(newValue);
              setOpen(false);
            }}
            className="absolute inset-0 w-full h-10 opacity-0 cursor-pointer"
            aria-label={label || 'Color picker'}
          />
          <button
            type="button"
            id={`${pickerId}-input`}
            onClick={() => setOpen(!open)}
            className={clsx(
              'relative w-full h-10 rounded-xl border border-glass-border dark:border-glass-border-dark',
              'bg-background/50 backdrop-blur-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-all duration-200',
              showInput && 'pr-28',
              'overflow-hidden'
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={label || 'Color picker'}
          >
            <div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: value }}
            />
            {showAlpha && (
              <div className="absolute inset-0 rounded-xl bg-[linear-gradient(90deg,transparent_50%,#fff_50%)]" />
            )}
            <div className="relative z-10 flex items-center justify-between px-3">
              <span className="text-sm font-mono text-foreground/80">
                {inputValue.toUpperCase()}
              </span>
              <div className="flex items-center gap-1">
                {showEyedropper && (
                  <button
                    type="button"
                    onClick={handleEyedropper}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                    aria-label="Pick color from screen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute z-50 mt-1.5 w-full max-w-xs"
              role="dialog"
              aria-label="Color presets"
            >
              <div className="bg-card border border-glass-border dark:border-glass-border-dark rounded-xl shadow-lg p-3">
                {showInput && (
                  <div className="mb-3">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={handleInputChange}
                      placeholder="#RRGGBB"
                      className="w-full px-3 py-2 rounded-lg border border-glass-border dark:border-glass-border-dark bg-background text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Hex color value"
                    />
                  </div>
                )}
                <div className="grid grid-cols-8 gap-1.5 mb-3">
                  {presets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handlePresetClick(color)}
                      className={clsx(
                        'w-full aspect-square rounded-lg border-2 transition-all duration-150',
                        'hover:scale-110 hover:border-primary',
                        value.toLowerCase() === color.toLowerCase() && 'border-primary scale-110',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                      aria-pressed={value.toLowerCase() === color.toLowerCase()}
                    />
                  ))}
                </div>
                {showEyedropper && (
                  <button
                    type="button"
                    onClick={handleEyedropper}
                    className="w-full py-2 rounded-lg text-sm font-medium text-foreground bg-surface hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Pick from screen
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
ColorPicker.displayName = 'ColorPicker';

export interface ColorSwatchProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  selected?: boolean;
  label?: string;
}

export const ColorSwatch = forwardRef<HTMLButtonElement, ColorSwatchProps>(
  ({ color, size = 'md', onClick, selected, label, ...props }, ref) => {
    const sizes = {
      sm: 'w-6 h-6',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={clsx(
          sizes[size],
          'rounded-lg border-2 transition-all duration-150',
          'hover:scale-110',
          selected && 'border-primary scale-110',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
        style={{ backgroundColor: color }}
        aria-label={label || color}
        aria-pressed={selected}
        {...props}
      />
    );
  }
);
ColorSwatch.displayName = 'ColorSwatch';