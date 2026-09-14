import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Database,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  HardDrive,
  BarChart2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { useToast } from '@components/providers/ToastProvider';
import { getStats, exportAll, importAll, clearAll } from '@lib/storage/indexedDB';
import type { DBStats, ExportData } from '@lib/storage/indexedDB';

interface StorageSectionProps {
  className?: string;
}

export function StorageSection({ className }: StorageSectionProps) {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DBStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to load stats', message: String(error) });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const data = await exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr-history-${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', title: 'History exported', message: `${data.records.length} records` });
    } catch (error) {
      showToast({ type: 'error', title: 'Export failed', message: String(error) });
    } finally {
      setExporting(false);
    }
  }, [showToast]);

  const handleImport = useCallback(async () => {
    if (!importFile) return;
    setImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const text = await importFile.text();
      const data: ExportData = JSON.parse(text);
      
      // Simulate progress
      const total = data.records.length;
      let imported = 0;
      
      for (let i = 0; i < data.records.length; i += 10) {
        const batch = data.records.slice(i, i + 10);
        const result = await importAll({ ...data, records: batch });
        imported += result;
        setImportProgress(Math.round(((i + 10) / total) * 100));
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      setImportResult({ success: imported, errors: [] });
      showToast({ type: 'success', title: 'Import complete', message: `${imported} records imported` });
      loadStats();
    } catch (error) {
      setImportResult({ success: 0, errors: [String(error)] });
      showToast({ type: 'error', title: 'Import failed', message: String(error) });
    } finally {
      setImporting(false);
    }
  }, [importFile, showToast, loadStats]);

  const handleClear = useCallback(async () => {
    if (!confirm('This will permanently delete ALL QR codes from history. Are you sure?')) return;
    if (!confirm('This action cannot be undone. Type "DELETE" to confirm.')) return;
    
    setClearing(true);
    try {
      await clearAll();
      showToast({ type: 'success', title: 'History cleared' });
      loadStats();
    } catch (error) {
      showToast({ type: 'error', title: 'Clear failed', message: String(error) });
    } finally {
      setClearing(false);
    }
  }, [showToast, loadStats]);

  const handleImportFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setShowImportModal(true);
    }
  }, []);

  if (loading) {
    return (
      <Card variant="glass" padding="md" className={clsx('space-y-6', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Storage
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Manage your local QR code storage</p>
        </CardHeader>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  const usedPercent = stats && stats.totalSize > 0 
    ? Math.min((stats.totalSize / (50 * 1024 * 1024)) * 100, 100) 
    : 0;

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-6', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Storage
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Manage your local QR code storage</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="glass" padding="md" className="text-center">
            <HardDrive className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{stats?.totalRecords || 0}</p>
            <p className="text-sm text-muted-foreground">Total QR Codes</p>
          </Card>
          <Card variant="glass" padding="md" className="text-center">
            <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{formatBytes(stats?.totalSize || 0)}</p>
            <p className="text-sm text-muted-foreground">Storage Used</p>
          </Card>
          <Card variant="glass" padding="md" className="text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{stats?.favoriteCount || 0}</p>
            <p className="text-sm text-muted-foreground">Favorites</p>
          </Card>
          <Card variant="glass" padding="md" className="text-center">
            <BarChart2 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-foreground">{Object.keys(stats?.tagCounts || {}).length}</p>
            <p className="text-sm text-muted-foreground">Unique Tags</p>
          </Card>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">Storage Quota</span>
            <span className="text-sm text-muted-foreground">{Math.round(usedPercent)}% used</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                usedPercent > 80 ? 'bg-red-500' : usedPercent > 60 ? 'bg-yellow-500' : 'bg-primary'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Estimated quota: 50MB (browser dependent) • Used: {formatBytes(stats?.totalSize || 0)}
          </p>
        </div>

        {stats && stats.byType && Object.keys(stats.byType).length > 0 && (
          <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
            <h4 className="font-medium text-foreground mb-3">By Type</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <Badge key={type} variant="outline" className="gap-1">
                  <span className="capitalize">{type}</span>
                  <span className="font-mono">{count}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {stats && stats.tagCounts && Object.keys(stats.tagCounts).length > 0 && (
          <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
            <h4 className="font-medium text-foreground mb-3">Top Tags</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([tag, count]) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <span className="font-mono">{count}</span>
                  </Badge>
                ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3">Data Range</h4>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-muted-foreground">Oldest Record</p>
              <p className="font-medium font-mono">{stats?.oldestRecord ? new Date(stats.oldestRecord).toLocaleString() : 'None'}</p>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <p className="text-muted-foreground">Newest Record</p>
              <p className="font-medium font-mono">{stats?.newestRecord ? new Date(stats.newestRecord).toLocaleString() : 'None'}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark flex flex-wrap gap-3">
          <Button onClick={handleExport} disabled={exporting} className="flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-1" />
            {exporting ? 'Exporting...' : 'Export All'}
          </Button>
          <label className="flex items-center flex-1 sm:flex-none">
            <input type="file" accept=".json" onChange={handleImportFileSelect} className="sr-only" id="storage-import" />
            <Button variant="outline" onClick={() => document.getElementById('storage-import')?.click()} disabled={importing} className="w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-1" />
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </label>
          <Button variant="outline" onClick={loadStats} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={handleClear} disabled={clearing} className="ml-auto">
            <Trash2 className="w-4 h-4 mr-1" />
            {clearing ? 'Clearing...' : 'Clear All'}
          </Button>
        </div>
      </CardContent>

      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); setImportProgress(0); }}
        title="Import History"
        size="md"
        showClose={!importing}
        closeOnOverlayClick={!importing}
        closeOnEscape={!importing}
      >
        <div className="space-y-4">
          {!importing && !importResult ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">Ready to import {importFile?.name || 'selected file'}</p>
              <p className="text-sm text-muted-foreground">This will merge with existing history, avoiding duplicates.</p>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => { setShowImportModal(false); setImportFile(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleImport}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Start Import
                </Button>
              </div>
            </div>
          ) : importing ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent mx-auto mb-4" />
              <p className="font-medium">Importing... {importProgress}%</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-4">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${importProgress}%` }}
                  transition={{ duration: 300 }}
                />
              </div>
            </div>
          ) : importResult ? (
            <div className="text-center py-4">
              {importResult.success > 0 ? (
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              )}
              <h3 className="font-semibold mb-1">
                {importResult.success > 0 ? 'Import Complete' : 'Import Failed'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {importResult.success} records imported
              </p>
              {importResult.errors.length > 0 && (
                <div className="text-left text-sm text-red-500 mb-4 max-h-32 overflow-auto">
                  {importResult.errors.slice(0, 5).map((e, i) => (
                    <p key={i} className="font-mono">{e}</p>
                  ))}
                  {importResult.errors.length > 5 && <p>...and {importResult.errors.length - 5} more</p>}
                </div>
              )}
              <Button onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}>
                Done
              </Button>
            </div>
          ) : null}
        </div>
      </Modal>
    </Card>
  );
}