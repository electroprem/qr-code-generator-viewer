import { useState, useCallback, useMemo } from 'react';
import { Globe, Wifi, User, Mail, MessageSquare, Phone, Bitcoin, Calendar, MapPin, Smartphone, FileText, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useToast } from '@components/providers/ToastProvider';
import { useQR } from '@hooks/useQR';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';

import { Button } from '@components/ui/Button';
import { StylePanel } from './StylePanel';
import { LivePreview } from './LivePreview';
import { ExportPanel } from './ExportPanel';
import { TemplateSelector } from './TemplateSelector';
import { Template } from './TemplateSelector';
import { WiFiForm } from './TemplateForms/WiFiForm';
import { VCardForm } from './TemplateForms/VCardForm';
import { EmailForm } from './TemplateForms/EmailForm';
import { SMSForm } from './TemplateForms/SMSForm';
import { PhoneForm } from './TemplateForms/PhoneForm';
import { WhatsAppForm } from './TemplateForms/WhatsAppForm';
import { UPIForm } from './TemplateForms/UPIForm';
import { CryptoForm } from './TemplateForms/CryptoForm';
import { CalendarForm } from './TemplateForms/CalendarForm';
import { LocationForm } from './TemplateForms/LocationForm';
import { AppLinkForm } from './TemplateForms/AppLinkForm';

const QR_TYPES = [
  { value: 'url', label: 'Website URL', placeholder: 'https://example.com', icon: <Globe className="w-5 h-5" /> },
  { value: 'text', label: 'Plain Text', placeholder: 'Enter any text...', icon: <FileText className="w-5 h-5" /> },
  { value: 'email', label: 'Email', placeholder: 'mailto:user@example.com', icon: <Mail className="w-5 h-5" /> },
  { value: 'phone', label: 'Phone Number', placeholder: 'tel:+1234567890', icon: <Phone className="w-5 h-5" /> },
  { value: 'sms', label: 'SMS', placeholder: 'sms:+1234567890?body=Hello', icon: <MessageSquare className="w-5 h-5" /> },
  { value: 'wifi', label: 'WiFi Network', placeholder: 'WIFI:T:WPA;S:mynetwork;P:password;;', icon: <Wifi className="w-5 h-5" /> },
  { value: 'vcard', label: 'Contact (vCard)', placeholder: 'BEGIN:VCARD...', icon: <User className="w-5 h-5" /> },
  { value: 'location', label: 'Location', placeholder: 'geo:37.7749,-122.4194', icon: <MapPin className="w-5 h-5" /> },
  { value: 'crypto', label: 'Cryptocurrency', placeholder: 'bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', icon: <Bitcoin className="w-5 h-5" /> },
  { value: 'calendar', label: 'Calendar Event', placeholder: 'BEGIN:VEVENT...', icon: <Calendar className="w-5 h-5" /> },
  { value: 'app', label: 'App Deep Link', placeholder: 'myapp://path?param=value', icon: <Smartphone className="w-5 h-5" /> },
] as const;

const templates: Template[] = [
  { id: 'wifi', name: 'WiFi Network', description: 'Connect to WiFi instantly', icon: <Wifi className="w-5 h-5" />, category: 'network' },
  { id: 'vcard', name: 'Contact Card', description: 'Share contact information', icon: <User className="w-5 h-5" />, category: 'contact' },
  { id: 'email', name: 'Email', description: 'Pre-filled email composer', icon: <Mail className="w-5 h-5" />, category: 'communication' },
  { id: 'sms', name: 'SMS', description: 'Pre-filled text message', icon: <MessageSquare className="w-5 h-5" />, category: 'communication' },
  { id: 'phone', name: 'Phone Call', description: 'Initiate a phone call', icon: <Phone className="w-5 h-5" />, category: 'communication' },
  { id: 'whatsapp', name: 'WhatsApp', description: 'Open WhatsApp chat', icon: <MessageSquare className="w-5 h-5 text-green-500" />, category: 'communication' },
  { id: 'upi', name: 'UPI Payment', description: 'Indian UPI payment link', icon: <Wallet className="w-5 h-5" />, category: 'payment' },
  { id: 'crypto', name: 'Cryptocurrency', description: 'Crypto payment address', icon: <Bitcoin className="w-5 h-5 text-amber-500" />, category: 'payment' },
  { id: 'calendar', name: 'Calendar Event', description: 'Add event to calendar', icon: <Calendar className="w-5 h-5" />, category: 'calendar' },
  { id: 'location', name: 'Location', description: 'Share GPS coordinates', icon: <MapPin className="w-5 h-5" />, category: 'location' },
  { id: 'app', name: 'App Deep Link', description: 'Open app with deep link', icon: <Smartphone className="w-5 h-5" />, category: 'app' },
];

