import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Keyboard,
  Edit2,
  Check,
  X,
  RotateCcw,
  Download,
  Upload,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Tooltip } from '@components/ui/Tooltip';
import { useToast } from '@components/providers/ToastProvider';
import { useKeyboard } from '@components/providers/KeyboardProvider';

interface Shortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: string;
  description: string;
  editable: boolean;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'gen', key: 'G', ctrl: false, shift: false, alt: false, meta: false, action: 'goto-generator', description: 'Go to Generator', editable: false },
  { id: 'scan', key: 'S', ctrl: false, shift: false, alt: false, meta: false, action: 'goto-scanner', description: 'Go to Scanner', editable: false },
  { id: 'hist', key: 'H', ctrl: false, shift: false, alt: false, meta: false, action: 'goto-history', description: 'Go to History', editable: false },
  { id: 'batch', key: 'B', ctrl: false, shift: false, alt: false, meta: false, action: 'goto-batch', description: 'Go to Batch', editable: false },
  { id: 'settings', key: ',', ctrl: false, shift: false, alt: false, meta: false, action: 'open-settings', description: 'Open Settings', editable: false },
  { id: 'theme', key: 'T', ctrl: true, shift: true, alt: false, meta: false, action: 'toggle-theme', description: 'Toggle Theme', editable: false },
  { id: 'new', key: 'N', ctrl: true, shift: false, alt: false, meta: false, action: 'new-qr', description: 'New QR Code', editable: false },
  { id: 'generate', key: 'Enter', ctrl: false, shift: false, alt: false, meta: false, action: 'generate-scan', description: 'Generate / Scan', editable: false },
  { id: 'escape', key: 'Escape', ctrl: false, shift: false, alt: false, meta: false, action: 'close-modals', description: 'Close Modals / Stop Scan', editable: false },
  { id: 'copy', key: 'C', ctrl: true, shift: false, alt: false, meta: false, action: 'copy-result', description: 'Copy Result', editable: false },
  { id: 'download', key: 'D', ctrl: true, shift: false, alt: false, meta: false, action: 'download-result', description: 'Download Result', editable: false },
  { id: 'save', key: 'S', ctrl: true, shift: false, alt: false, meta: false, action: 'save-history', description: 'Save to History', editable: true },
  { id: 'favorite', key: 'F', ctrl: false, shift: false, alt: false, meta: false, action: 'toggle-favorite', description: 'Toggle Favorite', editable: true },
  { id: 'fullscreen', key: 'F', ctrl: true, shift: false, alt: false, meta: false, action: 'fullscreen', description: 'Fullscreen QR', editable: true },
  { id: 'regenerate', key: 'R', ctrl: false, shift: false, alt: false, meta: false, action: 'regenerate', description: 'Regenerate QR', editable: true },
]

