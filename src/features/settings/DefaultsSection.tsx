import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Settings,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Shield,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Slider } from '@components/ui/Slider';
import { Badge } from '@components/ui/Badge';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { useQRStore } from '@store/qrStore';
import { useToast } from '@components/providers/ToastProvider';

interface DefaultsSectionProps {
  className?: string;
}

const DOT_STYLES = [
  { value: 'square', label: 'Square', icon: Square },
  { value: 'dots', label: 'Dots', icon: Circle },
  { value: 'rounded', label: 'Rounded', icon: Square },
  { value: 'classy', label: 'Classy', icon: Triangle },
  { value: 'classy-rounded', label: 'Classy Rounded', icon: Hexagon },
  { value: 'extra-rounded', label: 'Extra Rounded', icon: Circle },
] as const;

const CORNER_STYLES = [
  { value: 'square', label: 'Square', icon: Square },
  { value: 'dot', label: 'Dot', icon: Circle },
  { value: 'extra-rounded', label: 'Extra Rounded', icon: Hexagon },
] as const;

const ERROR_CORRECTION_LEVELS = [
  { value: 'L', label: 'Low (7%)', description: 'Least error correction' },
  { value: 'M', label: 'Medium (15%)', description: 'Balanced (recommended)' },
  { value: 'Q', label: 'Quartile (25%)', description: 'High error correction' },
  { value: 'H', label: 'High (30%)', description: 'Maximum error correction' },
] as const;

