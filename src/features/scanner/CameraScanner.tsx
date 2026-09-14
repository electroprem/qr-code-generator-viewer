import { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Camera,
  RotateCcw,
  FlashlightOff,
  Flashlight,
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
  Volume2,
  Vibrate,
  Check,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { useToast } from '@components/providers/ToastProvider';
import { Html5Qrcode } from 'html5-qrcode';

interface CameraScannerProps {
  onScanResult: (result: string) => void;
  className?: string;
}

export function CameraScanner({ onScanResult, className }: CameraScannerProps) {
  const { showToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scanSound, setScanSound] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [showResult, setShowResult] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string>('');
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scanIntervalRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    checkPermission();
    enumerateCameras();
    return () => stopScanning();
  }, []);

  const checkPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission('granted');
    } catch {
      setPermission('denied');
    }
  };

  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch {
      console.warn('Could not enumerate cameras');
    }
  };

  const playBeep = useCallback(() => {
    if (!scanSound) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {
      console.warn('Could not play beep sound');
    }
  }, [scanSound]);

  const triggerHaptic = useCallback(() => {
    if (!hapticFeedback) return;
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [hapticFeedback]);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      if (decodedText === lastResult) return;
      setLastResult(decodedText);
      playBeep();
      triggerHaptic();
      onScanResult(decodedText);
      setShowResult(decodedText);
      stopScanning();
    },
    [lastResult, onScanResult, playBeep, triggerHaptic]
  );

  const startScanning = async () => {
    if (permission === 'denied') {
      showToast({ type: 'error', title: 'Camera permission denied', message: 'Enable camera access in browser settings' });
      return;
    }

    try {
      const config = {
        fps: 30,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      html5QrcodeRef.current = new Html5Qrcode('camera-scanner');
      
      await html5QrcodeRef.current.start(
        selectedCameraId || { facingMode },
        config,
        handleScanSuccess,
        (_error) => {
          // Scan error, ignore
        }
      );

      setIsScanning(true);
      setTorchEnabled(false);
      showToast({ type: 'success', title: 'Scanner started' });
    } catch (error) {
      showToast({ type: 'error', title: 'Camera error', message: String(error) });
    }
  };

  const stopScanning = useCallback(() => {
    if (html5QrcodeRef.current && isScanning) {
      html5QrcodeRef.current.stop().catch(console.warn);
      html5QrcodeRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setIsScanning(false);
    setTorchEnabled(false);
  }, [isScanning]);

  const toggleTorch = async () => {
    if (!html5QrcodeRef.current || !isScanning) return;
    try {
      // html5-qrcode doesn't directly expose torch control
      // This would need camera constraints manipulation
      showToast({ type: 'warning', title: 'Torch control not available in this mode' });
    } catch {
      showToast({ type: 'warning', title: 'Torch not available' });
    }
  };

  const _toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isScanning) {
      stopScanning();
      setTimeout(startScanning, 100);
    }
  };

  const selectCamera = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (isScanning) {
      stopScanning();
      setTimeout(startScanning, 100);
    }
  };

  const scanAgain = () => {
    setShowResult(null);
    setLastResult('');
    startScanning();
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  const copyResult = async (text: string) => {
    await navigator.clipboard.writeText(text);
    showToast({ type: 'success', title: 'Copied to clipboard' });
  };

  const getActionButtons = (result: string) => {
    const buttons = [
      <Tooltip key="copy" content="Copy">
        <Button variant="ghost" size="icon" onClick={() => copyResult(result)}>
          <Copy className="w-4 h-4" />
        </Button>
      </Tooltip>,
    ];

    if (result.startsWith('http')) {
      buttons.push(
        <Tooltip key="open" content="Open URL">
          <Button variant="outline" size="sm" onClick={() => openLink(result)}>
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
            copyResult(result);
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
          <Button variant="outline" size="sm" onClick={() => openLink(`https://maps.google.com/?q=${encodeURIComponent(result.slice(4))}`)}>
            <MapPin className="w-4 h-4 mr-1" />
            Maps
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('https://wa.me/')) {
      buttons.push(
        <Tooltip key="whatsapp" content="Open WhatsApp">
          <Button variant="outline" size="sm" onClick={() => openLink(result)}>
            <MessageSquare className="w-4 h-4 mr-1" />
            WhatsApp
          </Button>
        </Tooltip>
      );
    }

    if (result.startsWith('upi://pay')) {
      buttons.push(
        <Tooltip key="upi" content="Open UPI App">
          <Button variant="outline" size="sm" onClick={() => openLink(result)}>
            <Smartphone className="w-4 h-4 mr-1" />
            Pay
          </Button>
        </Tooltip>
      );
    }

    return buttons;
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <Card variant="glass" padding="none" className="overflow-hidden">
        <div className="relative aspect-video bg-black">
          <div id="camera-scanner" className="w-full h-full" />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72">
              <div className="absolute inset-0 border-2 border-primary/50 rounded-lg">
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3/4 h-0.5 bg-primary animate-pulse" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center text-white/80 text-xs">
                Position QR code within frame
              </div>
            </div>
          </div>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-10"
            >
              <Card variant="glass" className="max-w-md w-full">
                <div className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">QR Code Detected</h3>
                  <p className="text-sm text-muted-foreground mb-4 break-all">{showResult}</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {getActionButtons(showResult)}
                    <Button variant="outline" onClick={scanAgain} size="sm">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Scan Again
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 pointer-events-auto">
            {!isScanning && permission !== 'granted' ? (
              <Button onClick={startScanning} size="lg" className="w-full sm:w-auto">
                <Camera className="w-5 h-5 mr-2" />
                Enable Camera
              </Button>
            ) : !isScanning ? (
              <Button onClick={startScanning} size="lg" className="w-full sm:w-auto">
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </Button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {cameras.length > 1 && (
                  <Tooltip content="Switch camera">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="outline" size="icon" aria-label="Select camera">
                          <Camera className="w-5 h-5" />
                        </Button>
                      </DropdownTrigger>
                      <div className="dropdown-menu dropdown-menu-end">
                        {cameras.map((cam) => (
                          <DropdownItem
                            key={cam.deviceId}
                            value={cam.deviceId}
                            onClick={() => selectCamera(cam.deviceId)}
                            className={clsx(selectedCameraId === cam.deviceId && 'bg-primary/10')}
                          >
                            {selectedCameraId === cam.deviceId && <Check className="w-4 h-4 text-primary" />}
                            {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                          </DropdownItem>
                        ))}
                      </div>
                    </Dropdown>
                  </Tooltip>
                )}
                <Tooltip content={torchEnabled ? 'Turn off flashlight' : 'Turn on flashlight'}>
                  <Button variant="outline" size="icon" onClick={toggleTorch} disabled={!isScanning}>
                    {torchEnabled ? (
                      <Flashlight className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <FlashlightOff className="w-5 h-5" />
                    )}
                  </Button>
                </Tooltip>
                <Tooltip content="Stop scanning">
                  <Button variant="destructive" onClick={stopScanning} size="lg">
                    <X className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>

        <Card variant="glass" padding="md">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Settings</h4>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scanSound}
                  onChange={(e) => setScanSound(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <Volume2 className="w-4 h-4" />
                Sound
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hapticFeedback}
                  onChange={(e) => setHapticFeedback(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <Vibrate className="w-4 h-4" />
                Vibrate
              </label>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Ensure good lighting for better detection</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Hold camera steady and parallel to the code</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Use flashlight in low light (if available)</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Switch cameras for different angles</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
}

import { Copy } from 'lucide-react';