export function ShortcutsSection({ className }: { className?: string }) {
  const { showToast } = useToast();
  const { registerShortcut } = useKeyboard();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    const saved = localStorage.getItem('keyboard-shortcuts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SHORTCUTS;
      }
    }
    return DEFAULT_SHORTCUTS;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKeys, setEditKeys] = useState({ key: '', ctrl: false, shift: false, alt: false, meta: false });
  const [listening, setListening] = useState(false);


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!listening || !editingId) return;
    e.preventDefault();
    
    const key = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;
    const meta = e.metaKey && !e.ctrlKey;

    if (key === 'Escape') {
      setListening(false);
      return;
    }

    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return;

    const newShortcut = { key, ctrl, shift, alt, meta };
    const conflict = shortcuts.find(
      (s) => s.id !== editingId && 
        s.key === newShortcut.key && 
        s.ctrl === newShortcut.ctrl && 
        s.shift === newShortcut.shift && 
        s.alt === newShortcut.alt && 
        s.meta === newShortcut.meta
    );

    if (conflict) {
      showToast({ type: 'warning', title: 'Shortcut conflict', message: `Already used by "${conflict.description}"` });
      return;
    }

    setShortcuts(shortcuts.map((s) =>
      s.id === editingId ? { ...s, ...newShortcut } : s
    ));
    setListening(false);
    setEditingId(null);
    showToast({ type: 'success', title: 'Shortcut updated' });
  }, [listening, editingId, shortcuts, showToast]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    localStorage.setItem('keyboard-shortcuts', JSON.stringify(shortcuts));
    const unregisters = shortcuts
      .filter((s) => s.editable)
      .map((s) =>
        registerShortcut({
          key: s.key,
          ctrl: s.ctrl,
          shift: s.shift,
          alt: s.alt,
          meta: s.meta,
          action: () => {},
          description: s.description,
        })
      );
    return () => {
      unregisters.forEach((unreg) => unreg());
    };
  }, [shortcuts, registerShortcut]);

  const startEditing = (id: string) => {
    const shortcut = shortcuts.find((s) => s.id === id);
    if (shortcut) {
      setEditKeys({
        key: shortcut.key,
        ctrl: !!shortcut.ctrl,
        shift: !!shortcut.shift,
        alt: !!shortcut.alt,
        meta: !!shortcut.meta,
      });
      setEditingId(id);
      setListening(true);
    }
  };

  const saveEdit = (id: string) => {
    const shortcut = shortcuts.find((s) => s.id === id);
    if (shortcut && editKeys.key) {
      const conflict = shortcuts.find(
        (s) => s.id !== id && 
          s.key === editKeys.key && 
          s.ctrl === editKeys.ctrl && 
          s.shift === editKeys.shift && 
          s.alt === editKeys.alt && 
          s.meta === editKeys.meta
      );
      if (conflict) {
        showToast({ type: 'warning', title: 'Shortcut conflict', message: `Already used by "${conflict.description}"` });
        return;
      }
      setShortcuts(shortcuts.map((s) =>
        s.id === id ? { ...s, ...editKeys } : s
      ));
      showToast({ type: 'success', title: 'Shortcut updated' });
    }
    setEditingId(null);
    setListening(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setListening(false);
  };

  const resetToDefaults = () => {
    if (confirm('Reset all shortcuts to defaults?')) {
      setShortcuts(DEFAULT_SHORTCUTS);
      showToast({ type: 'success', title: 'Shortcuts reset' });
    }
  };

  const exportShortcuts = () => {
    const data = JSON.stringify(shortcuts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'keyboard-shortcuts.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Shortcuts exported' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setShortcuts(imported);
          showToast({ type: 'success', title: 'Shortcuts imported' });
        }
      } catch {
        showToast({ type: 'error', title: 'Invalid shortcuts file' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-6', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Global shortcuts available throughout the app</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportShortcuts}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <label className="flex items-center">
              <input type="file" accept=".json" onChange={handleImport} className="sr-only" id="shortcuts-import" />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('shortcuts-import')?.click()}>
                <Upload className="w-4 h-4 mr-1" />
                Import
              </Button>
            </label>
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-glass-border dark:border-glass-border-dark">
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-48">Shortcut</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/50 dark:divide-glass-border-dark/50">
              {shortcuts.map((shortcut, index) => (
                <motion.tr
                  key={shortcut.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <td className="px-3 py-3 text-sm text-muted-foreground font-mono">{index + 1}</td>
                  <td className="px-3 py-3">
                    <span className="font-medium text-foreground">{shortcut.action.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{shortcut.description}</td>
                  <td className="px-3 py-3">
                    {editingId === shortcut.id ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-mono text-sm min-w-[180px]">
                          {editKeys.ctrl && <kbd className="px-1.5 py-0.5 bg-primary/20 rounded">Ctrl</kbd>}
                          {editKeys.shift && <kbd className="px-1.5 py-0.5 bg-primary/20 rounded">Shift</kbd>}
                          {editKeys.alt && <kbd className="px-1.5 py-0.5 bg-primary/20 rounded">Alt</kbd>}
                          {editKeys.meta && <kbd className="px-1.5 py-0.5 bg-primary/20 rounded">Meta</kbd>}
                          <kbd className="px-1.5 py-0.5 bg-primary/20 rounded">{editKeys.key || 'Press key...'}</kbd>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => saveEdit(shortcut.id)} disabled={!editKeys.key}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={cancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border border-border flex items-center gap-1">
                          {shortcut.ctrl && <span>Ctrl + </span>}
                          {shortcut.shift && <span>Shift + </span>}
                          {shortcut.alt && <span>Alt + </span>}
                          {shortcut.meta && <span>Meta + </span>}
                          <span>{shortcut.key}</span>
                        </kbd>
                        {shortcut.editable && (
                          <Tooltip content="Edit shortcut">
                            <Button variant="ghost" size="icon" onClick={() => startEditing(shortcut.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Edit shortcut">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {!shortcut.editable && (
                      <Badge variant="outline" className="text-xs">System</Badge>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3">Quick Reference</h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              { keys: 'G', desc: 'Generator page' },
              { keys: 'S', desc: 'Scanner page' },
              { keys: 'H', desc: 'History page' },
              { keys: 'B', desc: 'Batch page' },
              { keys: ',', desc: 'Settings' },
              { keys: '⌘ + Shift + T', desc: 'Toggle theme' },
              { keys: '⌘ + N', desc: 'New QR code' },
              { keys: 'Enter', desc: 'Generate/Scan' },
              { keys: 'Escape', desc: 'Close/Stop' },
              { keys: '⌘ + C', desc: 'Copy result' },
              { keys: '⌘ + D', desc: 'Download' },
              { keys: '⌘ + S', desc: 'Save to history' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">{item.desc}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border border-border">
                  {item.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}