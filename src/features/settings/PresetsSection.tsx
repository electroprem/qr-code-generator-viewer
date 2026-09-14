import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Copy,
  Download,
  Upload,
  Palette,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { ColorPicker } from '@components/ui/ColorPicker';
import { useToast } from '@components/providers/ToastProvider';
import { useQRStore } from '@store/qrStore';

interface ColorPreset {
  id: string;
  name: string;
  foreground: string;
  background: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    rotation: number;
  };
  dotStyle?: string;
  cornerStyle?: string;
  isDefault?: boolean;
}

const DEFAULT_PRESETS: ColorPreset[] = [
  {
    id: 'classic',
    name: 'Classic',
    foreground: '#000000',
    background: '#ffffff',
    isDefault: true,
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    foreground: '#ffffff',
    background: '#1a1a1a',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    foreground: '#0369a1',
    background: '#e0f2fe',
    gradient: { type: 'linear', colors: ['#0369a1', '#0284c7'], rotation: 45 },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    foreground: '#ea580c',
    background: '#fff7ed',
    gradient: { type: 'linear', colors: ['#ea580c', '#f97316', '#fbbf24'], rotation: 90 },
  },
  {
    id: 'forest',
    name: 'Forest',
    foreground: '#166534',
    background: '#f0fdf4',
    gradient: { type: 'radial', colors: ['#166534', '#22c55e'], rotation: 0 },
  },
  {
    id: 'royal',
    name: 'Royal',
    foreground: '#4c1d95',
    background: '#faf5ff',
    gradient: { type: 'linear', colors: ['#4c1d95', '#8b5cf6', '#d946ef'], rotation: 135 },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    foreground: '#374151',
    background: '#f9fafb',
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    foreground: '#000000',
    background: '#ffff00',
  },
];

