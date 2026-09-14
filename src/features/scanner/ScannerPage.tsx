import { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, FlashlightOff, Flashlight, X, CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card';
import { useToast } from '@components/providers/ToastProvider';

export function ScannerPage() {
  const { showToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number>();

  useEffect(() => {
    checkPermission();
    return () => stopScanning();
  }, []);

  const checkPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setPermission('granted');
    } catch {
      setPermission('denied');
    }
  };

  const startScanning = async () => {
    if (permission === 'denied') {
      showToast({ type: 'error', title: 'Camera permission denied', message: 'Enable camera access in browser settings' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        startScanLoop();
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Camera error', message: String(error) });
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setTorchEnabled(false);
  };

  const startScanLoop = () => {
    scanIntervalRef.current = window.setInterval(() => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      const _imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }, 100);
  };

  const toggleTorch = async () => {
    if (!videoRef.current?.srcObject) return;
    try {
      const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
      await track.applyConstraints({ advanced: [{ torch: !torchEnabled }] as any });
      setTorchEnabled(!torchEnabled);
    } catch {
      showToast({ type: 'warning', title: 'Torch not available' });
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isScanning) {
      stopScanning();
      setTimeout(startScanning, 100);
    }
  };

  const _handleResult = (text: string) => {
    setResult(text);
    stopScanning();
    showToast({ type: 'success', title: 'QR Code detected!', message: text.slice(0, 50) });
  };

  const openLink = () => {
    if (result) {
      window.open(result, '_blank');
    }
  };

  const copyResult = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      showToast({ type: 'success', title: 'Copied to clipboard' });
    }
  };

  const scanAgain = () => {
    setResult(null);
    startScanning();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scan QR Code</h1>
        <p className="text-muted-foreground mt-1">Point your camera at a QR code to scan</p>
      </div>

      <Card variant="glass" padding="none" className="overflow-hidden">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            aria-label="Camera preview"
          />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: 'none' }} />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border-2 border-primary/50 rounded-lg">
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3/4 h-0.5 bg-primary animate-pulse" />
            </div>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-10"
            >
              <div className="bg-card rounded-2xl p-6 max-w-md w-full text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">QR Code Detected</h3>
                <p className="text-sm text-muted-foreground mb-4 break-all">{result}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={copyResult} size="sm">
                    Copy
                  </Button>
                  {result.startsWith('http') && (
                    <Button variant="outline" onClick={openLink} size="sm">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                  )}
                  <Button variant="outline" onClick={scanAgain} size="sm">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Scan Again
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-glass-border dark:border-glass-border-dark">
          {!isScanning && permission !== 'granted' ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Camera access required to scan QR codes</p>
              <Button onClick={startScanning} size="lg">
                <Camera className="w-5 h-5 mr-2" />
                Enable Camera
              </Button>
            </div>
          ) : !isScanning ? (
            <Button onClick={startScanning} size="lg" className="w-full">
              <Camera className="w-5 h-5 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={toggleCamera} size="icon" aria-label="Switch camera">
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button variant="outline" onClick={toggleTorch} size="icon" aria-label={torchEnabled ? 'Turn off flashlight' : 'Turn on flashlight'}>
                {torchEnabled ? <Flashlight className="w-5 h-5 text-yellow-500" /> : <FlashlightOff className="w-5 h-5" />}
              </Button>
              <Button variant="destructive" onClick={stopScanning} size="lg" className="flex-1 max-w-xs">
                <X className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card variant="glass" padding="md">
        <CardHeader>
          <CardTitle>Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Ensure good lighting for better detection</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Hold camera steady and parallel to the code</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Use flashlight in low light conditions</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Switch cameras for different angles</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}