import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
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
  Download,
  Share2,
  RotateCcw,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { Tabs, TabList, TabTrigger, TabContent } from '@components/ui/CompoundTabs';
import { useToast } from '@components/providers/ToastProvider';
import { useQRStore } from '@store/qrStore';
import { QRCodeEngine } from '@lib/qr/qrEngine';

interface ScanResultProps {
  result: string | null;
  onAction: (action: string, data?: any) => void;
  onClose: () => void;
  className?: string;
}

function detectQRType(data: string): string {
  if (data.startsWith('http')) return 'url';
  if (data.startsWith('mailto:')) return 'email';
  if (data.startsWith('tel:')) return 'phone';
  if (data.startsWith('sms:')) return 'sms';
  if (data.startsWith('WIFI:')) return 'wifi';
  if (data.startsWith('BEGIN:VCARD')) return 'vcard';
  if (data.startsWith('geo:')) return 'location';
  if (data.startsWith('https://wa.me/')) return 'whatsapp';
  if (data.startsWith('upi://pay')) return 'upi';
  if (data.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$|^0x[a-fA-F0-9]{40}$/)) return 'crypto';
  if (data.startsWith('BEGIN:VEVENT')) return 'calendar';
  if (data.startsWith('intent://') || data.startsWith('android-app://')) return 'applink';
  return 'text';
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
        result.Address = data;
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

function getTypeBadgeVariant(type: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' {
  const variants: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    url: 'primary', text: 'default', email: 'secondary', phone: 'success',
    sms: 'warning', wifi: 'primary', vcard: 'secondary', location: 'destructive',
    whatsapp: 'success', upi: 'warning', crypto: 'destructive', calendar: 'primary', applink: 'secondary',
  };
  return variants[type] || 'default';
}

