import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Download, Copy, Check, RotateCcw, Maximize2, Minimize2, AlertCircle, ScanLine } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Tooltip } from '@components/ui/Tooltip';

export interface LivePreviewProps {
  data: string;
  dataUrl: string | null;
  size: { width: number; height: number } | null;
  isGenerating: boolean;
  error: Error | null;
  options: {
    width: number;
    height: number;
    margin: number;
    foregroundColor: string;
    backgroundColor: string;
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    dotShape: string;
    cornerRadius: number;
    cornerDotRadius: number;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      rotation: number;
    };
    logo?: {
      image: string;
      size: number;
      opacity: number;
      shape: string;
    };
    version?: number;
    mode?: string;
    maskPattern?: number;
  };
  onGenerate: () => void;
  onDownload?: (format: string) => void;
  onCopy?: () => void;
  className?: string;
}

export function LivePreview({
  data,
  dataUrl,
  size,
  isGenerating,
  error,
  options,
  onGenerate,
  onDownload,
  onCopy,
  className,
}: LivePreviewProps) {
  const [showScanModal, setShowScanModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleDownload = useCallback((format: string) => {
    onDownload?.(format);
  }, [onDownload]);

  return (
    <Card variant="glass" padding="none" className={clsx('overflow-hidden flex flex-col h-full', className)}>
      <div className="p-4 border-b border-glass-border dark:border-glass-border-dark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
            <p className="text-xs text-muted-foreground">Real-time QR code preview</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Copy to clipboard">
            <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!dataUrl || isGenerating} aria-label="Copy QR code">
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </Button>
          </Tooltip>
          <Tooltip content="Download PNG">
            <Button variant="ghost" size="icon" onClick={() => handleDownload('png')} disabled={!dataUrl || isGenerating} aria-label="Download PNG">
              <Download className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip content="Test scan">
            <Button variant="ghost" size="icon" onClick={() => setShowScanModal(true)} disabled={!dataUrl} aria-label="Test scan">
              <ScanLine className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip content="Expand">
            <Button variant="ghost" size="icon" aria-label="Expand preview">
              <Maximize2 className="w-5 h-5" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 min-h-[400px] relative">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-muted-foreground"
            >
              <motion.div
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-sm">Generating QR code...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 text-red-500 text-center p-8"
            >
              <AlertCircle className="w-12 h-12" />
              <p className="font-medium">Generation failed</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <Button variant="outline" size="sm" onClick={onGenerate}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </motion.div>
          ) : dataUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative"
            >
              <img
                src={dataUrl}
                alt="Generated QR code"
                className="max-w-full max-h-[500px] rounded-lg shadow-xl"
              />
              {size && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded"
                >
                  {size.width} × {size.height} px
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 text-muted-foreground p-8"
            >
              <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center">
                <ScanLine className="w-12 h-12 opacity-30" />
              </div>
              <p className="text-lg font-medium">No QR code generated</p>
              <p className="text-sm">Enter data and adjust settings to generate</p>
              {!data && (
                <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating}>
                  Generate QR Code
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {dataUrl && size && (
        <div className="px-4 py-3 border-t border-glass-border dark:border-glass-border-dark bg-surface/50">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Size: {size.width} × {size.height} px</span>
            <span>EC: {options.errorCorrectionLevel}</span>
            <span>Modules: {options.version || 'Auto'}</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
            onClick={() => setShowScanModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="scan-modal-title"
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-2xl)] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="scan-modal-title" className="text-lg font-semibold text-foreground">Scan Test</h2>
                <button onClick={() => setShowScanModal(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors" aria-label="Close">
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Scan this QR code with your phone to test</p>
                {dataUrl && <img src={dataUrl} alt="QR code for scanning" className="mx-auto max-w-xs rounded-lg shadow-lg" />}
                <p className="text-xs text-muted-foreground mt-2">Data: {data.slice(0, 50)}{data.length > 50 ? '...' : ''}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}