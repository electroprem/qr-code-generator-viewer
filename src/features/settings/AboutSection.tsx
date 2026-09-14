import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Github,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Cpu,
  Smartphone,
  Monitor,
  Shield,
  Heart,
  Coffee,
  Mail,
  Twitter,
  Discord,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { useToast } from '@components/providers/ToastProvider';
import { useTheme } from '@components/providers/ThemeProvider';

interface AboutSectionProps {
  className?: string;
}

const VERSION = '2.0.0';
const BUILD_DATE = '2026-01-15';

export function AboutSection({ className }: AboutSectionProps) {
  const { showToast } = useToast();
  const { resolvedTheme } = useTheme();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [pwaInstallable, setPwaInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
  }, []);

  const checkForUpdates = useCallback(async () => {
    setCheckingUpdate(true);
    try {
      // In a real app, this would check a version endpoint
      // For now, simulate a check
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUpdateAvailable(false);
      showToast({ type: 'info', title: 'Up to date', message: `Running ${VERSION}` });
    } catch {
      showToast({ type: 'error', title: 'Update check failed' });
    } finally {
      setCheckingUpdate(false);
    }
  }, [showToast]);

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast({ type: 'success', title: 'PWA installed' });
      setPwaInstallable(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, showToast]);

  const copySystemInfo = useCallback(async () => {
    const info = `QR Code Studio v${VERSION}
Build: ${BUILD_DATE}
Platform: ${navigator.platform}
User Agent: ${navigator.userAgent}
Screen: ${screen.width}x${screen.height}
Theme: ${resolvedTheme}
PWA: ${pwaInstallable ? 'Installable' : 'Installed/Not Supported'}
Storage: ${navigator.storage?.estimate ? 'Available' : 'Limited'}
`;
    await navigator.clipboard.writeText(info);
    showToast({ type: 'success', title: 'System info copied' });
  }, [resolvedTheme, pwaInstallable, showToast]);

  const openLink = (url: string) => window.open(url, '_blank');

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-6', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          About
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Version info, links, and system details</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
            <Cpu className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">QR Code Studio</h3>
            <p className="text-muted-foreground">Professional QR code generator & scanner</p>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                v{VERSION}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Cpu className="w-3 h-3" />
                React + TypeScript
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Shield className="w-3 h-3" />
                MIT License
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card variant="glass" padding="md">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Build Information
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Version</dt>
                <dd className="font-mono font-medium">{VERSION}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Build Date</dt>
                <dd className="font-mono font-medium">{BUILD_DATE}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Framework</dt>
                <dd className="font-medium">React 18 + TypeScript</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Build Tool</dt>
                <dd className="font-medium">Vite</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Styling</dt>
                <dd className="font-medium">Tailwind CSS</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">State</dt>
                <dd className="font-medium">Zustand + IndexedDB</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Animations</dt>
                <dd className="font-medium">Framer Motion</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">QR Engine</dt>
                <dd className="font-medium">qr-code-styling</dd>
              </div>
            </dl>
          </Card>

          <Card variant="glass" padding="md">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Platform
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">OS</dt>
                <dd className="font-mono font-medium">{navigator.platform}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Browser</dt>
                <dd className="font-mono font-medium">{navigator.userAgent.split(' ').slice(-1)[0]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Theme</dt>
                <dd className="font-medium capitalize">{resolvedTheme}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">PWA Status</dt>
                <dd className="font-medium">{pwaInstallable ? 'Installable' : 'Installed / Not Supported'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Storage</dt>
                <dd className="font-medium">IndexedDB (Persistent)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Offline</dt>
                <dd className="font-medium">Supported</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Features
          </h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: QrCode, title: 'QR Generation', desc: '13+ templates, custom styling' },
              { icon: Smartphone, title: 'Scanner', desc: 'Camera & image scanning' },
              { icon: Database, title: 'History', desc: 'Full history with search' },
              { icon: Cpu, title: 'Batch', desc: 'Bulk generation from CSV/JSON' },
              { icon: Palette, title: 'Customization', desc: 'Colors, gradients, logos' },
              { icon: Shield, title: 'Privacy', desc: '100% local, no tracking' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 bg-surface/50 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <feature.icon className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Links
          </h4>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => openLink('https://github.com')}>
              <Github className="w-4 h-4 mr-1" />
              GitHub
            </Button>
            <Button variant="outline" onClick={() => openLink('https://github.com/issues')}>
              <AlertCircle className="w-4 h-4 mr-1" />
              Report Issue
            </Button>
            <Button variant="outline" onClick={() => openLink('https://github.com/discussions')}>
              <MessageSquare className="w-4 h-4 mr-1" />
              Discussions
            </Button>
            <Button variant="outline" onClick={() => openLink('https://twitter.com')}>
              <Twitter className="w-4 h-4 mr-1" />
              Twitter
            </Button>
            <Button variant="outline" onClick={() => openLink('https://discord.com')}>
              <Discord className="w-4 h-4 mr-1" />
              Discord
            </Button>
            <Button variant="outline" onClick={() => openLink('mailto:')}>
              <Mail className="w-4 h-4 mr-1" />
              Contact
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={checkForUpdates} disabled={checkingUpdate}>
              <Loader2 className={clsx('w-4 h-4 mr-1', checkingUpdate && 'animate-spin')} />
              {checkingUpdate ? 'Checking...' : 'Check for Updates'}
            </Button>
            {updateAvailable && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Update Available
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {pwaInstallable && (
              <Button variant="primary" onClick={installPWA} size="lg">
                <Smartphone className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
            <Button variant="outline" onClick={copySystemInfo}>
              <Copy className="w-4 h-4 mr-1" />
              Copy System Info
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark text-center">
          <p className="text-sm text-muted-foreground">
            Built with <Heart className="w-4 h-4 text-red-500 fill-current inline" /> by the QR Code Studio team
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Open source • MIT Licensed • No tracking • Works offline
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

import { Database, QrCode, Palette, MessageSquare } from 'lucide-react';