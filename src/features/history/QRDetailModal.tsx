import { useState, useCallback } from 'react';
import {
  Download,
  Copy,
  ExternalLink,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  User,
  Calendar,
  Smartphone,
  Bitcoin,
  QrCode,
  RotateCcw,
  Edit2,
  Share2,
  Trash2,
  Settings,
  Star,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Modal } from '@components/ui/Modal';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { Input } from '@components/ui/Input';
import { Tabs, TabList, TabTrigger, TabContent } from '@components/ui/Tabs';
import { QRCodeEngine } from '@lib/qr/qrEngine';
import { useQRStore } from '@store/qrStore';
import { useToast } from '@components/providers/ToastProvider';
import type { QRRecord } from '@lib/storage/indexedDB';

function getTypeIcon(type: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    url: <QrCode className="w-5 h-5" />,
    text: <span className="text-xl">📝</span>,
    email: <Mail className="w-5 h-5" />,
    phone: <Phone className="w-5 h-5" />,
    sms: <MessageSquare className="w-5 h-5" />,
    wifi: <Wifi className="w-5 h-5" />,
    vcard: <User className="w-5 h-5" />,
    location: <MapPin className="w-5 h-5" />,
    whatsapp: <MessageSquare className="w-5 h-5" />,
    upi: <span className="text-xl">💰</span>,
    crypto: <Bitcoin className="w-5 h-5" />,
    calendar: <Calendar className="w-5 h-5" />,
    applink: <Smartphone className="w-5 h-5" />,
  };
  return icons[type] || <QrCode className="w-5 h-5" />;
}


function parseQRData(type: string, data: string): Record<string, string> {
  const result: Record<string, string> = { Raw: data };
  
  try {
    switch (type) {
      case 'url':
        result.URL = data;
        break;
      case 'email':
        if (data.startsWith('mailto:')) {
          const email = data.slice(7);
          const [addr, params] = email.split('?');
          result.Email = addr;
          if (params) {
            new URLSearchParams(params).forEach((v, k) => { result[k.charAt(0).toUpperCase() + k.slice(1)] = v; });
          }
        }
        break;
      case 'phone':
        result.Phone = data.replace(/^tel:/, '');
        break;
      case 'sms':
        if (data.startsWith('sms:')) {
          const [num, body] = data.slice(4).split('?');
          result.Phone = num;
          if (body) result.Message = new URLSearchParams(body).get('body') || '';
        }
        break;
      case 'wifi':
        if (data.startsWith('WIFI:')) {
          const params = data.slice(5).split(';');
          params.forEach((p) => {
            const [k, v] = p.split(':');
            if (k && v) result[k === 'T' ? 'Security' : k === 'S' ? 'SSID' : k === 'P' ? 'Password' : k] = v;
          });
        }
        break;
      case 'vcard':
        const lines = data.split('\n');
        lines.forEach((line) => {
          const [k, ...v] = line.split(':');
          if (k && v.length) result[k] = v.join(':');
        });
        break;
      case 'location':
        if (data.startsWith('geo:')) {
          const coords = data.slice(4).split(',');
          result.Latitude = coords[0];
          result.Longitude = coords[1];
          if (coords[2]) result.Altitude = coords[2];
        }
        break;
      case 'whatsapp':
        if (data.startsWith('https://wa.me/')) {
          const [num, params] = data.slice(14).split('?');
          result.Phone = num;
          if (params) result.Message = new URLSearchParams(params).get('text') || '';
        }
        break;
      case 'upi':
        if (data.startsWith('upi://pay?')) {
          new URLSearchParams(data.slice(10)).forEach((v, k) => { result[k.toUpperCase()] = v; });
        }
        break;
      case 'crypto':
        if (data.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$|^0x[a-fA-F0-9]{40}$/)) {
          result.Address = data;
        }
        break;
      case 'calendar':
        if (data.startsWith('BEGIN:VEVENT')) {
          const lines = data.split('\n');
          lines.forEach((line) => {
            const [k, ...v] = line.split(':');
            if (k && v.length) result[k] = v.join(':');
          });
        }
        break;
      case 'applink':
        result['App Link'] = data;
        break;
    }
  } catch {
    // Ignore parse errors
  }
  
  return result;
}

interface QRDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  qr: QRRecord | null;
  onAction: (action: string, data?: any) => void;
}

