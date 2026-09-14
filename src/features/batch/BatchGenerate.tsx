import { useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  Settings,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { useToast } from '@components/providers/ToastProvider';
import { QRCodeEngine } from '@lib/qr/qrEngine';
import type { BatchRow } from './BatchTable';

interface BatchGenerateProps {
  rows: BatchRow[];
  onRowsChange: (rows: BatchRow[]) => void;
  onProgress: (progress: number, current: number, total: number) => void;
  onComplete: (results: { success: number; failed: number; errors: string[] }) => void;
  isGenerating: boolean;
  className?: string;
}

interface GenerationTask {
  row: BatchRow;
  index: number;
  abortController: AbortController;
}

export function BatchGenerate({
  rows,
  onRowsChange,
  onProgress,
  onComplete,
  isGenerating,
  className,
}: BatchGenerateProps) {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [paused, setPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const isProcessingRef = useRef(false);
  const pendingRowsRef = useRef<BatchRow[]>([]);

  const pendingRows = rows.filter((r) => r.status === 'pending' && r.data && Object.values(r.data).some((v) => v.trim()));

  const startGeneration = useCallback(async () => {
    if (isProcessingRef.current || pendingRows.length === 0) return;
    
    isProcessingRef.current = true;
    setPaused(false);
    setErrors([]);
    setCurrentIndex(0);
    pendingRowsRef.current = pendingRows;

    const newTasks = pendingRows.map((row, index) => ({
      row,
      index,
      abortController: new AbortController(),
    }));
    setTasks(newTasks);

    onRowsChange(rows.map((r) =>
      pendingRows.some((pr) => pr.id === r.id) ? { ...r, status: 'processing' } : r
    ));

    let success = 0;
    let failed = 0;
    const errorList: string[] = [];

    for (let i = 0; i < newTasks.length; i++) {
      if (!isProcessingRef.current) break;
      
      while (paused && isProcessingRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!isProcessingRef.current) break;

      const task = newTasks[i];
      setCurrentIndex(i + 1);
      onProgress(Math.round(((i + 1) / newTasks.length) * 100), i + 1, newTasks.length);

      try {
        onRowsChange(rows.map((r) =>
          r.id === task.row.id ? { ...r, status: 'processing' } : r
        ));

        const engine = new QRCodeEngine();
        const dataString = buildDataString(task.row.type, task.row.data);
        
        if (!dataString.trim()) {
          throw new Error('Empty data');
        }

        const result = await engine.generate({
          data: dataString,
          width: task.row.data.width ? parseInt(task.row.data.width) : 512,
          height: task.row.data.height ? parseInt(task.row.data.height) : 512,
          margin: task.row.data.margin ? parseInt(task.row.data.margin) : 16,
          errorCorrectionLevel: (task.row.data.errorCorrectionLevel as any) || 'M',
          dotsOptions: task.row.data.dotsOptions ? JSON.parse(task.row.data.dotsOptions) : undefined,
          cornersSquareOptions: task.row.data.cornersSquareOptions ? JSON.parse(task.row.data.cornersSquareOptions) : undefined,
          cornersDotOptions: task.row.data.cornersDotOptions ? JSON.parse(task.row.data.cornersDotOptions) : undefined,
          backgroundOptions: task.row.data.backgroundOptions ? JSON.parse(task.row.data.backgroundOptions) : undefined,
          imageOptions: task.row.data.imageOptions ? JSON.parse(task.row.data.imageOptions) : undefined,
          image: task.row.data.image,
        });

        onRowsChange(rows.map((r) =>
          r.id === task.row.id
            ? { ...r, status: 'done', qrDataUrl: result.dataUrl, qrSvg: result.svg, error: undefined }
            : r
        ));

        success++;
      } catch (error) {
        const errorMsg = `${task.row.id}: ${String(error)}`;
        errorList.push(errorMsg);
        failed++;
        
        onRowsChange(rows.map((r) =>
          r.id === task.row.id ? { ...r, status: 'error', error: String(error) } : r
        ));
      }
    }

    isProcessingRef.current = false;
    onComplete({ success, failed, errors: errorList });
    setErrors(errorList);
    
    if (failed > 0) {
      showToast({ type: 'warning', title: 'Generation complete with errors', message: `${success} succeeded, ${failed} failed` });
    } else {
      showToast({ type: 'success', title: 'Generation complete', message: `${success} QR codes generated` });
    }
  }, [rows, pendingRows, paused, onRowsChange, onProgress, onComplete, showToast]);

  const pauseGeneration = useCallback(() => {
    setPaused(true);
  }, []);

  const resumeGeneration = useCallback(() => {
    setPaused(false);
  }, []);

  const cancelGeneration = useCallback(() => {
    isProcessingRef.current = false;
    tasks.forEach((task) => task.abortController.abort());
    setPaused(false);
    
    onRowsChange(rows.map((r) =>
      r.status === 'processing' ? { ...r, status: 'pending' } : r
    ));
    
    showToast({ type: 'info', title: 'Generation cancelled' });
  }, [tasks, onRowsChange, showToast]);

  const retryFailed = useCallback(() => {
    const failedRows = rows.filter((r) => r.status === 'error');
    if (failedRows.length === 0) return;
    
    onRowsChange(rows.map((r) =>
      r.status === 'error' ? { ...r, status: 'pending', error: undefined } : r
    ));
  }, [rows, onRowsChange]);

  const clearErrors = useCallback(() => {
    onRowsChange(rows.filter((r) => r.status !== 'error'));
  }, [rows, onRowsChange]);

  const progress = pendingRows.length > 0 
    ? Math.round((rows.filter((r) => r.status === 'done').length / pendingRows.length) * 100)
    : 0;

  const stats = {
    total: pendingRows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    processing: rows.filter((r) => r.status === 'processing').length,
    done: rows.filter((r) => r.status === 'done').length,
    error: rows.filter((r) => r.status === 'error').length,
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <Card variant="glass" padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground">Batch Generation</h3>
            <Badge variant={isGenerating ? 'primary' : stats.error > 0 ? 'destructive' : stats.done > 0 ? 'success' : 'default'}>
              {isGenerating ? 'Processing' : stats.error > 0 ? 'Errors' : stats.done > 0 ? 'Complete' : 'Ready'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isGenerating && stats.total > 0 && (
              <Button onClick={startGeneration} size="lg" className="w-full sm:w-auto">
                <Play className="w-5 h-5 mr-2" />
                Start Generation
              </Button>
            )}
            
            {isGenerating && !paused && (
              <Button variant="outline" onClick={pauseGeneration} size="lg">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            
            {isGenerating && paused && (
              <Button onClick={resumeGeneration} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
            )}
            
            {isGenerating && (
              <Button variant="destructive" onClick={cancelGeneration} size="lg">
                <Square className="w-5 h-5 mr-2" />
                Cancel
              </Button>
            )}

            {stats.error > 0 && !isGenerating && (
              <>
                <Button variant="outline" onClick={retryFailed} size="sm">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Retry Failed
                </Button>
                <Button variant="outline" onClick={clearErrors} size="sm">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear Errors
                </Button>
              </>
            )}
          </div>
        </div>

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Progress</span>
              <span>{progress}% ({currentIndex}/{stats.total})</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 300, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Current: {currentIndex}/{stats.total}</span>
              <span>Success: {stats.done}</span>
              <span>Errors: {stats.error}</span>
            </div>
          </motion.div>
        )}

        {!isGenerating && stats.total > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card variant="glass" padding="sm" className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </Card>
            <Card variant="glass" padding="sm" className="text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </Card>
            <Card variant="glass" padding="sm" className="text-center">
              <p className="text-2xl font-bold text-green-500">{stats.done}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </Card>
            <Card variant="glass" padding="sm" className="text-center">
              <p className="text-2xl font-bold text-red-500">{stats.error}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </Card>
          </div>
        )}

        {errors.length > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Errors ({errors.length})
                </h4>
                <Button variant="ghost" size="icon" onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </div>
              {showDetails && (
                <ul className="space-y-1 text-sm text-red-500 max-h-40 overflow-auto">
                  {errors.slice(0, 10).map((error, i) => (
                    <li key={i} className="font-mono truncate">{error}</li>
                  ))}
                  {errors.length > 10 && (
                    <li className="text-muted-foreground">...and {errors.length - 10} more</li>
                  )}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {stats.done > 0 && !isGenerating && (
          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              // Download all - handled by parent
            }}>
              <Download className="w-4 h-4 mr-1" />
              Download All ({stats.done})
            </Button>
            <Button variant="ghost" onClick={() => setShowDetails(true)}>
              <Settings className="w-4 h-4 mr-1" />
              View Details
            </Button>
          </div>
        )}
      </Card>

      {showDetails && stats.done > 0 && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title="Generated QR Codes"
          size="xl"
        >
          <div className="space-y-4 max-h-[70vh] overflow-auto">
            {rows
              .filter((r) => r.status === 'done' && r.qrDataUrl)
              .map((row) => (
                <Card key={row.id} variant="glass" padding="md" className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-surface">
                    <img src={row.qrDataUrl!} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{row.type.toUpperCase()}</Badge>
                      <span className="font-mono text-sm truncate">{row.id}</span>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground truncate">
                      {buildDataString(row.type, row.data).slice(0, 100)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {row.data.width && row.data.height && (
                        <span>{row.data.width}×{row.data.height}px</span>
                      )}
                      {row.data.errorCorrectionLevel && (
                        <span>EC: {row.data.errorCorrectionLevel}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        const link = document.createElement('a');
                        link.download = `qr-${row.type}-${row.id.slice(0,8)}.png`;
                        link.href = row.qrDataUrl!;
                        link.click();
                      }}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        onRowsChange(rows.map((r) => r.id === row.id ? { ...r, status: 'pending', qrDataUrl: undefined, qrSvg: undefined } : r));
                      }}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function buildDataString(type: string, data: Record<string, string>): string {
  switch (type) {
    case 'url': return data.url || '';
    case 'text': return data.text || '';
    case 'email': {
      const params = new URLSearchParams();
      if (data.subject) params.set('subject', data.subject);
      if (data.body) params.set('body', data.body);
      return `mailto:${data.email || ''}${params.toString() ? `?${params.toString()}` : ''}`;
    }
    case 'phone': return `tel:${data.phone || ''}`;
    case 'sms': {
      const params = new URLSearchParams();
      if (data.message) params.set('body', data.message);
      return `sms:${data.phone || ''}${params.toString() ? `?${params.toString()}` : ''}`;
    }
    case 'wifi': {
      const parts = ['WIFI:'];
      if (data.encryption) parts.push(`T:${data.encryption};`);
      if (data.ssid) parts.push(`S:${data.ssid};`);
      if (data.password) parts.push(`P:${data.password};`);
      if (data.hidden === 'true') parts.push('H:true;');
      parts.push(';');
      return parts.join('');
    }
    case 'vcard': {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      if (data.name) lines.push(`FN:${data.name}`);
      if (data.organization) lines.push(`ORG:${data.organization}`);
      if (data.phone) lines.push(`TEL:${data.phone}`);
      if (data.email) lines.push(`EMAIL:${data.email}`);
      if (data.url) lines.push(`URL:${data.url}`);
      if (data.address) lines.push(`ADR:${data.address}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    case 'location': {
      if (data.latitude && data.longitude) {
        let geo = `geo:${data.latitude},${data.longitude}`;
        if (data.query) geo += `?q=${encodeURIComponent(data.query)}`;
        return geo;
      }
      return data.query || '';
    }
    case 'whatsapp': {
      const params = new URLSearchParams();
      if (data.message) params.set('text', data.message);
      return `https://wa.me/${data.phone || ''}${params.toString() ? `?${params.toString()}` : ''}`;
    }
    case 'upi': {
      const params = new URLSearchParams();
      if (data.pa) params.set('pa', data.pa);
      if (data.pn) params.set('pn', data.pn);
      if (data.am) params.set('am', data.am);
      if (data.cu) params.set('cu', data.cu);
      if (data.tn) params.set('tn', data.tn);
      return `upi://pay?${params.toString()}`;
    }
    case 'crypto': {
      let addr = data.address || '';
      const params = new URLSearchParams();
      if (data.amount) params.set('amount', data.amount);
      if (data.label) params.set('label', data.label);
      if (data.message) params.set('message', data.message);
      return params.toString() ? `${addr}?${params.toString()}` : addr;
    }
    case 'calendar': {
      const lines = ['BEGIN:VEVENT'];
      if (data.title) lines.push(`SUMMARY:${data.title}`);
      if (data.description) lines.push(`DESCRIPTION:${data.description}`);
      if (data.location) lines.push(`LOCATION:${data.location}`);
      if (data.start) lines.push(`DTSTART:${data.start.replace(/[-:]/g, '').split('.')[0]}Z`);
      if (data.end) lines.push(`DTEND:${data.end.replace(/[-:]/g, '').split('.')[0]}Z`);
      lines.push('END:VEVENT');
      return lines.join('\n');
    }
    case 'applink': return data.url || '';
    default: return data.data || '';
  }
}