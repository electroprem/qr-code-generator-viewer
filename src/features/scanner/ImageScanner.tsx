import { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Upload,
  X,
  CheckCircle,
  ExternalLink,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  User,
  Smartphone,
  QrCode,
  RotateCcw,
  Copy,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Tooltip } from '@components/ui/Tooltip';
import { useToast } from '@components/providers/ToastProvider';
import { Html5Qrcode } from 'html5-qrcode';

interface ImageScannerProps {
  onScanResult: (result: string) => void;
  onSaveToHistory?: (result: string, type: string, dataUrl: string) => void;
  className?: string;
}

export function ImageScanner({ onScanResult, onSaveToHistory, className }: ImageScannerProps) {
  const { showToast } = useToast();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<string>('');
  const [pastResults, setPastResults] = useState<Array<{ id: string; result: string; type: string; timestamp: Date; dataUrl: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      showToast({ type: 'error', title: 'Invalid file', message: 'Please drop an image file' });
    }
  }, [showToast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setResultType('');
    
    setScanning(true);
    
    try {
      html5QrcodeRef.current = new Html5Qrcode('image-scanner');
      
      const scanResult = await html5QrcodeRef.current.scanFile(file, true);
      
      if (scanResult) {
        const decodedText = scanResult;
        setResult(decodedText);
        setResultType(detectQRType(decodedText));
        onScanResult(decodedText);
        showToast({ type: 'success', title: 'QR Code detected!', message: decodedText.slice(0, 50) });
      } else {
        showToast({ type: 'warning', title: 'No QR code found', message: 'Try a clearer image' });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Scan failed', message: String(error) });
    } finally {
      setScanning(false);
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.clear();
        } catch {
          // ignore
        }
        html5QrcodeRef.current = null;
      }
    }
  }, [onScanResult, showToast]);

  const detectQRType = (data: string): string => {
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
  };

  const clearImage = useCallback(() => {
    setPreview(null);
    setResult(null);
    setResultType('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSaveToHistory = useCallback(() => {
    if (result && onSaveToHistory && preview) {
      onSaveToHistory(result, resultType, preview);
      showToast({ type: 'success', title: 'Saved to history' });
    }
  }, [result, resultType, preview, onSaveToHistory, showToast]);

  const copyResult = useCallback(async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      showToast({ type: 'success', title: 'Copied to clipboard' });
    }
  }, [result, showToast]);

  const openLink = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  const getActionButtons = (res: string, _type: string) => {
    const buttons = [
      <Tooltip key="copy" content="Copy">
        <Button variant="ghost" size="icon" onClick={copyResult}>
          <Copy className="w-4 h-4" />
        </Button>
      </Tooltip>,
    ];

    if (res.startsWith('http')) {
      buttons.push(
        <Tooltip key="open" content="Open URL">
          <Button variant="outline" size="sm" onClick={() => openLink(res)}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Open
          </Button>
        </Tooltip>
      );
    }

    if (res.startsWith('mailto:')) {
      buttons.push(
        <Tooltip key="email" content="Send Email">
          <Button variant="outline" size="sm" onClick={() => window.location.href = res}>
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
        </Tooltip>
      );
    }

    if (res.startsWith('tel:')) {
      buttons.push(
        <Tooltip key="call" content="Call">
          <Button variant="outline" size="sm" onClick={() => window.location.href = res}>
            <Phone className="w-4 h-4 mr-1" />
            Call
          </Button>
        </Tooltip>
      );
    }

    if (res.startsWith('sms:')) {
      buttons.push(
        <Tooltip key="sms" content="Send SMS">
          <Button variant="outline" size="sm" onClick={() => window.location.href = res}>
            <MessageSquare className="w-4 h-4 mr-1" />
            SMS
          </Button>
        </Tooltip>
      );
    }

    if (res.startsWith('WIFI:')) {
      buttons.push(
        <Tooltip key="wifi" content="Connect WiFi">
          <Button variant="outline" size="sm" onClick={() => {
            showToast({ type: 'info', title: 'WiFi config', message: 'Copy to device WiFi settings' });
            copyResult();
          }}>
            <Wifi className="w-4 h-4 mr-1" />
            Connect
          </Button>
        </Tooltip>
      );
    }

    if (res.startsWith('BEGIN:VCARD')) {
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

    if (res.startsWith('geo:')) {
      buttons.push(
        <Tooltip key="map" content="Open Maps">
          <Button variant="outline" size="sm" onClick={() => openLink(`https://maps.google.com/?q=${encodeURIComponent(res.slice(4))}`)}>
            <MapPin className="w-4 h-4 mr-1" />
            Maps
          </Button>
        </Tooltip>
      );
    }

    if (res.startsWith('https://wa.me/')) {
      buttons.push(
        <Tooltip key="whatsapp" content="Open WhatsApp">
          <Button variant="outline" size="sm" onClick={() => openLink(res)}>
            <MessageSquare className="w-4 h-4 mr-1" />
            WhatsApp
          </Button>
        </Tooltip>
      );
    }

    if (res.startsWith('upi://pay')) {
      buttons.push(
        <Tooltip key="upi" content="Open UPI App">
          <Button variant="outline" size="sm" onClick={() => openLink(res)}>
            <Smartphone className="w-4 h-4 mr-1" />
            Pay
          </Button>
        </Tooltip>
      );
    }

    return buttons;
  };

  const scanAgain = useCallback(() => {
    clearImage();
    if (fileInputRef.current) fileInputRef.current.click();
  }, [clearImage]);

  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) processFile(file);
          break;
        }
      }
    };

    document.addEventListener('paste', handlePasteEvent);
    return () => document.removeEventListener('paste', handlePasteEvent);
  }, [processFile]);

  return (
    <div className={clsx('space-y-4', className)}>
      <Card
        variant="glass"
        padding="none"
        className={clsx('overflow-hidden transition-colors', dragging && 'ring-2 ring-primary')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="relative aspect-square min-h-[300px] bg-surface/50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="sr-only"
            id="image-upload"
          />

          {preview ? (
            <>
              <img
                src={preview}
                alt="Uploaded image"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                {scanning && (
                  <motion.div className="flex flex-col items-center gap-3 text-white">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p>Scanning for QR codes...</p>
                  </motion.div>
                )}
                {result && !scanning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 dark:bg-gray-900/95 rounded-2xl p-6 max-w-md w-full mx-4 text-center shadow-2xl"
                  >
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">QR Code Detected</h3>
                    <Badge variant="outline" className="mb-3">{resultType.toUpperCase()}</Badge>
                    <p className="text-sm text-muted-foreground mb-4 break-all">{result}</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      {getActionButtons(result, resultType)}
                      {onSaveToHistory && preview && (
                        <Tooltip content="Save to history">
                          <Button variant="primary" size="sm" onClick={handleSaveToHistory}>
                            <QrCode className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </Tooltip>
                      )}
                      <Button variant="outline" size="sm" onClick={scanAgain}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Scan Another
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearImage}
                  className="bg-black/50 backdrop-blur text-white"
                  aria-label="Clear image"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </>
          ) : (
            <label
              htmlFor="image-upload"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer p-8 text-center"
            >
              <div className={clsx(
                'w-20 h-20 rounded-2xl flex items-center justify-center transition-colors',
                dragging ? 'bg-primary/20 border-2 border-primary' : 'bg-muted border-2 border-dashed border-glass-border dark:border-glass-border-dark'
              )}>
                <Upload className={clsx('w-10 h-10', dragging ? 'text-primary' : 'text-muted-foreground/50')} />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Drop image or click to upload</p>
                <p className="text-sm text-muted-foreground">Supports PNG, JPG, WebP, SVG</p>
              </div>
              <p className="text-xs text-muted-foreground/70">Or paste from clipboard (Ctrl+V)</p>
            </label>
          )}
        </div>

        {pastResults.length > 0 && (
          <div className="p-4 border-t border-glass-border dark:border-glass-border-dark">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">Recent Scans</h4>
              <Button variant="ghost" size="icon" onClick={() => setPastResults([])}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {pastResults.slice(0, 10).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-shrink-0 w-48 bg-card rounded-lg p-3 border border-glass-border dark:border-glass-border-dark"
                >
                  <Badge variant="outline" className="mb-2">{item.type.toUpperCase()}</Badge>
                  <p className="text-xs text-foreground truncate mb-2">{item.result.slice(0, 60)}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                      onScanResult(item.result);
                      setResult(item.result);
                      setResultType(item.type);
                    }}>
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyResult()}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {!preview && (
        <Card variant="glass" padding="md">
          <h4 className="font-medium text-foreground mb-3">Tips for Better Scanning</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Use high-contrast images with good lighting</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Ensure the QR code is not blurry or distorted</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Avoid perspective distortion - capture straight on</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Minimum recommended size: 100x100 pixels</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Paste screenshots directly with Ctrl+V</li>
          </ul>
        </Card>
      )}
    </div>
  );
}