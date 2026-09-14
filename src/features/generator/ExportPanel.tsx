import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Download, Copy, Check, FileImage, FileCode, FileText, Share2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Tabs } from '@components/ui/Tabs';
import { Slider } from '@components/ui/Slider';

import { Tooltip } from '@components/ui/Tooltip';

export type ExportFormat = 'png' | 'svg' | 'jpeg' | 'webp' | 'pdf';

export interface ExportPanelProps {
  dataUrl: string | null;
  size: { width: number; height: number } | null;
  onExport: (format: ExportFormat, options: ExportOptions) => void;
  onCopy?: () => void;
  className?: string;
}

export interface ExportOptions {
  format: ExportFormat;
  dpi: number;
  quality: number;
  margin: number;
  backgroundColor: string;
  includeMargin: boolean;
}

const formatTabs = [
  { value: 'png', label: 'PNG', icon: <FileImage className="w-4 h-4" />, description: 'Lossless, transparent background' },
  { value: 'svg', label: 'SVG', icon: <FileCode className="w-4 h-4" />, description: 'Vector, infinite scaling' },
  { value: 'jpeg', label: 'JPEG', icon: <FileImage className="w-4 h-4" />, description: 'Compressed, smaller file' },
  { value: 'webp', label: 'WebP', icon: <FileImage className="w-4 h-4" />, description: 'Modern, best compression' },
  { value: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4" />, description: 'Document format, print-ready' },
];

export function ExportPanel({ dataUrl, size, onExport, onCopy, className }: ExportPanelProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('png');
  const [dpi, setDpi] = useState(300);
  const [quality, setQuality] = useState(90);
  const [margin, setMargin] = useState(4);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [includeMargin, setIncludeMargin] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = useCallback(async () => {
    if (!dataUrl || exporting) return;
    setExporting(true);
    try {
      await onExport(activeFormat, { format: activeFormat, dpi, quality, margin, backgroundColor, includeMargin });
    } finally {
      setExporting(false);
    }
  }, [dataUrl, exporting, activeFormat, dpi, quality, margin, backgroundColor, includeMargin, onExport]);

  const handleCopy = useCallback(async () => {
    if (!dataUrl) return;
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch {
      console.error('Copy failed');
    }
  }, [dataUrl, onCopy]);

  const getFormatOptions = (format: ExportFormat) => {
    switch (format) {
      case 'svg':
        return { showDpi: false, showQuality: false, showBackground: true, showMargin: true };
      case 'pdf':
        return { showDpi: true, showQuality: false, showBackground: true, showMargin: true };
      case 'jpeg':
      case 'webp':
        return { showDpi: true, showQuality: true, showBackground: true, showMargin: true };
      default:
        return { showDpi: true, showQuality: false, showBackground: true, showMargin: true };
    }
  };

  const options = getFormatOptions(activeFormat);

  return (
    <Card variant="glass" padding="none" className={clsx('overflow-hidden', className)}>
      <div className="p-4 border-b border-glass-border dark:border-glass-border-dark">
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export
            </CardTitle>
            <p className="text-xs text-muted-foreground">Choose format and settings</p>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content="Copy to clipboard">
              <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!dataUrl || exporting} aria-label="Copy image">
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </Button>
            </Tooltip>
          </div>
        </div>

        <Tabs
          tabs={formatTabs.map((f) => ({
            value: f.value,
            label: f.label,
            icon: f.icon,
          }))}
          value={activeFormat}
          onChange={(v) => setActiveFormat(v as ExportFormat)}
          variant="enclosed"
          className="mb-4"
        />
      </div>

      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {options.showDpi && (
            <Slider
              label="DPI"
              min={72}
              max={600}
              step={1}
              value={dpi}
              onChange={setDpi}
              marks={[
                { value: 72, label: '72' },
                { value: 150, label: '150' },
                { value: 300, label: '300' },
                { value: 600, label: '600' },
              ]}
            />
          )}
          {options.showQuality && (
            <Slider
              label="Quality"
              min={10}
              max={100}
              step={5}
              value={quality}
              onChange={setQuality}
              valueFormatter={(v) => `${v}%`}
              marks={[
                { value: 50, label: '50%' },
                { value: 80, label: '80%' },
                { value: 100, label: '100%' },
              ]}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {options.showMargin && (
            <Slider
              label="Margin"
              min={0}
              max={20}
              step={1}
              value={margin}
              onChange={setMargin}
              showValue
            />
          )}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMargin}
                onChange={(e) => setIncludeMargin(e.target.checked)}
                className="w-4 h-4 rounded border-glass-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">Include margin</span>
            </label>
          </div>
        </div>

        {options.showBackground && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Background Color</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-full h-10 rounded-lg border border-glass-border dark:border-glass-border-dark bg-background cursor-pointer"
            />
          </div>
        )}

        {size && (
          <div className="pt-2 border-t border-glass-border dark:border-glass-border-dark">
            <p className="text-xs text-muted-foreground text-center">
              Output: {size.width} × {size.height} px • {activeFormat.toUpperCase()}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleExport}
            disabled={!dataUrl || exporting}
            className="flex-1"
            size="lg"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Export as {activeFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}