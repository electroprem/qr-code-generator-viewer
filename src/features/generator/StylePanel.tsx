import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { ChevronDown, Palette, Square, Circle, GitCompare, Image, Settings, SlidersHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Slider } from '@components/ui/Slider';
import { ColorPicker } from '@components/ui/ColorPicker';
import { Select } from '@components/ui/Input';
import { Input } from '@components/ui/Input';

interface StyleSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

function StyleSection({ title, icon, children, defaultOpen = true }: StyleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card variant="glass" padding="none" className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'w-full flex items-center justify-between p-4',
          'hover:bg-surface/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset'
        )}
        aria-expanded={open}
        aria-controls={`${title.toLowerCase()}-content`}
      >
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</span>
          <h3 className="font-medium text-foreground">{title}</h3>
        </div>
        <ChevronDown className={clsx('w-5 h-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={`${title.toLowerCase()}-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="px-4 pb-4"
          >
            <div className="pt-2 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface DotStyleProps {
  shape: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded';
  onShapeChange: (shape: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded') => void;
  dotScale: number;
  onDotScaleChange: (scale: number) => void;
}

function DotStyle({ shape, onShapeChange, dotScale, onDotScaleChange }: DotStyleProps) {
  const shapes: { value: DotStyleProps['shape']; label: string; icon: ReactNode }[] = [
    { value: 'square', label: 'Square', icon: <Square className="w-5 h-5" /> },
    { value: 'rounded', label: 'Rounded', icon: <Square className="w-5 h-5 rounded-lg" /> },
    { value: 'dots', label: 'Dots', icon: <Circle className="w-5 h-5" /> },
    { value: 'classy', label: 'Classy', icon: <GitCompare className="w-5 h-5" /> },
    { value: 'classy-rounded', label: 'Classy Rounded', icon: <GitCompare className="w-5 h-5 rounded-lg" /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Module Shape</label>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Module shape">
          {shapes.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={shape === s.value}
              onClick={() => onShapeChange(s.value)}
              className={clsx(
                'p-3 rounded-xl border-2 transition-all duration-200',
                'flex flex-col items-center gap-2',
                shape === s.value
                  ? 'border-primary bg-primary/10'
                  : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                {s.icon}
              </div>
              <span className="text-xs font-medium text-center">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <Slider
        label="Dot Scale"
        min={0.1}
        max={1}
        step={0.05}
        value={dotScale}
        onChange={onDotScaleChange}
        valueFormatter={(v) => `${Math.round(v * 100)}%`}
        marks={[
          { value: 0.1, label: '10%' },
          { value: 0.5, label: '50%' },
          { value: 1, label: '100%' },
        ]}
      />
    </div>
  );
}

interface CornerStyleProps {
  cornerRadius: number;
  onCornerRadiusChange: (radius: number) => void;
  cornerDotRadius: number;
  onCornerDotRadiusChange: (radius: number) => void;
}

function CornerStyle({ cornerRadius, onCornerRadiusChange, cornerDotRadius, onCornerDotRadiusChange }: CornerStyleProps) {
  return (
    <div className="space-y-4">
      <Slider
        label="Corner Radius"
        min={0}
        max={1}
        step={0.05}
        value={cornerRadius}
        onChange={onCornerRadiusChange}
        valueFormatter={(v) => `${Math.round(v * 100)}%`}
      />
      <Slider
        label="Corner Dot Radius"
        min={0}
        max={1}
        step={0.05}
        value={cornerDotRadius}
        onChange={onCornerDotRadiusChange}
        valueFormatter={(v) => `${Math.round(v * 100)}%`}
      />
    </div>
  );
}

interface ColorStyleProps {
  foregroundColor: string;
  onForegroundChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundChange: (color: string) => void;
  gradientEnabled: boolean;
  onGradientToggle: (enabled: boolean) => void;
  gradientType: 'linear' | 'radial';
  onGradientTypeChange: (type: 'linear' | 'radial') => void;
  gradientColors: string[];
  onGradientColorsChange: (colors: string[]) => void;
  gradientRotation: number;
  onGradientRotationChange: (rotation: number) => void;
}

function ColorStyle({
  foregroundColor,
  onForegroundChange,
  backgroundColor,
  onBackgroundChange,
  gradientEnabled,
  onGradientToggle,
  gradientType,
  onGradientTypeChange,
  gradientColors,
  onGradientColorsChange,
  gradientRotation,
  onGradientRotationChange,
}: ColorStyleProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <ColorPicker label="Foreground" value={foregroundColor} onChange={onForegroundChange} showAlpha />
        <ColorPicker label="Background" value={backgroundColor} onChange={onBackgroundChange} showAlpha />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={gradientEnabled}
            onChange={(e) => onGradientToggle(e.target.checked)}
            className="w-4 h-4 rounded border-glass-border text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-foreground">Enable Gradient</span>
        </label>
      </div>
      {gradientEnabled && (
        <div className="space-y-3 pt-2 border-t border-glass-border dark:border-glass-border-dark">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gradient Type"
              value={gradientType}
              onChange={onGradientTypeChange}
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'radial', label: 'Radial' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Gradient Colors</label>
            <div className="flex flex-wrap gap-2">
              {gradientColors.map((color, index) => (
                <ColorPicker
                  key={index}
                  value={color}
                  onChange={(c) => {
                    const newColors = [...gradientColors];
                    newColors[index] = c;
                    onGradientColorsChange(newColors);
                  }}
                  showInput={false}
                  showAlpha
                  className="w-20"
                />
              ))}
              {gradientColors.length < 5 && (
                <button
                  type="button"
                  onClick={() => onGradientColorsChange([...gradientColors, '#0ea5e9'])}
                  className="w-20 h-10 rounded-xl border-2 border-dashed border-glass-border dark:border-glass-border-dark text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  +
                </button>
              )}
            </div>
          </div>
          <Slider
            label="Rotation"
            min={0}
            max={360}
            step={1}
            value={gradientRotation}
            onChange={onGradientRotationChange}
            valueFormatter={(v) => `${v}°`}
            marks={[
              { value: 0, label: '0°' },
              { value: 90, label: '90°' },
              { value: 180, label: '180°' },
              { value: 270, label: '270°' },
              { value: 360, label: '360°' },
            ]}
          />
        </div>
      )}
    </div>
  );
}

interface LogoStyleProps {
  logoImage: File | null;
  onLogoChange: (file: File | null) => void;
  logoSize: number;
  onLogoSizeChange: (size: number) => void;
  logoOpacity: number;
  onLogoOpacityChange: (opacity: number) => void;
  logoShape: 'square' | 'circle' | 'rounded';
  onLogoShapeChange: (shape: 'square' | 'circle' | 'rounded') => void;
}

function LogoStyle({ logoImage, onLogoChange, logoSize, onLogoSizeChange, logoOpacity, onLogoOpacityChange, logoShape, onLogoShapeChange }: LogoStyleProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Logo Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onLogoChange(e.target.files?.[0] || null)}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        {logoImage && (
          <div className="mt-2 flex items-center gap-3 p-2 bg-surface rounded-lg">
            <img src={URL.createObjectURL(logoImage)} alt="Logo preview" className="w-12 h-12 rounded-lg object-cover" />
            <span className="text-sm text-muted-foreground truncate flex-1">{logoImage.name}</span>
            <button type="button" onClick={() => onLogoChange(null)} className="text-red-500 hover:underline text-sm">Remove</button>
          </div>
        )}
      </div>
      <Slider
        label="Logo Size"
        min={0.1}
        max={0.5}
        step={0.05}
        value={logoSize}
        onChange={onLogoSizeChange}
        valueFormatter={(v) => `${Math.round(v * 100)}%`}
      />
      <Slider
        label="Logo Opacity"
        min={0}
        max={1}
        step={0.1}
        value={logoOpacity}
        onChange={onLogoOpacityChange}
        valueFormatter={(v) => `${Math.round(v * 100)}%`}
      />
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Logo Shape</label>
        <div className="flex gap-2" role="radiogroup" aria-label="Logo shape">
          {(['square', 'circle', 'rounded'] as LogoStyleProps['logoShape'][]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={logoShape === s}
              onClick={() => onLogoShapeChange(s)}
              className={clsx(
                'flex-1 p-3 rounded-xl border-2 transition-all',
                logoShape === s ? 'border-primary bg-primary/10' : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50'
              )}
            >
              <div className={clsx('w-8 h-8 mx-auto bg-muted', s === 'circle' && 'rounded-full', s === 'rounded' && 'rounded-lg')} />
              <span className="text-xs font-medium block text-center capitalize">{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AdvancedStyleProps {
  version: number;
  onVersionChange: (version: number) => void;
  mode: 'numeric' | 'alphanumeric' | 'byte' | 'kanji';
  onModeChange: (mode: 'numeric' | 'alphanumeric' | 'byte' | 'kanji') => void;
  margin: number;
  onMarginChange: (margin: number) => void;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  onErrorCorrectionChange: (ec: 'L' | 'M' | 'Q' | 'H') => void;
  maskPattern: number;
  onMaskPatternChange: (pattern: number) => void;
}

function AdvancedStyle({ version, onVersionChange, mode, onModeChange, margin, onMarginChange, errorCorrection, onErrorCorrectionChange, maskPattern, onMaskPatternChange }: AdvancedStyleProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Slider
          label="Version"
          min={1}
          max={40}
          step={1}
          value={version}
          onChange={onVersionChange}
          valueFormatter={(v) => `v${v}`}
          showValue
        />
        <Select
          label="Mode"
          value={mode}
          onChange={onModeChange}
          options={[
            { value: 'numeric', label: 'Numeric' },
            { value: 'alphanumeric', label: 'Alphanumeric' },
            { value: 'byte', label: 'Byte' },
            { value: 'kanji', label: 'Kanji' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Slider
          label="Margin"
          min={0}
          max={20}
          step={1}
          value={margin}
          onChange={onMarginChange}
          showValue
        />
        <Select
          label="Error Correction"
          value={errorCorrection}
          onChange={onErrorCorrectionChange}
          options={[
            { value: 'L', label: 'Low (7%)' },
            { value: 'M', label: 'Medium (15%)' },
            { value: 'Q', label: 'Quartile (25%)' },
            { value: 'H', label: 'High (30%)' },
          ]}
        />
      </div>
      <Slider
        label="Mask Pattern"
        min={-1}
        max={7}
        step={1}
        value={maskPattern}
        onChange={onMaskPatternChange}
        valueFormatter={(v) => v === -1 ? 'Auto' : String(v)}
        marks={[
          { value: -1, label: 'Auto' },
          { value: 0, label: '0' },
          { value: 3, label: '3' },
          { value: 7, label: '7' },
        ]}
      />
    </div>
  );
}

export interface StylePanelProps {
  shape: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded';
  onShapeChange: (shape: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded') => void;
  dotScale: number;
  onDotScaleChange: (scale: number) => void;
  cornerRadius: number;
  onCornerRadiusChange: (radius: number) => void;
  cornerDotRadius: number;
  onCornerDotRadiusChange: (radius: number) => void;
  foregroundColor: string;
  onForegroundChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundChange: (color: string) => void;
  gradientEnabled: boolean;
  onGradientToggle: (enabled: boolean) => void;
  gradientType: 'linear' | 'radial';
  onGradientTypeChange: (type: 'linear' | 'radial') => void;
  gradientColors: string[];
  onGradientColorsChange: (colors: string[]) => void;
  gradientRotation: number;
  onGradientRotationChange: (rotation: number) => void;
  logoImage: File | null;
  onLogoChange: (file: File | null) => void;
  logoSize: number;
  onLogoSizeChange: (size: number) => void;
  logoOpacity: number;
  onLogoOpacityChange: (opacity: number) => void;
  logoShape: 'square' | 'circle' | 'rounded';
  onLogoShapeChange: (shape: 'square' | 'circle' | 'rounded') => void;
  version: number;
  onVersionChange: (version: number) => void;
  mode: 'numeric' | 'alphanumeric' | 'byte' | 'kanji';
  onModeChange: (mode: 'numeric' | 'alphanumeric' | 'byte' | 'kanji') => void;
  margin: number;
  onMarginChange: (margin: number) => void;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  onErrorCorrectionChange: (ec: 'L' | 'M' | 'Q' | 'H') => void;
  maskPattern: number;
  onMaskPatternChange: (pattern: number) => void;
}

export function StylePanel(props: StylePanelProps) {
  return (
    <div className="space-y-4">
      <StyleSection title="Dots" icon={<Square className="w-5 h-5" />}>
        <DotStyle
          shape={props.shape as DotStyleProps['shape']}
          onShapeChange={props.onShapeChange as DotStyleProps['onShapeChange']}
          dotScale={props.dotScale}
          onDotScaleChange={props.onDotScaleChange}
        />
      </StyleSection>

      <StyleSection title="Corners" icon={<GitCompare className="w-5 h-5" />}>
        <CornerStyle
          cornerRadius={props.cornerRadius}
          onCornerRadiusChange={props.onCornerRadiusChange}
          cornerDotRadius={props.cornerDotRadius}
          onCornerDotRadiusChange={props.onCornerDotRadiusChange}
        />
      </StyleSection>

      <StyleSection title="Colors" icon={<Palette className="w-5 h-5" />}>
        <ColorStyle
          foregroundColor={props.foregroundColor}
          onForegroundChange={props.onForegroundChange}
          backgroundColor={props.backgroundColor}
          onBackgroundChange={props.onBackgroundChange}
          gradientEnabled={props.gradientEnabled}
          onGradientToggle={props.onGradientToggle}
          gradientType={props.gradientType as ColorStyleProps['gradientType']}
          onGradientTypeChange={props.onGradientTypeChange as ColorStyleProps['onGradientTypeChange']}
          gradientColors={props.gradientColors}
          onGradientColorsChange={props.onGradientColorsChange}
          gradientRotation={props.gradientRotation}
          onGradientRotationChange={props.onGradientRotationChange}
        />
      </StyleSection>

      <StyleSection title="Logo" icon={<Image className="w-5 h-5" />}>
        <LogoStyle
          logoImage={props.logoImage}
          onLogoChange={props.onLogoChange}
          logoSize={props.logoSize}
          onLogoSizeChange={props.onLogoSizeChange}
          logoOpacity={props.logoOpacity}
          onLogoOpacityChange={props.onLogoOpacityChange}
          logoShape={props.logoShape as LogoStyleProps['logoShape']}
          onLogoShapeChange={props.onLogoShapeChange as LogoStyleProps['onLogoShapeChange']}
        />
      </StyleSection>

      <StyleSection title="Advanced" icon={<Settings className="w-5 h-5" />}>
        <AdvancedStyle
          version={props.version}
          onVersionChange={props.onVersionChange}
          mode={props.mode as AdvancedStyleProps['mode']}
          onModeChange={props.onModeChange as AdvancedStyleProps['onModeChange']}
          margin={props.margin}
          onMarginChange={props.onMarginChange}
          errorCorrection={props.errorCorrection as AdvancedStyleProps['errorCorrection']}
          onErrorCorrectionChange={props.onErrorCorrectionChange as AdvancedStyleProps['onErrorCorrectionChange']}
          maskPattern={props.maskPattern}
          onMaskPatternChange={props.onMaskPatternChange}
        />
      </StyleSection>
    </div>
  );
}