export function DefaultsSection({ className }: DefaultsSectionProps) {
  const { currentSettings, setSettings, resetSettings } = useQRStore();
  const { showToast } = useToast();
  const [dotStyle, setDotStyle] = useState(currentSettings.dotsOptions?.type || 'square');
  const [cornerStyle, setCornerStyle] = useState(currentSettings.cornersSquareOptions?.type || 'square');
  const [cornerDotStyle, setCornerDotStyle] = useState(currentSettings.cornersDotOptions?.type || 'square');
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColors, setGradientColors] = useState(['#3b82f6', '#8b5cf6']);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientRotation, setGradientRotation] = useState(0);
  const [logoEnabled, setLogoEnabled] = useState(false);
  const [logoImage, setLogoImage] = useState<string>('');
  const [logoSize, setLogoSize] = useState(0.2);
  const [logoOpacity, setLogoOpacity] = useState(1);

  useEffect(() => {
    if (currentSettings.dotsOptions?.type) setDotStyle(currentSettings.dotsOptions.type);
    if (currentSettings.cornersSquareOptions?.type) setCornerStyle(currentSettings.cornersSquareOptions.type);
    if (currentSettings.cornersDotOptions?.type) setCornerDotStyle(currentSettings.cornersDotOptions.type);
    if (currentSettings.dotsOptions?.color) setForegroundColor(currentSettings.dotsOptions.color);
    if (currentSettings.backgroundOptions?.color) setBackgroundColor(currentSettings.backgroundOptions.color);
    if (currentSettings.dotsOptions?.gradient) {
      setGradientEnabled(true);
      setGradientColors(currentSettings.dotsOptions.gradient.colorStops.map((s) => s.color));
      setGradientType(currentSettings.dotsOptions.gradient.type);
      setGradientRotation(currentSettings.dotsOptions.gradient.rotation || 0);
    }
    if (currentSettings.imageOptions?.image) {
      setLogoEnabled(true);
      setLogoImage(currentSettings.imageOptions.image as string);
      setLogoSize(currentSettings.imageOptions.imageSize || 0.2);
    }
  }, [currentSettings]);

  const updateSettings = useCallback((newSettings: Partial<typeof currentSettings>) => {
    setSettings(newSettings);
  }, [setSettings]);

  const handleDotStyleChange = useCallback((style: string) => {
    setDotStyle(style);
    updateSettings({
      dotsOptions: { ...currentSettings.dotsOptions, type: style as any },
    });
  }, [currentSettings.dotsOptions, updateSettings]);

  const handleCornerStyleChange = useCallback((style: string) => {
    setCornerStyle(style);
    updateSettings({
      cornersSquareOptions: { ...currentSettings.cornersSquareOptions, type: style as any },
    });
  }, [currentSettings.cornersSquareOptions, updateSettings]);

  const handleCornerDotStyleChange = useCallback((style: string) => {
    setCornerDotStyle(style);
    updateSettings({
      cornersDotOptions: { ...currentSettings.cornersDotOptions, type: style as any },
    });
  }, [currentSettings.cornersDotOptions, updateSettings]);

  const handleForegroundChange = useCallback((color: string) => {
    setForegroundColor(color);
    updateSettings({
      dotsOptions: { ...currentSettings.dotsOptions, color, gradient: undefined },
    });
    setGradientEnabled(false);
  }, [currentSettings.dotsOptions, updateSettings]);

  const handleBackgroundChange = useCallback((color: string) => {
    setBackgroundColor(color);
    updateSettings({
      backgroundOptions: { ...currentSettings.backgroundOptions, color, gradient: undefined },
    });
  }, [currentSettings.backgroundOptions, updateSettings]);

  const handleReset = useCallback(() => {
    if (confirm('Reset all generation defaults to factory settings?')) {
      resetSettings();
      setDotStyle('square');
      setCornerStyle('square');
      setCornerDotStyle('square');
      setForegroundColor('#000000');
      setBackgroundColor('#ffffff');
      setGradientEnabled(false);
      setGradientColors(['#3b82f6', '#8b5cf6']);
      setGradientType('linear');
      setGradientRotation(0);
      setLogoEnabled(false);
      setLogoImage('');
      setLogoSize(0.2);
      setLogoOpacity(1);
      showToast({ type: 'success', title: 'Defaults reset' });
    }
  }, [resetSettings, showToast]);

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-6', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Generation Defaults
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Default values applied to all new QR codes</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Default Size (px)</label>
            <Input
              type="number"
              min="100"
              max="2000"
              step="50"
              value={currentSettings.width}
              onChange={(e) => updateSettings({ width: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Height (px)</label>
            <Input
              type="number"
              min="100"
              max="2000"
              step="50"
              value={currentSettings.height}
              onChange={(e) => updateSettings({ height: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Margin (px)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step={4}
              value={currentSettings.margin}
              onChange={(e) => updateSettings({ margin: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">QR Version</label>
            <Input
              type="number"
              min="1"
              max="40"
              step={1}
              value={currentSettings.version || 0}
              onChange={(e) => updateSettings({ version: Number(e.target.value) || undefined })}
              placeholder="Auto"
              className="w-full"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Error Correction</label>
            <Dropdown>
              <DropdownTrigger>
                <Button variant="outline" className="w-full justify-between">
                  {ERROR_CORRECTION_LEVELS.find((e) => e.value === currentSettings.errorCorrectionLevel)?.label || 'Medium (15%)'}
                </Button>
              </DropdownTrigger>
              <div className="dropdown-menu dropdown-menu-end">
                {ERROR_CORRECTION_LEVELS.map((e) => (
                  <DropdownItem
                    key={e.value}
                    onClick={() => updateSettings({ errorCorrectionLevel: e.value as any })}
                    className={clsx(currentSettings.errorCorrectionLevel === e.value && 'bg-primary/10')}
                  >
                    {currentSettings.errorCorrectionLevel === e.value && <Check className="w-4 h-4 text-primary" />}
                    <div>
                      <p className="font-medium">{e.label}</p>
                      <p className="text-xs text-muted-foreground">{e.description}</p>
                    </div>
                  </DropdownItem>
                ))}
              </div>
            </Dropdown>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Mode</label>
            <select
              value={currentSettings.mode || 'default'}
              onChange={(e) => updateSettings({ mode: e.target.value })}
              className="input-base w-full"
            >
              <option value="default">Default</option>
              <option value="numeric">Numeric</option>
              <option value="alphanumeric">Alphanumeric</option>
              <option value="byte">Byte</option>
              <option value="kanji">Kanji</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Square className="w-5 h-5" />
            Dot Style
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {DOT_STYLES.map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.value}
                  onClick={() => handleDotStyleChange(style.value)}
                  className={clsx(
                    'p-3 rounded-xl border-2 transition-all text-center',
                    dotStyle === style.value
                      ? 'border-primary bg-primary/10'
                      : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50'
                  )}
                >
                  <Icon className={clsx('w-6 h-6 mx-auto mb-1', dotStyle === style.value ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-xs font-medium">{style.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Triangle className="w-5 h-5" />
            Corner Style
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {CORNER_STYLES.map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.value}
                  onClick={() => handleCornerStyleChange(style.value)}
                  className={clsx(
                    'p-3 rounded-xl border-2 transition-all text-center',
                    cornerStyle === style.value
                      ? 'border-primary bg-primary/10'
                      : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50'
                  )}
                >
                  <Icon className={clsx('w-6 h-6 mx-auto mb-1', cornerStyle === style.value ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-xs font-medium">{style.label}</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Corner square style (finder patterns)</p>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Circle className="w-5 h-5" />
            Corner Dot Style
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {CORNER_STYLES.map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.value}
                  onClick={() => handleCornerDotStyleChange(style.value)}
                  className={clsx(
                    'p-3 rounded-xl border-2 transition-all text-center',
                    cornerDotStyle === style.value
                      ? 'border-primary bg-primary/10'
                      : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50'
                  )}
                >
                  <Icon className={clsx('w-6 h-6 mx-auto mb-1', cornerDotStyle === style.value ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-xs font-medium">{style.label}</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Corner dot style (inner dots of finder patterns)</p>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Circle className="w-5 h-5 text-primary" />
            Colors
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Foreground Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => handleForegroundChange(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
                />
                <Input
                  type="text"
                  value={foregroundColor}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) handleForegroundChange(e.target.value);
                  }}
                  placeholder="#000000"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => handleBackgroundChange(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) handleBackgroundChange(e.target.value);
                  }}
                  placeholder="#ffffff"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={gradientEnabled}
                onChange={(e) => setGradientEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-foreground">Gradient Foreground</p>
                <p className="text-xs text-muted-foreground">Apply gradient to QR code modules</p>
              </div>
            </label>
          </div>

          {gradientEnabled && (
            <div className="space-y-4 pl-7 border-l-2 border-glass-border dark:border-glass-border-dark">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Start Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={gradientColors[0]}
                      onChange={(e) => setGradientColors([e.target.value, gradientColors[1]])}
                      className="w-10 h-10 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={gradientColors[0]}
                      onChange={(e) => {
                        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setGradientColors([e.target.value, gradientColors[1]]);
                      }}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">End Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={gradientColors[1]}
                      onChange={(e) => setGradientColors([gradientColors[0], e.target.value])}
                      className="w-10 h-10 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={gradientColors[1]}
                      onChange={(e) => {
                        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setGradientColors([gradientColors[0], e.target.value]);
                      }}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                  <select
                    value={gradientType}
                    onChange={(e) => setGradientType(e.target.value as any)}
                    className="input-base w-full"
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center justify-between">
                  Rotation: {gradientRotation}°
                </label>
                <Slider
                  value={[gradientRotation]}
                  onValueChange={([v]) => setGradientRotation(v)}
                  min={0}
                  max={360}
                  step={15}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Logo / Image
          </h4>
          <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={logoEnabled}
              onChange={(e) => setLogoEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-foreground">Add logo/image to center</p>
              <p className="text-xs text-muted-foreground">Automatically upgrades error correction to H</p>
            </div>
          </label>

          {logoEnabled && (
            <div className="space-y-4 pl-7 border-l-2 border-glass-border dark:border-glass-border-dark">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Image URL or Data URL</label>
                <Input
                  value={logoImage}
                  onChange={(e) => {
                    setLogoImage(e.target.value);
                    updateSettings({
                      imageOptions: { ...currentSettings.imageOptions, image: e.target.value },
                    });
                  }}
                  placeholder="https://example.com/logo.png"
                  className="w-full"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1 flex items-center justify-between">
                    Logo Size: {Math.round(logoSize * 100)}%
                  </label>
                  <Slider
                    value={[logoSize]}
                    onValueChange={([v]) => {
                      setLogoSize(v);
                      updateSettings({
                        imageOptions: { ...currentSettings.imageOptions, imageSize: v },
                      });
                    }}
                    min={0.05}
                    max={0.5}
                    step={0.01}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1 flex items-center justify-between">
                    Opacity: {Math.round(logoOpacity * 100)}%
                  </label>
                  <Slider
                    value={[logoOpacity]}
                    onValueChange={([v]) => setLogoOpacity(v)}
                    min={0.1}
                    max={1}
                    step={0.05}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        setLogoImage(dataUrl);
                        updateSettings({
                          imageOptions: { ...currentSettings.imageOptions, image: dataUrl },
                        });
                      };
                      reader.readAsDataURL(file);
                    };
                  };
                  input.click();
                }}>
                  <Upload className="w-4 h-4 mr-1" />
                  Upload Image
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setLogoImage('');
                  updateSettings({ imageOptions: { ...currentSettings.imageOptions, image: undefined } });
                }}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark flex justify-end">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { Upload, Trash2, Triangle, Check } from 'lucide-react';