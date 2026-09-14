import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Monitor,
  Sun,
  Moon,
  Palette,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Minimize2,
  Maximize2,
  Contrast,
  Zap,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Slider } from '@components/ui/Slider';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { ColorPicker } from '@components/ui/ColorPicker';
import { useTheme } from '@components/providers/ThemeProvider';
import { useToast } from '@components/providers/ToastProvider';
import { useQRStore } from '@store/qrStore';

interface AppearanceSectionProps {
  className?: string;
}

export function AppearanceSection({ className }: AppearanceSectionProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { showToast } = useToast();
  const { currentSettings, setSettings } = useQRStore();
  const [glassmorphism, setGlassmorphism] = useState(0.8);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable');
  const [highContrast, setHighContrast] = useState(false);
  const [accentColor, setAccentColor] = useState('#3b82f6');

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Match system preference' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('appearance-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGlassmorphism(parsed.glassmorphism ?? 0.8);
        setReducedMotion(parsed.reducedMotion ?? false);
        setDensity(parsed.density ?? 'comfortable');
        setHighContrast(parsed.highContrast ?? false);
        setAccentColor(parsed.accentColor ?? '#3b82f6');
      } catch {}
    }
  }, []);

  useEffect(() => {
    const settings = {
      glassmorphism,
      reducedMotion,
      density,
      highContrast,
      accentColor,
    };
    localStorage.setItem('appearance-settings', JSON.stringify(settings));
    
    document.documentElement.style.setProperty('--glass-opacity', glassmorphism.toString());
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--density', density);
    
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [glassmorphism, reducedMotion, density, highContrast, accentColor]);

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-6', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Appearance
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Customize how QR Studio looks and feels</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={clsx(
                    'relative p-4 rounded-xl border-2 transition-all duration-200 text-left',
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50 hover:bg-surface'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={clsx('w-6 h-6', isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  {isActive && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <label className="block text-sm font-medium text-foreground mb-3">Accent Color</label>
          <div className="flex items-center gap-4 flex-wrap">
            <ColorPicker
              value={accentColor}
              onChange={setAccentColor}
              className="w-12 h-12 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
            />
            <Input
              type="text"
              value={accentColor}
              onChange={(e) => {
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setAccentColor(e.target.value);
              }}
              placeholder="#3b82f6"
              className="w-32 font-mono text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              {['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'].map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={clsx(
                    'w-8 h-8 rounded-lg border-2 transition-all',
                    accentColor === color ? 'border-primary scale-110' : 'border-transparent hover:border-glass-border'
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Accent color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <label className="block text-sm font-medium text-foreground mb-3 flex items-center justify-between">
            <span>Glassmorphism Intensity</span>
            <Badge variant="outline">{Math.round(glassmorphism * 100)}%</Badge>
          </label>
          <Slider
            value={[glassmorphism]}
            onValueChange={([v]) => setGlassmorphism(v)}
            min={0}
            max={1}
            step={0.05}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">Controls backdrop blur and transparency of glass cards</p>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <label className="block text-sm font-medium text-foreground mb-3 flex items-center justify-between">
            <span>UI Density</span>
            <Badge variant="outline">{density.charAt(0).toUpperCase() + density.slice(1)}</Badge>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['comfortable', 'compact', 'spacious'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={clsx(
                  'p-3 rounded-xl border-2 transition-all text-left',
                  density === d
                    ? 'border-primary bg-primary/10'
                    : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50'
                )}
              >
                <p className="font-medium text-foreground capitalize">{d}</p>
                <p className="text-xs text-muted-foreground">
                  {d === 'comfortable' ? 'Default spacing' : d === 'compact' ? 'Tighter spacing' : 'More breathing room'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Accessibility
          </h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Contrast className="w-4 h-4" />
                    High Contrast
                  </p>
                  <p className="text-xs text-muted-foreground">Increase color contrast for better visibility</p>
                </div>
              </div>
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Minimize2 className="w-4 h-4" />
                    Reduce Motion
                  </p>
                  <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Advanced
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Custom CSS Variable</label>
              <Input
                placeholder="--custom-color: #ff0000"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Font Scale</label>
              <Input
                type="number"
                min="0.8"
                max="1.5"
                step="0.05"
                defaultValue={1}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Check } from 'lucide-react';