import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  Image,
  FileSpreadsheet,
  Archive,
  Check,
  X,
  Loader2,
  ArrowRight,
  Settings,
  Copy,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Slider } from '@components/ui/Slider';
import { Modal } from '@components/ui/Modal';
import { Tabs, TabList, TabTrigger, TabContent } from '@components/ui/Tabs';
import { useToast } from '@components/providers/ToastProvider';
import { QRCodeEngine, ExportFormat, ExportOptions } from '@lib/qr/qrEngine';
import type { QRRecord } from '@lib/storage/indexedDB';

interface BatchExportProps {
  items: QRRecord[];
  onClose: () => void;
  isOpen: boolean;
}

const EXPORT_FORMATS = [
  { id: 'png', label: 'PNG', icon: Image, description: 'Raster image, lossless' },
  { id: 'svg', label: 'SVG', icon: FileText, description: 'Vector, scalable' },
  { id: 'pdf', label: 'PDF', icon: FileSpreadsheet, description: 'Document, printable' },
  { id: 'jpeg', label: 'JPEG', icon: Image, description: 'Raster, compressed' },
  { id: 'webp', label: 'WebP', icon: Image, description: 'Modern web format' },
  { id: 'zip', label: 'ZIP', icon: Archive, description: 'Archive of multiple files' },
] as const;

