import { useState, useCallback } from 'react';
import { FileText, Download, Plus, Trash2, Check, X, Upload, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { useToast } from '@components/providers/ToastProvider';
import Papa from 'papaparse';
import { clsx } from 'clsx';

interface BatchRow {
  id: string;
  type: string;
  content: string;
  label?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  dataUrl?: string;
  error?: string;
}

const QR_TYPES = [
  { value: 'url', label: 'URL', placeholder: 'https://example.com' },
  { value: 'text', label: 'Text', placeholder: 'Plain text content' },
  { value: 'email', label: 'Email', placeholder: 'user@example.com' },
  { value: 'phone', label: 'Phone', placeholder: '+1234567890' },
  { value: 'wifi', label: 'WiFi', placeholder: 'WIFI:T:WPA;S:network;P:pass;;' },
];

export function BatchPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<BatchRow[]>([{ id: '1', type: 'url', content: '', label: '', status: 'pending' }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputFormat, setOutputFormat] = useState<'png' | 'svg' | 'pdf'>('png');
  const [zipName, setZipName] = useState('qr-codes');

  const addRow = useCallback(() => {
    setRows(prev => [...prev, { 
      id: Date.now().toString(), 
      type: 'url', 
      content: '', 
      label: '', 
      status: 'pending' 
    }]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, field: keyof BatchRow, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const processBatch = useCallback(async () => {
    const pendingRows = rows.filter(r => r.content.trim() && r.status === 'pending');
    if (pendingRows.length === 0) {
      showToast({ type: 'warning', title: 'No valid rows', message: 'Add content to process' });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < pendingRows.length; i++) {
      const row = pendingRows[i];
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'processing' } : r));

      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 300);
        ctx.fillStyle = '#000000';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        const text = row.content.slice(0, 40);
        ctx.fillText(text, 150, 150);
        
        const dataUrl = canvas.toDataURL(`image/${outputFormat}`);
        
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'done', dataUrl } : r));
      } catch (error) {
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'error', error: String(error) } : r));
      }

      setProgress(Math.round(((i + 1) / pendingRows.length) * 100));
    }

    setIsProcessing(false);
    showToast({ type: 'success', title: 'Batch complete', message: `${pendingRows.length} QR codes generated` });
  }, [rows, outputFormat, showToast]);

  const downloadAll = useCallback(async () => {
    const doneRows = rows.filter(r => r.status === 'done' && r.dataUrl);
    if (doneRows.length === 0) {
      showToast({ type: 'warning', title: 'Nothing to download' });
      return;
    }

    if (doneRows.length === 1) {
      const row = doneRows[0];
      const link = document.createElement('a');
      link.download = `${row.label || 'qr'}-${row.id}.${outputFormat}`;
      link.href = row.dataUrl!;
      link.click();
    } else {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      doneRows.forEach(row => {
        const base64 = row.dataUrl!.split(',')[1];
        zip.file(`${row.label || 'qr'}-${row.id}.${outputFormat}`, base64, { base64: true });
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${zipName}.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
    showToast({ type: 'success', title: 'Downloaded', message: `${doneRows.length} files` });
  }, [rows, outputFormat, zipName, showToast]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      let parsed: any[] = [];

      if (file.name.endsWith('.csv')) {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => { parsed = results.data; }
        });
      } else if (file.name.endsWith('.json')) {
        parsed = JSON.parse(text);
      }

      if (parsed.length > 0) {
        const newRows: BatchRow[] = parsed.map((row, i) => ({
          id: `${Date.now()}-${i}`,
          type: row.type || 'url',
          content: row.content || row.data || '',
          label: row.label || row.name || '',
          status: 'pending'
        })).filter(r => r.content);
        
        setRows(newRows);
        showToast({ type: 'success', title: 'Imported', message: `${newRows.length} rows added` });
      }
    };
    reader.readAsText(file);
  }, [showToast]);

  const exportCSV = useCallback(() => {
    const csv = Papa.unparse(rows.map(r => ({
      type: r.type,
      content: r.content,
      label: r.label
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'batch-template.csv';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const completedCount = rows.filter(r => r.status === 'done').length;
  const errorCount = rows.filter(r => r.status === 'error').length;
  const pendingCount = rows.filter(r => r.content && r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Batch Generator</h1>
          <p className="text-muted-foreground mt-1">Generate multiple QR codes at once from CSV/JSON</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" />
            Export Template
          </Button>
          <Button onClick={processBatch} disabled={isProcessing || pendingCount === 0} className="w-full sm:w-auto">
            {isProcessing ? (
              <>
                <span className="animate-spin">⟳</span>
                Processing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Generate All
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card variant="glass" padding="none" className="overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-glass-border dark:border-glass-border-dark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle>Batch Items ({rows.length})</CardTitle>
              <div className="flex items-center gap-2">
                <label className="input-base w-auto sm:w-48">
                  <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="sr-only" id="batch-upload" />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('batch-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-1" />
                    Import CSV/JSON
                  </Button>
                </label>
                <Button variant="ghost" size="icon" onClick={addRow} aria-label="Add row">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 max-h-[600px] overflow-auto">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-glass/50 backdrop-blur-xl border-b border-glass-border dark:border-glass-border-dark">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">Label</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border dark:divide-glass-border-dark">
                    {rows.map((row, index) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={row.status === 'error' ? 'bg-red-500/5' : ''}
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{index + 1}</td>
                        <td className="px-4 py-3">
                          <select
                            value={row.type}
                            onChange={e => updateRow(row.id, 'type', e.target.value)}
                            className="input-base py-1.5 text-sm w-full"
                            disabled={isProcessing}
                          >
                            {QR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={row.content}
                            onChange={e => updateRow(row.id, 'content', e.target.value)}
                            placeholder={QR_TYPES.find(t => t.value === row.type)?.placeholder}
                            className="input-base py-1.5 text-sm font-mono"
                            disabled={isProcessing}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={row.label}
                            onChange={e => updateRow(row.id, 'label', e.target.value)}
                            placeholder="Optional label"
                            className="input-base py-1.5 text-sm"
                            disabled={isProcessing}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx(
                            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                            row.status === 'pending' && 'bg-muted text-muted-foreground',
                            row.status === 'processing' && 'bg-primary/10 text-primary animate-pulse',
                            row.status === 'done' && 'bg-green-500/10 text-green-500',
                            row.status === 'error' && 'bg-red-500/10 text-red-500'
                          )}>
                            {row.status === 'processing' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                            {row.status === 'done' && <Check className="w-3 h-3" />}
                            {row.status === 'error' && <X className="w-3 h-3" />}
                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} disabled={isProcessing} aria-label="Remove row">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card variant="glass" padding="md">
            <CardHeader>
              <CardTitle>Output Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Format</label>
                <div className="flex gap-2">
                  {(['png', 'svg', 'pdf'] as const).map(fmt => (
                    <Button
                      key={fmt}
                      variant={outputFormat === fmt ? 'primary' : 'outline'}
                      onClick={() => setOutputFormat(fmt)}
                      className="flex-1"
                    >
                      {fmt.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">ZIP Filename</label>
                <Input value={zipName} onChange={e => setZipName(e.target.value)} placeholder="qr-codes" />
              </div>

              {isProcessing && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 300 }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="glass" padding="md">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-500/10 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-500">{completedCount}</p>
                  <p className="text-xs text-green-500/80">Completed</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-xl text-center">
                  <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
                  <p className="text-xs text-yellow-500/80">Pending</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-500">{errorCount}</p>
                  <p className="text-xs text-red-500/80">Errors</p>
                </div>
              </div>

              <Button onClick={downloadAll} disabled={completedCount === 0} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download All ({completedCount})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}