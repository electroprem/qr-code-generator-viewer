import { useState } from 'react';
import { Palette, Monitor, Smartphone, Save, RefreshCw, Trash2, Download, Upload, Shield, Bell, Key, Moon, Sun, Cpu, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { useTheme } from '@components/providers/ThemeProvider';
import { useToast } from '@components/providers/ToastProvider';

export function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    autoSave: true,
    highContrast: false,
    reduceMotion: false,
    scanSound: true,
    hapticFeedback: true,
    defaultQRSize: 300,
    defaultErrorCorrection: 'M' as 'L' | 'M' | 'Q' | 'H',
    defaultFormat: 'png' as 'png' | 'svg' | 'pdf',
    scanHistoryLimit: 50,
    autoScan: false,
    torchDefault: false,
  });

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Match system preference' }
  ];

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings({
        autoSave: true,
        highContrast: false,
        reduceMotion: false,
        scanSound: true,
        hapticFeedback: true,
        defaultQRSize: 300,
        defaultErrorCorrection: 'M',
        defaultFormat: 'png',
        scanHistoryLimit: 50,
        autoScan: false,
        torchDefault: false,
      });
      showToast({ type: 'success', title: 'Settings reset' });
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-studio-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Settings exported' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setSettings(prev => ({ ...prev, ...imported }));
        showToast({ type: 'success', title: 'Settings imported' });
      } catch {
        showToast({ type: 'error', title: 'Invalid settings file' });
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (confirm('Clear all local data (history, settings, cache)? This cannot be undone.')) {
      localStorage.clear();
      showToast({ type: 'success', title: 'All data cleared', message: 'Reload the app to start fresh' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your QR Studio experience</p>
      </div>

      <Card variant="glass" padding="md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how QR Studio looks</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={clsx(
                      'relative p-4 rounded-xl border-2 transition-all duration-200 text-left',
                      theme === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50 hover:bg-surface'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-foreground">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    {theme === option.value && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
            <label className="block text-sm font-medium text-foreground mb-3">Accessibility</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={e => setSettings(prev => ({ ...prev, highContrast: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground">High Contrast</p>
                  <p className="text-xs text-muted-foreground">Increase color contrast for better visibility</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={e => setSettings(prev => ({ ...prev, reduceMotion: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground">Reduce Motion</p>
                  <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
                </div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            Generation Defaults
          </CardTitle>
          <CardDescription>Default values for new QR codes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Default Size (px)"
              type="number"
              min="100"
              max="2000"
              step="50"
              value={settings.defaultQRSize}
              onChange={e => setSettings(prev => ({ ...prev, defaultQRSize: Number(e.target.value) }))}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Error Correction</label>
              <select
                value={settings.defaultErrorCorrection}
                onChange={e => setSettings(prev => ({ ...prev, defaultErrorCorrection: e.target.value as any }))}
                className="input-base"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Default Format</label>
              <select
                value={settings.defaultFormat}
                onChange={e => setSettings(prev => ({ ...prev, defaultFormat: e.target.value as any }))}
                className="input-base"
              >
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Scan History Limit</label>
              <Input
                type="number"
                min="10"
                max="500"
                step="10"
                value={settings.scanHistoryLimit}
                onChange={e => setSettings(prev => ({ ...prev, scanHistoryLimit: Number(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Scanner Behavior
          </CardTitle>
          <CardDescription>Configure how the scanner works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.autoScan}
                  onChange={e => setSettings(prev => ({ ...prev, autoScan: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground">Auto-start Scanner</p>
                  <p className="text-xs text-muted-foreground">Begin scanning immediately when opening scanner page</p>
                </div>
              </div>
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.scanSound}
                  onChange={e => setSettings(prev => ({ ...prev, scanSound: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground">Scan Sound</p>
                  <p className="text-xs text-muted-foreground">Play sound when QR code is detected</p>
                </div>
              </div>
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.hapticFeedback}
                  onChange={e => setSettings(prev => ({ ...prev, hapticFeedback: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground">Haptic Feedback</p>
                  <p className="text-xs text-muted-foreground">Vibrate on successful scan (mobile)</p>
                </div>
              </div>
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.torchDefault}
                  onChange={e => setSettings(prev => ({ ...prev, torchDefault: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground">Flashlight by Default</p>
                  <p className="text-xs text-muted-foreground">Enable torch when scanner starts</p>
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>Import, export, or clear your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Settings
            </Button>
            <label className="flex items-center">
              <input type="file" accept=".json" onChange={handleImport} className="sr-only" id="settings-import" />
              <Button variant="outline" onClick={() => document.getElementById('settings-import')?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import Settings
              </Button>
            </label>
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Settings are stored locally in your browser. Export to backup or share between devices.
          </p>
        </CardContent>
      </Card>

      <Card variant="glass" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription>Global shortcuts available throughout the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: 'G', desc: 'Go to Generator' },
              { key: 'S', desc: 'Go to Scanner' },
              { key: 'H', desc: 'Go to History' },
              { key: 'B', desc: 'Go to Batch' },
              { key: ',', desc: 'Open Settings' },
              { key: 'T', ctrl: true, shift: true, desc: 'Toggle Theme' },
              { key: 'N', ctrl: true, desc: 'New QR Code' },
              { key: 'Enter', desc: 'Generate / Scan' },
              { key: 'Escape', desc: 'Close Modals / Stop Scan' },
              { key: 'C', ctrl: true, desc: 'Copy Result' },
              { key: 'D', ctrl: true, desc: 'Download Result' },
            ].map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface/50">
                <span className="text-sm text-foreground">{shortcut.desc}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border border-border">
                  {shortcut.ctrl ? '⌘' : ''}{shortcut.shift ? '⇧' : ''}{shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" padding="md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono text-foreground">2.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Build</span>
            <span className="font-mono text-foreground">Vite + React 18 + TypeScript</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">PWA</span>
            <span className="font-mono text-foreground">Enabled</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">License</span>
            <span className="font-mono text-foreground">MIT</span>
          </div>
          <Button variant="outline" className="w-full mt-4" onClick={() => window.open('https://github.com', '_blank')}>
            View on GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}