function renderTemplateForm(templateId: string, onSubmit: (data: any) => void, onCancel: () => void) {
  switch (templateId) {
    case 'wifi':
      return <WiFiForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'vcard':
      return <VCardForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'email':
      return <EmailForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'sms':
      return <SMSForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'phone':
      return <PhoneForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'whatsapp':
      return <WhatsAppForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'upi':
      return <UPIForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'crypto':
      return <CryptoForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'calendar':
      return <CalendarForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'location':
      return <LocationForm onSubmit={onSubmit} onCancel={onCancel} />;
    case 'app':
      return <AppLinkForm onSubmit={onSubmit} onCancel={onCancel} />;
    default:
      return null;
  }
}

export function GeneratorPage() {
  const { showToast } = useToast();
  const {
    generateQR,
    exportQR,
    isGenerating,
  } = useQR();

  type QRTypeValue = typeof QR_TYPES[number]['value'];
const [qrType, setQrType] = useState<QRTypeValue>(QR_TYPES[0].value);
  const [inputValue, setInputValue] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState<{ width: number; height: number } | null>(null);
  const [qrError, setQrError] = useState<Error | null>(null);

  // Style options
  const [shape, setShape] = useState<'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded'>('square');
  const [dotScale, setDotScale] = useState(1);
  const [cornerRadius, setCornerRadius] = useState(0);
  const [cornerDotRadius, setCornerDotRadius] = useState(0);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientColors, setGradientColors] = useState(['#0ea5e9', '#8b5cf6']);
  const [gradientRotation, setGradientRotation] = useState(0);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoSize, setLogoSize] = useState(0.2);
  const [logoOpacity, setLogoOpacity] = useState(1);
  const [logoShape, setLogoShape] = useState<'square' | 'circle' | 'rounded'>('square');
  const [version, setVersion] = useState(0);
  const [mode, setMode] = useState<'numeric' | 'alphanumeric' | 'byte' | 'kanji'>('byte');
  const [margin, setMargin] = useState(4);
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [maskPattern, setMaskPattern] = useState(-1);

  const modeMap = { numeric: 0, alphanumeric: 1, byte: 2, kanji: 3 } as const;

  const qrOptions = useMemo(() => ({
    data: inputValue,
    width: 512,
    height: 512,
    margin,
    foregroundColor,
    backgroundColor,
    errorCorrectionLevel: errorCorrection,
    dotShape: shape,
    cornerRadius,
    cornerDotRadius,
    gradient: gradientEnabled ? { type: gradientType, colors: gradientColors, rotation: gradientRotation } : undefined,
    logo: logoImage ? { image: URL.createObjectURL(logoImage), size: logoSize, opacity: logoOpacity, shape: logoShape } : undefined,
    version: version || undefined,
    mode: modeMap[mode] as 0 | 1 | 2 | 3,
    maskPattern: maskPattern === -1 ? undefined : maskPattern,
  }), [
    inputValue, margin, foregroundColor, backgroundColor, errorCorrection,
    shape, dotScale, cornerRadius, cornerDotRadius,
    gradientEnabled, gradientType, gradientColors, gradientRotation,
    logoImage, logoSize, logoOpacity, logoShape,
    version, mode, maskPattern
  ]);

  const handleGenerate = useCallback(async () => {
    if (!inputValue.trim()) {
      showToast({ type: 'error', title: 'Empty input', message: 'Please enter data to encode' });
      return;
    }
    const result = await generateQR(qrOptions);
    if (result) {
      setQrDataUrl(result.dataUrl);
      setQrSize({ width: result.canvas.width, height: result.canvas.height });
      setQrError(null);
      showToast({ type: 'success', title: 'QR Code generated' });
    } else {
      setQrError(new Error('Generation failed'));
    }
  }, [inputValue, qrOptions, generateQR, showToast]);

  const handleExport = useCallback(async (format: string, options: any) => {
    try {
      const result = await exportQR(format as any, options);
      if (result instanceof Blob) {
        const url = URL.createObjectURL(result);
        const link = document.createElement('a');
        link.download = `qr-code-${Date.now()}.${format}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
      showToast({ type: 'success', title: `Exported as ${format.toUpperCase()}` });
    } catch {
      showToast({ type: 'error', title: 'Export failed' });
    }
  }, [exportQR, showToast]);

  const handleTemplateSubmit = useCallback((data: any) => {
    let qrData = '';
    switch (selectedTemplate) {
      case 'wifi':
        qrData = `WIFI:T:${data.encryption};S:${data.ssid};P:${data.password};H:${data.hidden ? 'true' : 'false'};;`;
        break;
      case 'vcard':
        qrData = `BEGIN:VCARD\nVERSION:3.0\nFN:${data.firstName} ${data.lastName}\nORG:${data.organization}\nTITLE:${data.title}\nTEL:${data.phone}\nEMAIL:${data.email}\nURL:${data.url}\nADR:${data.address}\nNOTE:${data.note}\nEND:VCARD`;
        break;
      case 'email':
        qrData = `mailto:${data.to}${data.cc ? `?cc=${data.cc}` : ''}${data.bcc ? `&bcc=${data.bcc}` : ''}${data.subject ? `&subject=${encodeURIComponent(data.subject)}` : ''}${data.body ? `&body=${encodeURIComponent(data.body)}` : ''}`;
        break;
      case 'sms':
        qrData = `sms:${data.phone}${data.body ? `?body=${encodeURIComponent(data.body)}` : ''}`;
        break;
      case 'phone':
        qrData = `tel:${data.phone}`;
        break;
      case 'whatsapp':
        qrData = `https://wa.me/${data.phone.replace(/\D/g, '')}${data.message ? `?text=${encodeURIComponent(data.message)}` : ''}`;
        break;
      case 'upi':
        qrData = `upi://pay?pa=${data.vpa}&pn=${encodeURIComponent(data.name)}${data.amount ? `&am=${data.amount}` : ''}&cu=${data.currency}&tn=${encodeURIComponent(data.note)}`;
        break;
      case 'crypto':
        const prefix = data.type === 'custom' ? data.customPrefix : `${data.type}:`;
        qrData = `${prefix}${data.address}${data.amount ? `?amount=${data.amount}` : ''}${data.label ? `&label=${encodeURIComponent(data.label)}` : ''}${data.message ? `&message=${encodeURIComponent(data.message)}` : ''}`;
        break;
      case 'calendar':
        const formatDate = (date: string, time: string, allDay: boolean) => {
          if (allDay) return date.replace(/-/g, '');
          return `${date.replace(/-/g, '')}T${time.replace(':', '')}00Z`;
        };
        qrData = `BEGIN:VEVENT\nSUMMARY:${data.title}\nDESCRIPTION:${data.description}\nLOCATION:${data.location}\nDTSTART:${formatDate(data.startDate, data.startTime, data.allDay)}\nDTEND:${formatDate(data.endDate, data.endTime, data.allDay)}\nEND:VEVENT`;
        break;
      case 'location':
        qrData = `geo:${data.latitude},${data.longitude}${data.query ? `?q=${encodeURIComponent(data.query)}` : ''}`;
        break;
      case 'app':
        qrData = `intent:${data.url}#Intent;package=${data.packageName};scheme=${data.customScheme};S.browser_fallback_url=${encodeURIComponent(data.fallbackUrl)};end`;
        break;
      default:
        qrData = inputValue;
    }
    setInputValue(qrData);
    handleGenerate();
    setSelectedTemplate(null);
  }, [selectedTemplate, inputValue, handleGenerate]);

  const handleTemplateCancel = useCallback(() => {
    setSelectedTemplate(null);
  }, []);

  const currentType = QR_TYPES.find((t) => t.value === qrType);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Generate QR Code</h1>
          <p className="text-muted-foreground mt-1">Create customizable QR codes for any purpose</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleGenerate} disabled={isGenerating || !inputValue.trim()} aria-label="Generate QR">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="10" y="10" width="4" height="4" rx="1" />
            <rect x="10" y="14" width="4" height="4" rx="1" />
            <rect x="14" y="14" width="4" height="4" rx="1" />
          </svg>
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="lg:col-span-1 space-y-6"
        >
          <Card variant="glass" padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="10" y="10" width="4" height="4" rx="1" />
                  <rect x="10" y="14" width="4" height="4" rx="1" />
                  <rect x="14" y="14" width="4" height="4" rx="1" />
                </svg>
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">QR Code Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QR_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => { setQrType(type.value); setSelectedTemplate(null); }}
                      className={clsx(
                        'p-3 rounded-xl text-center transition-all duration-200 border-2',
                        qrType === type.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-transparent hover:border-border hover:bg-surface'
                      )}
                    >
                      <span className="block mb-1">{type.icon}</span>
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Template: {templates.find(t => t.id === selectedTemplate)?.name}</h4>
                    <button
                      onClick={handleTemplateCancel}
                      className="text-sm text-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <div>
                    {renderTemplateForm(selectedTemplate, handleTemplateSubmit, handleTemplateCancel)}
                  </div>
                </div>
              ) : (
                <>
                  <Input
                    label="Content"
                    placeholder={currentType?.placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    aria-describedby="qr-content-hint"
                  />
                  <p id="qr-content-hint" className="text-xs text-muted-foreground">
                    Enter the data to encode in the QR code
                  </p>

                  <TemplateSelector
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onSelect={setSelectedTemplate}
                  />

                  <Button onClick={handleGenerate} disabled={isGenerating || !inputValue.trim()} className="w-full" size="lg">
                    {isGenerating ? 'Generating...' : 'Generate QR Code'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <StylePanel
            shape={shape}
            onShapeChange={setShape}
            dotScale={dotScale}
            onDotScaleChange={setDotScale}
            cornerRadius={cornerRadius}
            onCornerRadiusChange={setCornerRadius}
            cornerDotRadius={cornerDotRadius}
            onCornerDotRadiusChange={setCornerDotRadius}
            foregroundColor={foregroundColor}
            onForegroundChange={setForegroundColor}
            backgroundColor={backgroundColor}
            onBackgroundChange={setBackgroundColor}
            gradientEnabled={gradientEnabled}
            onGradientToggle={setGradientEnabled}
            gradientType={gradientType}
            onGradientTypeChange={setGradientType}
            gradientColors={gradientColors}
            onGradientColorsChange={setGradientColors}
            gradientRotation={gradientRotation}
            onGradientRotationChange={setGradientRotation}
            logoImage={logoImage}
            onLogoChange={setLogoImage}
            logoSize={logoSize}
            onLogoSizeChange={setLogoSize}
            logoOpacity={logoOpacity}
            onLogoOpacityChange={setLogoOpacity}
            logoShape={logoShape}
            onLogoShapeChange={setLogoShape}
            version={version}
            onVersionChange={setVersion}
            mode={mode}
            onModeChange={setMode}
            margin={margin}
            onMarginChange={setMargin}
            errorCorrection={errorCorrection}
            onErrorCorrectionChange={setErrorCorrection}
            maskPattern={maskPattern}
            onMaskPatternChange={setMaskPattern}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          className="lg:col-span-3 space-y-6"
        >
          <LivePreview
            data={inputValue}
            dataUrl={qrDataUrl}
            size={qrSize}
            isGenerating={isGenerating}
            error={qrError}
            options={qrOptions as any}
            onGenerate={handleGenerate}
            onDownload={(format) => handleExport(format, {})}
            onCopy={() => showToast({ type: 'success', title: 'Copied to clipboard' })}
          />

          <ExportPanel
            dataUrl={qrDataUrl}
            size={qrSize}
            onExport={handleExport}
            onCopy={() => showToast({ type: 'success', title: 'Copied to clipboard' })}
          />
        </motion.div>
      </div>
    </div>
  );
}