export function ScanResult({ result, onAction, onClose, className }: ScanResultProps) {
  const { showToast } = useToast();
  const { currentSettings } = useQRStore();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'result' | 'qr' | 'save'>('result');

  if (!result) return null;

  const type = detectQRType(result);
  const parsedData = parseQRData(type, result);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      showToast({ type: 'success', title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({ type: 'error', title: 'Failed to copy' });
    }
  }, [result, showToast]);

  const handleGenerateQR = useCallback(async () => {
    setGenerating(true);
    try {
      const engine = new QRCodeEngine();
      const qrResult = await engine.generate({
        data: result,
        width: currentSettings.width,
        height: currentSettings.height,
        margin: currentSettings.margin,
        errorCorrectionLevel: currentSettings.errorCorrectionLevel,
      });
      setQrDataUrl(qrResult.dataUrl);
      showToast({ type: 'success', title: 'QR code generated' });
    } catch {
      showToast({ type: 'error', title: 'Failed to generate QR' });
    } finally {
      setGenerating(false);
    }
  }, [result, currentSettings, showToast]);

  const handleDownload = useCallback(async (format: string) => {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr-${type}-${Date.now()}.${format}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', title: `Downloaded as ${format.toUpperCase()}` });
    } catch {
      showToast({ type: 'error', title: 'Download failed' });
    }
  }, [qrDataUrl, type, showToast]);

  const handleSaveToHistory = useCallback(async () => {
    if (!qrDataUrl) {
      await handleGenerateQR();
      return;
    }
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const png = URL.createObjectURL(blob);
      
      const svgResult = await (async () => {
        const engine = new QRCodeEngine();
        await engine.generate({
          data: result,
          width: currentSettings.width,
          height: currentSettings.height,
          margin: currentSettings.margin,
          errorCorrectionLevel: currentSettings.errorCorrectionLevel,
        });
        return engine.getSVG();
      })();

      const thumbnailCanvas = document.createElement('canvas');
      thumbnailCanvas.width = 128;
      thumbnailCanvas.height = 128;
      const thumbCtx = thumbnailCanvas.getContext('2d')!;
      const img = new Image();
      img.src = qrDataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      thumbCtx.drawImage(img, 0, 0, 128, 128);
      const thumbnail = thumbnailCanvas.toDataURL('image/png');

      onAction('save', {
        data: result,
        type,
        svg: svgResult,
        png: qrDataUrl,
        thumbnail,
        settings: currentSettings,
        tags: [],
        favorite: false,
      });
      showToast({ type: 'success', title: 'Saved to history' });
    } catch {
      showToast({ type: 'error', title: 'Failed to save' });
    }
  }, [qrDataUrl, result, type, currentSettings, onAction, handleGenerateQR, showToast]);

  const handleShare = useCallback(async () => {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `qr-${type}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `QR Code: ${type}` });
      } else {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast({ type: 'success', title: 'Image copied to clipboard' });
      }
    } catch {
      showToast({ type: 'error', title: 'Share failed' });
    }
  }, [qrDataUrl, type, showToast]);

  const getActionButtons = () => {
    const buttons = [
      <Tooltip key="copy" content="Copy">
        <Button variant="ghost" size="icon" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </Tooltip>,
    ];

    if (result.startsWith('http')) {
      buttons.push(
        <Tooltip key="open" content="Open URL">
          <Button variant="outline" size="sm" onClick={() => window.open(result, '_blank')}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Open
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('mailto:')) {
      buttons.push(
        <Tooltip key="email" content="Send Email">
          <Button variant="outline" size="sm" onClick={() => window.location.href = result}>
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('tel:')) {
      buttons.push(
        <Tooltip key="call" content="Call">
          <Button variant="outline" size="sm" onClick={() => window.location.href = result}>
            <Phone className="w-4 h-4 mr-1" />
            Call
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('sms:')) {
      buttons.push(
        <Tooltip key="sms" content="Send SMS">
          <Button variant="outline" size="sm" onClick={() => window.location.href = result}>
            <MessageSquare className="w-4 h-4 mr-1" />
            SMS
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('WIFI:')) {
      buttons.push(
        <Tooltip key="wifi" content="Connect WiFi">
          <Button variant="outline" size="sm" onClick={() => {
            showToast({ type: 'info', title: 'WiFi config', message: 'Copy to device WiFi settings' });
            handleCopy();
          }}>
            <Wifi className="w-4 h-4 mr-1" />
            Connect
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('BEGIN:VCARD')) {
      buttons.push(
        <Tooltip key="vcard" content="Save Contact">
          <Button variant="outline" size="sm" onClick={() => {
            showToast({ type: 'info', title: 'vCard', message: 'Save as .vcf file' });
          }}>
            <User className="w-4 h-4 mr-1" />
            Save Contact
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('geo:')) {
      buttons.push(
        <Tooltip key="map" content="Open Maps">
          <Button variant="outline" size="sm" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(result.slice(4))}`, '_blank')}>
            <MapPin className="w-4 h-4 mr-1" />
            Maps
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('https://wa.me/')) {
      buttons.push(
        <Tooltip key="whatsapp" content="Open WhatsApp">
          <Button variant="outline" size="sm" onClick={() => window.open(result, '_blank')}>
            <MessageSquare className="w-4 h-4 mr-1" />
            WhatsApp
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('upi://pay')) {
      buttons.push(
        <Tooltip key="upi" content="Open UPI App">
          <Button variant="outline" size="sm" onClick={() => window.open(result, '_blank')}>
            <Smartphone className="w-4 h-4 mr-1" />
            Pay
          </Button>
        </Tooltip>
      );
    }

    return buttons;
  };

  return (
    <Card variant="glass" padding="none" className={clsx('overflow-hidden', className)}>
      <div className="p-4 border-b border-glass-border dark:border-glass-border-dark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {getTypeIcon(type)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Scan Result</h3>
            <p className="text-xs text-muted-foreground">{type.toUpperCase()} detected</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Close">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="w-5 h-5" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabList className="w-full border-b border-glass-border dark:border-glass-border-dark">
          <TabTrigger value="result" className="flex-1">Result</TabTrigger>
          {qrDataUrl && <TabTrigger value="qr" className="flex-1">QR Code</TabTrigger>}
          <TabTrigger value="save" className="flex-1">Save</TabTrigger>
        </TabList>

        <TabContent value="result" className="p-4 space-y-4">
          <div className="p-4 bg-surface/50 rounded-xl font-mono text-sm break-all max-h-64 overflow-auto">
            {result}
          </div>

          <h4 className="font-medium text-foreground">Parsed Data</h4>
          <dl className="space-y-3 max-h-64 overflow-auto">
            {Object.entries(parsedData).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-surface rounded-lg">
                <dt className="text-sm font-medium text-muted-foreground w-24 sm:w-32 flex-shrink-0">{key}</dt>
                <dd className="flex-1 font-mono text-sm text-foreground break-all">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-glass-border dark:border-glass-border-dark">
            {getActionButtons()}
            <Tooltip content="Generate QR code">
              <Button variant="primary" onClick={handleGenerateQR} disabled={generating}>
                {generating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-1" />
                    Generate QR
                  </>
                )}
              </Button>
            </Tooltip>
          </div>
        </TabContent>

        <TabContent value="qr" className="p-4">
          {qrDataUrl ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={qrDataUrl}
                  alt={`Generated QR code: ${type}`}
                  className="max-w-[300px] w-full rounded-lg shadow-xl"
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Tooltip content="Download PNG">
                  <Button variant="outline" onClick={() => handleDownload('png')}>
                    <Download className="w-4 h-4 mr-1" />
                    PNG
                  </Button>
                </Tooltip>
                <Tooltip content="Download SVG">
                  <Button variant="outline" onClick={() => handleDownload('svg')}>
                    <Download className="w-4 h-4 mr-1" />
                    SVG
                  </Button>
                </Tooltip>
                <Tooltip content="Copy image">
                  <Button variant="outline" onClick={async () => {
                    try {
                      const res = await fetch(qrDataUrl!);
                      const blob = await res.blob();
                      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                      showToast({ type: 'success', title: 'Image copied' });
                    } catch { showToast({ type: 'error', title: 'Copy failed' }); }
                  }}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </Tooltip>
                <Tooltip content="Share">
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </Tooltip>
                <Tooltip content="Regenerate">
                  <Button variant="outline" onClick={handleGenerateQR} disabled={generating}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </Tooltip>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <p>Size: {currentSettings.width} × {currentSettings.height} px • EC: {currentSettings.errorCorrectionLevel}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <QrCode className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No QR code generated yet</p>
              <Button variant="primary" onClick={handleGenerateQR} disabled={generating} className="mt-4">
                {generating ? 'Generating...' : 'Generate QR Code'}
              </Button>
            </div>
          )}
        </TabContent>

        <TabContent value="save" className="p-4 space-y-4">
          <Card variant="glass" padding="md">
            <h4 className="font-medium text-foreground mb-4">Save to History</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Save this scan result to your history for future reference.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tags (comma separated)</label>
                <Input
                  placeholder="tag1, tag2, tag3"
                  className="w-full"
                />
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <div>
                  <p className="font-medium text-foreground">Mark as favorite</p>
                  <p className="text-xs text-muted-foreground">Quick access from favorites</p>
                </div>
              </label>
            </div>
            <Button onClick={handleSaveToHistory} className="w-full mt-4" disabled={generating}>
              <QrCode className="w-4 h-4 mr-2" />
              Save to History
            </Button>
          </Card>

          <Card variant="glass" padding="md" className="border-destructive/20">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Not what you expected?
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              The detected type might be incorrect. You can manually select the type and regenerate.
            </p>
            <div className="flex items-center gap-3">
              <select className="input-base py-1.5 flex-1">
                <option value="url">URL</option>
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
                <option value="wifi">WiFi</option>
                <option value="vcard">vCard</option>
                <option value="location">Location</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="upi">UPI</option>
                <option value="crypto">Crypto</option>
                <option value="calendar">Calendar</option>
                <option value="applink">App Link</option>
              </select>
              <Button variant="outline" onClick={handleGenerateQR} disabled={generating}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            </div>
          </Card>
        </TabContent>
      </Tabs>
    </Card>
  );
}

import { X } from 'lucide-react';
import { TabContent } from '@components/ui/Tabs';