export function BatchExport({ items, onClose, isOpen }: BatchExportProps) {
  const { showToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    margin: 16,
    dpi: 300,
    quality: 0.92,
    backgroundColor: '#ffffff',
    filename: 'qr-codes',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });
  const [showResults, setShowResults] = useState(false);

  const handleExport = useCallback(async () => {
    if (items.length === 0) return;
    
    setIsExporting(true);
    setProgress(0);
    setCurrentItem(0);
    setResults({ success: 0, failed: 0, errors: [] });
    setShowResults(false);

    try {
      if (selectedFormat === 'zip') {
        await exportAsZip();
      } else if (selectedFormat === 'pdf') {
        await exportAsPdf();
      } else {
        await exportAsImages();
      }
      setShowResults(true);
    } catch (error) {
      showToast({ type: 'error', title: 'Export failed', message: String(error) });
    } finally {
      setIsExporting(false);
    }
  }, [items, selectedFormat, exportOptions, showToast]);

  const exportAsImages = useCallback(async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const engine = new QRCodeEngine();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setCurrentItem(i + 1);
      setProgress(Math.round(((i + 1) / items.length) * 100));

      try {
        await engine.generate({
          data: item.data,
          width: item.settings.width,
          height: item.settings.height,
          margin: exportOptions.margin,
          errorCorrectionLevel: item.settings.errorCorrectionLevel,
          dotsOptions: item.settings.dotsOptions,
          cornersSquareOptions: item.settings.cornersSquareOptions,
          cornersDotOptions: item.settings.cornersDotOptions,
          backgroundOptions: item.settings.backgroundOptions,
          imageOptions: item.settings.imageOptions,
          image: item.settings.imageOptions?.image,
        });

        const blob = await engine.export(selectedFormat, {
          margin: exportOptions.margin,
          dpi: exportOptions.dpi,
          quality: exportOptions.quality,
          backgroundColor: exportOptions.backgroundColor,
        });

        const base64 = await blobToBase64(blob as Blob);
        const filename = `${exportOptions.filename}-${item.type}-${item.id.slice(0, 8)}.${selectedFormat}`;
        zip.file(filename, base64, { base64: true });

        setResults((prev) => ({ ...prev, success: prev.success + 1 }));
      } catch (error) {
        setResults((prev) => ({
          ...prev,
          failed: prev.failed + 1,
          errors: [...prev.errors, `${item.id}: ${String(error)}`],
        }));
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${exportOptions.filename}.zip`);
  }, [items, selectedFormat, exportOptions]);

  const exportAsPdf = useCallback(async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
    const engine = new QRCodeEngine();

    let y = 20;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = 500;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setCurrentItem(i + 1);
      setProgress(Math.round(((i + 1) / items.length) * 100));

      try {
        await engine.generate({
          data: item.data,
          width: item.settings.width,
          height: item.settings.height,
          margin: exportOptions.margin,
          errorCorrectionLevel: item.settings.errorCorrectionLevel,
          dotsOptions: item.settings.dotsOptions,
          cornersSquareOptions: item.settings.cornersSquareOptions,
          cornersDotOptions: item.settings.cornersDotOptions,
          backgroundOptions: item.settings.backgroundOptions,
          imageOptions: item.settings.imageOptions,
          image: item.settings.imageOptions?.image,
        });

        const canvas = engine.getCanvas();
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = Math.min(maxWidth, imgProps.width);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (y + pdfHeight > pageHeight - 20) {
          pdf.addPage();
          y = 20;
        }

        pdf.addImage(imgData, 'PNG', (pdf.internal.pageSize.getWidth() - pdfWidth) / 2, y, pdfWidth, pdfHeight);
        y += pdfHeight + 10;

        pdf.setFontSize(10);
        pdf.text(`${item.type.toUpperCase()}: ${item.data.slice(0, 80)}`, 15, y);
        y += 15;

        setResults((prev) => ({ ...prev, success: prev.success + 1 }));
      } catch (error) {
        setResults((prev) => ({
          ...prev,
          failed: prev.failed + 1,
          errors: [...prev.errors, `${item.id}: ${String(error)}`],
        }));
      }
    }

    const pdfBlob = pdf.output('blob');
    downloadBlob(pdfBlob, `${exportOptions.filename}.pdf`);
  }, [items, exportOptions]);

  const exportAsZip = useCallback(async () => {
    // ZIP export handled in exportAsImages
    await exportAsImages();
  }, [exportAsImages]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyResults = useCallback(() => {
    const summary = `Export complete: ${results.success} successful, ${results.failed} failed`;
    navigator.clipboard.writeText(summary);
    showToast({ type: 'success', title: 'Results copied' });
  }, [results, showToast]);

  const formatItemCount = items.length;

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Export"
      size="lg"
      showClose={!isExporting}
      closeOnOverlayClick={!isExporting}
      closeOnEscape={!isExporting}
    >
      {!showResults ? (
        <div className="space-y-6">
          <Tabs value={selectedFormat} onValueChange={setSelectedFormat} className="w-full">
            <TabList className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {EXPORT_FORMATS.map((fmt) => (
                <TabTrigger
                  key={fmt.id}
                  value={fmt.id}
                  className="flex flex-col items-center gap-1 py-3 px-2"
                >
                  <fmt.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{fmt.label}</span>
                </TabTrigger>
              ))}
            </TabList>

            <TabContent value="png" className="space-y-4 pt-4">
              <Card variant="glass" padding="md">
                <h4 className="font-medium text-foreground mb-4">Image Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Margin: {exportOptions.margin}px
                    </label>
                    <Slider
                      value={[exportOptions.margin]}
                      onValueChange={([v]) => setExportOptions((prev) => ({ ...prev, margin: v }))}
                      min={0}
                      max={100}
                      step={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      DPI: {exportOptions.dpi}
                    </label>
                    <Slider
                      value={[exportOptions.dpi]}
                      onValueChange={([v]) => setExportOptions((prev) => ({ ...prev, dpi: v }))}
                      min={72}
                      max={600}
                      step={72}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Quality: {Math.round(exportOptions.quality * 100)}%
                    </label>
                    <Slider
                      value={[exportOptions.quality]}
                      onValueChange={([v]) => setExportOptions((prev) => ({ ...prev, quality: v }))}
                      min={0.1}
                      max={1}
                      step={0.05}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Background Color</label>
                    <Input
                      type="color"
                      value={exportOptions.backgroundColor}
                      onChange={(e) => setExportOptions((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-24 h-10 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
                    />
                  </div>
                </div>
              </Card>
            </TabContent>

            <TabContent value="svg" className="space-y-4 pt-4">
              <Card variant="glass" padding="md">
                <h4 className="font-medium text-foreground mb-4">SVG Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Margin: {exportOptions.margin}px
                    </label>
                    <Slider
                      value={[exportOptions.margin]}
                      onValueChange={([v]) => setExportOptions((prev) => ({ ...prev, margin: v }))}
                      min={0}
                      max={100}
                      step={4}
                    />
                  </div>
                </div>
              </Card>
            </TabContent>

            <TabContent value="pdf" className="space-y-4 pt-4">
              <Card variant="glass" padding="md">
                <h4 className="font-medium text-foreground mb-4">PDF Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Margin: {exportOptions.margin}px
                    </label>
                    <Slider
                      value={[exportOptions.margin]}
                      onValueChange={([v]) => setExportOptions((prev) => ({ ...prev, margin: v }))}
                      min={0}
                      max={100}
                      step={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">DPI: {exportOptions.dpi}</label>
                    <Slider
                      value={[exportOptions.dpi]}
                      onValueChange={([v]) => setExportOptions((prev) => ({ ...prev, dpi: v }))}
                      min={72}
                      max={600}
                      step={72}
                    />
                  </div>
                </div>
              </Card>
            </TabContent>

            <TabContent value="jpeg" className="space-y-4 pt-4">
              <TabContent value="png" />
            </TabContent>

            <TabContent value="webp" className="space-y-4 pt-4">
              <TabContent value="png" />
            </TabContent>

            <TabContent value="zip" className="space-y-4 pt-4">
              <Card variant="glass" padding="md">
                <h4 className="font-medium text-foreground mb-4">ZIP Archive Settings</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  Creates a ZIP archive containing all QR codes in the selected format.
                </p>
                <TabContent value="png" />
              </Card>
            </TabContent>
          </Tabs>

          <Card variant="glass" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Filename Pattern</h4>
                <p className="text-sm text-muted-foreground">Use {type}, {id}, {date} placeholders</p>
              </div>
              <Input
                value={exportOptions.filename}
                onChange={(e) => setExportOptions((prev) => ({ ...prev, filename: e.target.value }))}
                placeholder="qr-codes"
                className="w-64"
              />
            </div>
          </Card>

          <div className="flex items-center justify-between p-4 bg-surface/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{formatItemCount} QR codes</Badge>
              <Badge variant={selectedFormat === 'zip' ? 'primary' : 'outline'}>
                {selectedFormat.toUpperCase()}
              </Badge>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Export Complete</h3>
          <p className="text-muted-foreground">
            {results.success} successful, {results.failed} failed
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card variant="glass" padding="md">
              <p className="text-3xl font-bold text-green-500">{results.success}</p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </Card>
            <Card variant="glass" padding="md">
              <p className="text-3xl font-bold text-red-500">{results.failed}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </Card>
          </div>

          {results.errors.length > 0 && (
            <Card variant="glass" padding="md" className="max-h-64 overflow-auto text-left">
              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Errors
              </h4>
              <ul className="space-y-1 text-sm text-red-500">
                {results.errors.slice(0, 20).map((error, i) => (
                  <li key={i} className="font-mono truncate">{error}</li>
                ))}
                {results.errors.length > 20 && (
                  <li className="text-muted-foreground">...and {results.errors.length - 20} more</li>
                )}
              </ul>
            </Card>
          )}

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleCopyResults}>
              <Copy className="w-4 h-4 mr-1" />
              Copy Summary
            </Button>
            <Button onClick={() => { setShowResults(false); setSelectedFormat('png'); }}>
              <ArrowRight className="w-4 h-4 mr-1" />
              Export Again
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
          </div>
        </motion.div>
      )}
    </Modal>
  );
}

import { AlertCircle } from 'lucide-react';