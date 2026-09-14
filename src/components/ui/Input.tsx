import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'ref'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  icon?: ReactNode;
  id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const iconLeft = leftIcon ?? icon;
    const iconRight = rightIcon;
    const hasIconLeft = !!iconLeft;
    const hasIconRight = !!iconRight;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {hasIconLeft && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full px-4 py-2.5 rounded-xl border bg-background/50 backdrop-blur-sm',
              'text-foreground placeholder:text-muted-foreground/50',
              'border-glass-border dark:border-glass-border-dark',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              hasIconLeft && 'pl-10',
              hasIconRight && 'pr-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {hasIconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-500" role="alert">{error}</p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'ref'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  id?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasIconLeft = !!leftIcon;
    const hasIconRight = !!rightIcon;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {hasIconLeft && (
            <div className="absolute left-3 top-3 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <textarea
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full px-4 py-2.5 rounded-xl border bg-background/50 backdrop-blur-sm',
              'text-foreground placeholder:text-muted-foreground/50',
              'border-glass-border dark:border-glass-border-dark',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200 resize-y min-h-[80px]',
              hasIconLeft && 'pl-10',
              hasIconRight && 'pr-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {hasIconRight && (
            <div className="absolute right-3 top-3 text-muted-foreground pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-500" role="alert">{error}</p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  value: string;
  onChange: (value: any, event?: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  leftIcon?: ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, value, onChange, disabled, leftIcon, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const groupedOptions = options.reduce((acc, opt) => {
      const group = opt.group || 'default';
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {} as Record<string, SelectOption[]>);
    const hasIconLeft = !!leftIcon;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {hasIconLeft && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={clsx(
              'w-full px-4 py-2.5 rounded-xl border bg-background/50 backdrop-blur-sm',
              'text-foreground',
              'border-glass-border dark:border-glass-border-dark',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200 appearance-none',
              hasIconLeft && 'pl-10',
              'pr-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {Object.entries(groupedOptions).map(([group, opts]) => (
              <optgroup key={group} label={group !== 'default' ? group : ''}>
                {opts.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-500" role="alert">{error}</p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';