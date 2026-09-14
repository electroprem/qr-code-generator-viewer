import { forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface SliderProps {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  marks?: SliderMark[];
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export interface SliderMark {
  value: number;
  label?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, min = 0, max = 100, step = 1, value, onChange, marks, showValue = true, valueFormatter, id, ...props }, ref) => {
    const sliderId = useId();
    const inputId = id || sliderId;
    const formattedValue = valueFormatter ? valueFormatter(value) : `${value}`;
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
              {label}
            </label>
            {showValue && (
              <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                {formattedValue}
              </span>
            )}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="range"
            id={inputId}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={clsx(
              'w-full h-2 bg-muted rounded-lg appearance-none accent-primary cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'transition-all duration-200'
            )}
            {...props}
          />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-lg pointer-events-none"
            style={{ width: `${percentage}%`, backgroundColor: 'var(--color-primary)' }}
          />
          {marks && marks.length > 0 && (
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-1 pointer-events-none">
              {marks.map((mark) => {
                const markPercentage = ((mark.value - min) / (max - min)) * 100;
                return (
                  <div
                    key={mark.value}
                    className="flex flex-col items-center"
                    style={{ left: `${markPercentage}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-1 h-1 bg-border rounded-full" />
                    {mark.label && (
                      <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">{mark.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export interface RangeSliderProps extends Omit<SliderProps, 'value' | 'onChange'> {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export const RangeSlider = forwardRef<HTMLDivElement, RangeSliderProps>(
  ({ className, label, min = 0, max = 100, step = 1, value, onChange, marks, showValue = true, valueFormatter, ...props }, ref) => {
    const [minVal, maxVal] = value;
    const minPercentage = ((minVal - min) / (max - min)) * 100;
    const maxPercentage = ((maxVal - min) / (max - min)) * 100;

    return (
      <div ref={ref} className={clsx('w-full relative', className)} {...props}>
        {label && (
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">{label}</label>
            {showValue && (
              <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                {valueFormatter ? `${valueFormatter(minVal)} - ${valueFormatter(maxVal)}` : `${minVal} - ${maxVal}`}
              </span>
            )}
          </div>
        )}
        <div className="relative h-6">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minVal}
            onChange={(e) => onChange([Math.min(Number(e.target.value), maxVal), maxVal])}
            className="absolute w-full h-2 top-1/2 -translate-y-1/2 bg-transparent appearance-none cursor-pointer pointer-events-none"
            style={{ zIndex: 2 }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxVal}
            onChange={(e) => onChange([minVal, Math.max(Number(e.target.value), minVal)])}
            className="absolute w-full h-2 top-1/2 -translate-y-1/2 bg-transparent appearance-none cursor-pointer pointer-events-none"
            style={{ zIndex: 3 }}
          />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-lg bg-muted pointer-events-none"
            style={{ width: '100%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 rounded-lg pointer-events-none"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
              backgroundColor: 'var(--color-primary)',
              zIndex: 1,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md pointer-events-none"
            style={{ left: `calc(${minPercentage}% - 8px)`, zIndex: 4 }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-md pointer-events-none"
            style={{ left: `calc(${maxPercentage}% - 8px)`, zIndex: 5 }}
          />
        </div>
        {marks && marks.length > 0 && (
          <div className="flex justify-between mt-2 px-1 text-xs text-muted-foreground">
            {marks.map((mark) => (
              <span key={mark.value} className="whitespace-nowrap">
                {mark.label || mark.value}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
);
RangeSlider.displayName = 'RangeSlider';