export function PresetsSection({ className }: { className?: string }) {
  const { showToast } = useToast();
  const [presets, setPresets] = useState<ColorPreset[]>(() => {
    const saved = localStorage.getItem('color-presets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_PRESETS;
      }
    }
    return DEFAULT_PRESETS;
  });
  const [editingPreset, setEditingPreset] = useState<ColorPreset | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newPreset, setNewPreset] = useState<Partial<ColorPreset>>({
    name: '',
    foreground: '#000000',
    background: '#ffffff',
  });

  useEffect(() => {
    localStorage.setItem('color-presets', JSON.stringify(presets));
  }, [presets]);

  const applyPreset = useCallback((preset: ColorPreset) => {
    const { currentSettings, setSettings } = useQRStore.getState();
    setSettings({
      dotsOptions: {
        ...currentSettings.dotsOptions,
        color: preset.foreground,
        gradient: preset.gradient,
      },
      backgroundOptions: {
        ...currentSettings.backgroundOptions,
        color: preset.background,
      },
      dotsOptions: {
        ...currentSettings.dotsOptions,
        type: preset.dotStyle || currentSettings.dotsOptions?.type,
      },
      cornersSquareOptions: {
        ...currentSettings.cornersSquareOptions,
        type: preset.cornerStyle || currentSettings.cornersSquareOptions?.type,
      },
    });
    showToast({ type: 'success', title: 'Preset applied', message: preset.name });
  }, [showToast]);

  const handleAddPreset = useCallback(() => {
    if (!newPreset.name.trim()) {
      showToast({ type: 'error', title: 'Name required' });
      return;
    }
    const preset: ColorPreset = {
      id: `custom-${Date.now()}`,
      name: newPreset.name.trim(),
      foreground: newPreset.foreground || '#000000',
      background: newPreset.background || '#ffffff',
      gradient: newPreset.gradient,
      dotStyle: newPreset.dotStyle,
      cornerStyle: newPreset.cornerStyle,
    };
    setPresets([...presets, preset]);
    setNewPreset({ name: '', foreground: '#000000', background: '#ffffff' });
    setShowModal(false);
    showToast({ type: 'success', title: 'Preset created' });
  }, [newPreset, presets, showToast]);

  const handleUpdatePreset = useCallback(() => {
    if (!editingPreset || !newPreset.name.trim()) return;
    setPresets(presets.map((p) => (p.id === editingPreset.id ? { ...p, ...newPreset } as ColorPreset : p)));
    setEditingPreset(null);
    setNewPreset({ name: '', foreground: '#000000', background: '#ffffff' });
    setShowModal(false);
    showToast({ type: 'success', title: 'Preset updated' });
  }, [editingPreset, newPreset, presets, showToast]);

  const handleDeletePreset = useCallback((id: string) => {
    if (!confirm('Delete this preset?')) return;
    setPresets(presets.filter((p) => p.id !== id));
    showToast({ type: 'success', title: 'Preset deleted' });
  }, [presets, showToast]);

  const handleEditPreset = useCallback((preset: ColorPreset) => {
    setEditingPreset(preset);
    setNewPreset({ ...preset });
    setShowModal(true);
  }, []);

  const handleDuplicatePreset = useCallback((preset: ColorPreset) => {
    const newPreset: ColorPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      name: `${preset.name} Copy`,
    };
    setPresets([...presets, newPreset]);
    showToast({ type: 'success', title: 'Preset duplicated' });
  }, [presets, showToast]);

  const exportPresets = useCallback(() => {
    const data = JSON.stringify(presets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-presets-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Presets exported' });
  }, [presets, showToast]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setPresets([...presets, ...imported]);
          showToast({ type: 'success', title: 'Presets imported', message: `${imported.length} presets added` });
        }
      } catch {
        showToast({ type: 'error', title: 'Invalid preset file' });
      }
    };
    reader.readAsText(file);
  }, [presets, showToast]);

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-6', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Color Presets
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Quick color combinations for your QR codes</p>
          </div>
          <Button onClick={() => { setEditingPreset(null); setNewPreset({ name: '', foreground: '#000000', background: '#ffffff' }); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-1" />
            New Preset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {presets.map((preset) => (
            <motion.div
              key={preset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative"
            >
              <Card variant="glass" padding="none" className="overflow-hidden h-full">
                <div className="aspect-square relative">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: preset.gradient
                        ? `${preset.gradient.type}-gradient(${preset.gradient.rotation}deg, ${preset.gradient.colors.join(', ')})`
                        : preset.background,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-lg"
                      style={{
                        background: preset.gradient
                          ? `${preset.gradient.type}-gradient(${preset.gradient.rotation}deg, ${preset.gradient.colors.join(', ')})`
                          : preset.foreground,
                        maskImage: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\'><path d=\'M1 12s4-8 11-8 11 8 11 8-4 8-11 8\'/><circle cx=\'12\' cy=\'12\' r=\'3\'/></svg>")',
                        WebkitMaskImage: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\'><path d=\'M1 12s4-8 11-8 11 8 11 8-4 8-11 8\'/><circle cx=\'12\' cy=\'12\' r=\'3\'/></svg>")',
                        maskSize: '60%',
                        maskPosition: 'center',
                        WebkitMaskSize: '60%',
                        WebkitMaskPosition: 'center',
                      }}
                    />
                  </div>
                  {preset.isDefault && (
                    <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">Default</span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground truncate">{preset.name}</h4>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownTrigger>
                      <div className="dropdown-menu dropdown-menu-end">
                        <DropdownItem onClick={() => applyPreset(preset)}>
                          <Check className="w-4 h-4" />
                          Apply
                        </DropdownItem>
                        <DropdownItem onClick={() => handleEditPreset(preset)}>
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </DropdownItem>
                        <DropdownItem onClick={() => handleDuplicatePreset(preset)}>
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </DropdownItem>
                        {!preset.isDefault && (
                          <>
                            <hr className="border-glass-border dark:border-glass-border-dark my-1" />
                            <DropdownItem onClick={() => handleDeletePreset(preset.id)} className="text-red-500">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownItem>
                          </>
                        )}
                      </div>
                    </Dropdown>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded border" style={{ backgroundColor: preset.foreground }} title="Foreground" />
                    <div className="w-3 h-3 rounded border" style={{ backgroundColor: preset.background }} title="Background" />
                    {preset.gradient && (
                      <span className="text-primary">✦ Gradient</span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportPresets}>
            <Download className="w-4 h-4 mr-1" />
            Export All
          </Button>
          <label className="flex items-center">
            <input type="file" accept=".json" onChange={handleImport} className="sr-only" id="preset-import" />
            <Button variant="outline" onClick={() => document.getElementById('preset-import')?.click()}>
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
          </label>
          <Button variant="outline" onClick={() => {
            if (confirm('Reset to default presets?')) {
              setPresets(DEFAULT_PRESETS);
              showToast({ type: 'success', title: 'Presets reset' });
            }
          }}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset Defaults
          </Button>
        </div>
      </CardContent>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPreset(null); setNewPreset({ name: '', foreground: '#000000', background: '#ffffff' }); }}
        title={editingPreset ? 'Edit Preset' : 'New Preset'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <Input
              value={newPreset.name}
              onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
              placeholder="My Preset"
              className="w-full"
              autoFocus
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Foreground</label>
              <div className="flex items-center gap-2">
                <ColorPicker
                  value={newPreset.foreground || '#000000'}
                  onChange={(color) => setNewPreset({ ...newPreset, foreground: color })}
                  className="w-10 h-10 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
                />
                <Input
                  type="text"
                  value={newPreset.foreground}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setNewPreset({ ...newPreset, foreground: e.target.value });
                  }}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Background</label>
              <div className="flex items-center gap-2">
                <ColorPicker
                  value={newPreset.background || '#ffffff'}
                  onChange={(color) => setNewPreset({ ...newPreset, background: color })}
                  className="w-10 h-10 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
                />
                <Input
                  type="text"
                  value={newPreset.background}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setNewPreset({ ...newPreset, background: e.target.value });
                  }}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={!!newPreset.gradient}
                onChange={(e) => setNewPreset({ ...newPreset, gradient: e.target.checked ? { type: 'linear', colors: ['#3b82f6', '#8b5cf6'], rotation: 0 } : undefined })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-foreground">Enable Gradient</p>
                <p className="text-xs text-muted-foreground">Apply gradient to foreground</p>
              </div>
            </label>
          </div>

          {newPreset.gradient && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pl-4 border-l-2 border-glass-border dark:border-glass-border-dark"
            >
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Start Color</label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      value={newPreset.gradient.colors[0]}
                      onChange={(color) => setNewPreset({ ...newPreset, gradient: { ...newPreset.gradient!, colors: [color, newPreset.gradient!.colors[1]] } })}
                      className="w-10 h-10 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={newPreset.gradient.colors[0]}
                      onChange={(e) => {
                        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setNewPreset({ ...newPreset, gradient: { ...newPreset.gradient!, colors: [e.target.value, newPreset.gradient!.colors[1]] } });
                      }}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">End Color</label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      value={newPreset.gradient.colors[1]}
                      onChange={(color) => setNewPreset({ ...newPreset, gradient: { ...newPreset.gradient!, colors: [newPreset.gradient!.colors[0], color] } })}
                      className="w-10 h-10 rounded-lg border border-glass-border dark:border-glass-border-dark cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={newPreset.gradient.colors[1]}
                      onChange={(e) => {
                        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setNewPreset({ ...newPreset, gradient: { ...newPreset.gradient!, colors: [newPreset.gradient!.colors[0], e.target.value] } });
                      }}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                  <select
                    value={newPreset.gradient.type}
                    onChange={(e) => setNewPreset({ ...newPreset, gradient: { ...newPreset.gradient!, type: e.target.value as any } })}
                    className="input-base w-full"
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center justify-between">
                  Rotation: {newPreset.gradient.rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={newPreset.gradient.rotation}
                  onChange={(e) => setNewPreset({ ...newPreset, gradient: { ...newPreset.gradient!, rotation: Number(e.target.value) } })}
                  className="w-full"
                />
              </div>
            </motion.div>
          )}

          <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowModal(false); setEditingPreset(null); setNewPreset({ name: '', foreground: '#000000', background: '#ffffff' }); }}>
              Cancel
            </Button>
            <Button onClick={editingPreset ? handleUpdatePreset : handleAddPreset}>
              {editingPreset ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}