import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Star,
  Trash2,
  Download,
  Copy,
  Edit2,
  Plus,
  Share2,
  MoreVertical,
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
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { Modal } from '@components/ui/Modal';
import type { QRRecord } from '@lib/storage/indexedDB';
import { useQRStore } from '@store/qrStore';
import { useToast } from '@components/providers/ToastProvider';

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
    url: 'primary',
    text: 'default',
    email: 'secondary',
    phone: 'success',
    sms: 'warning',
    wifi: 'primary',
    vcard: 'secondary',
    location: 'destructive',
    whatsapp: 'success',
    upi: 'warning',
    crypto: 'destructive',
    calendar: 'primary',
    applink: 'secondary',
  };
  return variants[type] || 'default';
}

function formatDataPreview(data: string, maxLength = 80): string {
  if (data.length <= maxLength) return data;
  return data.slice(0, maxLength - 3) + '...';
}

interface HistoryCardProps {
  qr: QRRecord;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onAction: (action: string) => void;
}

export function HistoryCard({ qr, isSelected, onSelect, onAction }: HistoryCardProps) {
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(qr.data);
      setCopied(true);
      showToast({ type: 'success', title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({ type: 'error', title: 'Failed to copy' });
    }
  }, [qr.data, showToast]);

  const handleDownload = useCallback(async (format: string) => {
    try {
      const response = await fetch(qr.png);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr-${qr.type}-${qr.id.slice(0, 8)}.${format}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', title: 'Downloaded' });
    } catch {
      showToast({ type: 'error', title: 'Download failed' });
    }
  }, [qr.png, qr.type, qr.id, showToast]);

  const handleShare = useCallback(async () => {
    try {
      const response = await fetch(qr.png);
      const blob = await response.blob();
      const file = new File([blob], `qr-${qr.type}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `QR Code: ${qr.type}` });
      } else {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast({ type: 'success', title: 'Copied to clipboard' });
      }
    } catch {
      showToast({ type: 'error', title: 'Share failed' });
    }
  }, [qr.png, qr.type, showToast]);

  const actions = [
    { label: 'Download PNG', icon: Download, action: () => handleDownload('png') },
    { label: 'Download SVG', icon: Download, action: () => handleDownload('svg') },
    { label: 'Regenerate', icon: 'RotateCcw', action: () => onAction('regenerate') },
    { label: 'Edit', icon: Edit2, action: () => onAction('edit') },
    { label: 'Duplicate', icon: Plus, action: () => onAction('duplicate') },
    { label: 'Share', icon: Share2, action: handleShare },
    { label: 'Delete', icon: Trash2, action: () => onAction('delete'), destructive: true },
  ];

  return (
    <>
      <Card
        variant="glass"
        padding="none"
        className={clsx(
          'overflow-hidden transition-all duration-200',
          isSelected && 'ring-2 ring-primary'
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-surface/50">
          <img
            src={qr.thumbnail || qr.png}
            alt={`QR code: ${qr.type}`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
          
          <div className="absolute top-2 right-2 flex gap-1">
            <Tooltip content={qr.favorite ? 'Remove from favorites' : 'Add to favorites'}>
              <Button
                variant="ghost"
                size="icon"
                className={clsx('bg-black/50 backdrop-blur', qr.favorite && 'text-yellow-500')}
                onClick={(e) => { e.stopPropagation(); onAction('favorite'); }}
                aria-label={qr.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={clsx('w-5 h-5', qr.favorite ? 'fill-current' : '')} />
              </Button>
            </Tooltip>
            <Dropdown>
              <DropdownTrigger>
                <Tooltip content="More actions">
                  <Button variant="ghost" size="icon" className="bg-black/50 backdrop-blur" aria-label="More actions">
                    <MoreVertical className="w-5 h-5 text-white" />
                  </Button>
                </Tooltip>
              </DropdownTrigger>
              <div className="dropdown-menu dropdown-menu-end">
                {actions.map((action, i) => (
                  <DropdownItem
                    key={i}
                    onClick={(e) => { e.stopPropagation(); action.action(); }}
                    className={clsx(action.destructive && 'text-red-500')}
                  >
                    {typeof action.icon === 'string' ? (
                      <span className="w-4 h-4">{action.icon}</span>
                    ) : (
                      <action.icon className="w-4 h-4" />
                    )}
                    {action.label}
                  </DropdownItem>
                ))}
              </div>
            </Dropdown>
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
            <Badge variant={getTypeBadgeVariant(qr.type)} className="text-xs">
              {qr.type.toUpperCase()}
            </Badge>
            <div className="flex-1 text-right">
              <span className="text-xs text-white/80 font-mono truncate block max-w-[120px]">
                {formatDataPreview(qr.data, 40)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground truncate text-sm">
              {qr.data.slice(0, 50)}{qr.data.length > 50 ? '...' : ''}
            </h4>
            <span className="text-xs text-muted-foreground font-mono">
              {new Date(qr.createdAt).toLocaleDateString()}
            </span>
          </div>

          {qr.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {qr.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-surface rounded-full text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
              {qr.tags.length > 4 && (
                <span className="px-2 py-0.5 text-xs bg-surface rounded-full text-muted-foreground">
                  +{qr.tags.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-glass-border dark:border-glass-border-dark">
            <Tooltip content="Copy data">
              <Button
                variant="ghost"
                size="icon"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                aria-label="Copy QR data"
              >
                {copied ? (
                  <span className="w-5 h-5 text-green-500">✓</span>
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </Tooltip>
            <Tooltip content="Download PNG">
              <Button
                variant="ghost"
                size="icon"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); handleDownload('png'); }}
                aria-label="Download PNG"
              >
                <Download className="w-5 h-5" />
              </Button>
            </Tooltip>
            <Tooltip content="Open details">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                aria-label="View details"
              >
                Details
              </Button>
            </Tooltip>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`QR Code: ${qr.type.toUpperCase()}`}
        size="lg"
        showClose
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            <img
              src={qr.png}
              alt={`QR code: ${qr.type}`}
              className="max-w-[300px] w-full rounded-lg shadow-xl"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-foreground mb-2">Data</h5>
              <div className="p-3 bg-surface rounded-lg font-mono text-sm text-foreground break-all">
                {qr.data}
              </div>
            </div>
            <div>
              <h5 className="font-medium text-foreground mb-2">Metadata</h5>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium capitalize">{qr.type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">{new Date(qr.createdAt).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="font-medium">{new Date(qr.updatedAt).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Size</dt>
                  <dd className="font-medium">
                    {qr.settings.width} × {qr.settings.height} px
                  </dd>
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
                  <dt className="text-muted-foreground">Favorite</dt>
                  <dd className="font-medium">{qr.favorite ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tags</dt>
                  <dd className="font-medium">
                    {qr.tags.length > 0 ? qr.tags.join(', ') : 'None'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-glass-border dark:border-glass-border-dark">
            <Button variant="outline" onClick={() => handleDownload('png')}>
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            <Button variant="outline" onClick={() => handleDownload('svg')}>
              <Download className="w-4 h-4 mr-2" />
              Download SVG
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="primary" onClick={() => { onAction('regenerate'); setShowModal(false); }}>
              <QrCode className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}