export function QRDetailModal({ isOpen, onClose, qr, onAction }: QRDetailModalProps) {
  const { showToast } = useToast();
  const { currentSettings } = useQRStore();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'export' | 'regenerate'>('details');

  const handleCopy = useCallback(async () => {
    if (!qr) return;
    try {
      await navigator.clipboard.writeText(qr.data);
      setCopied(true);
      showToast({ type: 'success', title: 'Data copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({ type: 'error', title: 'Failed to copy' });
    }
  }, [qr, showToast]);

  const handleCopyImage = useCallback(async () => {
    if (!qr) return;
    try {
      const response = await fetch(qr.png);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast({ type: 'success', title: 'Image copied to clipboard' });
    } catch {
      showToast({ type: 'error', title: 'Failed to copy image' });
    }
  }, [qr, showToast]);

  const handleDownload = useCallback(async (format: string) => {
    if (!qr) return;
    try {
      const response = await fetch(qr.png);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr-${qr.type}-${qr.id.slice(0, 8)}.${format}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', title: `Downloaded as ${format.toUpperCase()}` });
    } catch {
      showToast({ type: 'error', title: 'Download failed' });
    }
  }, [qr, showToast]);

  const handleRegenerate = useCallback(async (options?: Partial<QRRecord['settings']>) => {
    if (!qr) return;
    setRegenerating(true);
    try {
      const engine = new QRCodeEngine();
      const settings = { ...qr.settings, ...options, ...currentSettings };
      const result = await engine.generate({
        data: qr.data,
        ...settings,
      });
      
      onAction('regenerate', { ...qr, ...result, settings });
      showToast({ type: 'success', title: 'QR code regenerated' });
    } catch {
      showToast({ type: 'error', title: 'Regeneration failed' });
    } finally {
      setRegenerating(false);
    }
  }, [qr, currentSettings, onAction, showToast]);

  const handleAction = useCallback((action: string) => {
    onAction(action, qr);
    if (action !== 'regenerate') onClose();
  }, [qr, onAction, onClose]);

  const parsedData = useMemo(() => qr ? parseQRData(qr.type, qr.data) : {}, [qr]);

  if (!qr) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={qr.type.toUpperCase()}
      size="xl"
      showClose
      closeOnOverlayClick
      closeOnEscape
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'details' | 'regenerate' | 'export')} className="w-full">
          <TabList className="w-full">
            <TabTrigger value="details" className="flex-1">Details</TabTrigger>
            <TabTrigger value="export" className="flex-1">Export</TabTrigger>
            <TabTrigger value="regenerate" className="flex-1">Regenerate</TabTrigger>
          </TabList>

          <TabContent value="details" className="space-y-6 pt-4">
            <div className="flex justify-center">
              <div className="relative w-[300px] h-[300px] max-w-full">
                <img src={qr.png} alt={`QR code: ${qr.type}`} className="w-full h-full rounded-lg shadow-xl" />
                {qr.favorite && (
                  <div className="absolute -top-2 -right-2">
                    <Star className="w-6 h-6 text-yellow-500 fill-current drop-shadow-lg" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Card variant="glass" padding="md">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  {getTypeIcon(qr.type)}
                  Parsed Data
                </h4>
                <dl className="space-y-3 max-h-[400px] overflow-auto">
                  {Object.entries(parsedData).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-surface rounded-lg">
                      <dt className="text-sm font-medium text-muted-foreground w-24 sm:w-32 flex-shrink-0">{key}</dt>
                      <dd className="flex-1 font-mono text-sm text-foreground break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card variant="glass" padding="md">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Generation Settings
                </h4>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Size</dt>
                    <dd className="font-medium">{qr.settings.width} × {qr.settings.height} px</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Error Correction</dt>
                    <dd className="font-medium">{qr.settings.errorCorrectionLevel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Margin</dt>
                    <dd className="font-medium">{qr.settings.margin}px</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Version</dt>
                    <dd className="font-medium">{String(qr.settings.version || 'Auto')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Mode</dt>
                    <dd className="font-medium">{String(qr.settings.mode || 'Default')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Dot Style</dt>
                    <dd className="font-medium capitalize">{String(qr.settings.dotsOptions?.type || 'Default')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Corner Style</dt>
                    <dd className="font-medium capitalize">{String(qr.settings.cornersSquareOptions?.type || 'Default')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Background</dt>
                    <dd className="font-medium">
                      {String(qr.settings.backgroundOptions?.color || 'Transparent')}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Logo</dt>
                    <dd className="font-medium">{qr.settings.imageOptions?.image ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </Card>
            </div>

            <Card variant="glass" padding="md">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Metadata
              </h4>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">{new Date(qr.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="font-medium">{new Date(qr.updatedAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">ID</dt>
                  <dd className="font-mono text-xs truncate max-w-[150px]">{qr.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium capitalize">{qr.type}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Favorite</dt>
                  <dd className="font-medium">{qr.favorite ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tags</dt>
                  <dd className="font-medium">
                    {qr.tags.length > 0 ? qr.tags.map(t => `#${t}`).join(', ') : 'None'}
                  </dd>
                </div>
              </div>
            </Card>

            <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-glass-border dark:border-glass-border-dark">
              <Tooltip content="Copy data">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy Data'}
                </Button>
              </Tooltip>
              <Tooltip content="Copy image">
                <Button variant="outline" onClick={handleCopyImage}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Image
                </Button>
              </Tooltip>
              <Dropdown>
                <DropdownTrigger>
                  <Tooltip content="Share">
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </Tooltip>
                </DropdownTrigger>
                <div className="dropdown-menu dropdown-menu-end">
                  <DropdownItem value="share-image" onClick={() => { handleAction('share'); }}>
                    <Share2 className="w-4 h-4" />
                    Share Image
                  </DropdownItem>
                  <DropdownItem value="share-data" onClick={() => { navigator.share({ text: qr.data }); }}>
                    <ExternalLink className="w-4 h-4" />
                    Share Data
                  </DropdownItem>
                </div>
              </Dropdown>
              <Tooltip content="Open in generator">
                <Button variant="primary" onClick={() => handleAction('edit')}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </Tooltip>
            </div>
          </TabContent>

          <TabContent value="export" className="space-y-6 pt-4">
            <Card variant="glass" padding="md">
              <h4 className="font-medium text-foreground mb-4">Export Options</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Format</label>
                  <div className="flex flex-wrap gap-2">
                    {(['png', 'svg', 'pdf', 'jpeg', 'webp'] as const).map((fmt) => (
                      <Button
                        key={fmt}
                        variant="outline"
                        onClick={() => handleDownload(fmt)}
                        className="flex-1 min-w-[80px]"
                      >
                        {fmt.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">DPI</label>
                    <Input
                      type="number"
                      defaultValue={300}
                      min={72}
                      max={600}
                      step={72}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Margin (px)</label>
                    <Input
                      type="number"
                      defaultValue={qr.settings.margin}
                      min={0}
                      max={100}
                      step={4}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Filename Pattern</label>
                  <Input
                    defaultValue={`qr-{type}-{id}`}
                    placeholder="qr-{type}-{id}"
                    className="w-full"
                  />
                </div>

                <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
                  <Button onClick={() => handleDownload('png')} className="w-full sm:w-auto" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Export PNG
                  </Button>
                </div>
              </div>
            </Card>
          </TabContent>

          <TabContent value="regenerate" className="space-y-6 pt-4">
            <Card variant="glass" padding="md">
              <h4 className="font-medium text-foreground mb-4">Regenerate with Current Settings</h4>
              <p className="text-muted-foreground mb-4">
                Generate a new QR code using the same data but with your current default settings.
              </p>
              
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Size</label>
                    <Input
                      type="number"
                      defaultValue={currentSettings.width}
                      min={100}
                      max={2000}
                      step={50}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Error Correction</label>
                    <select className="input-base w-full" defaultValue={currentSettings.errorCorrectionLevel}>
                      <option value="L">Low (7%)</option>
                      <option value="M">Medium (15%)</option>
                      <option value="Q">Quartile (25%)</option>
                      <option value="H">High (30%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Margin</label>
                  <Input
                    type="number"
                    defaultValue={currentSettings.margin}
                    min={0}
                    max={100}
                    step={4}
                    className="w-full sm:w-48"
                  />
                </div>

                <Button
                  onClick={() => handleRegenerate(currentSettings)}
                  disabled={regenerating}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {regenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Regenerate QR Code
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card variant="glass" padding="md" className="border-destructive/20">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                Danger Zone
              </h4>
              <div className="flex items-center gap-3">
                <Button variant="destructive" onClick={() => handleAction('delete')}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Permanently
                </Button>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </Card>
          </TabContent>
        </Tabs>
      </div>
    </Modal>
  );
}

import { useMemo } from 'react';