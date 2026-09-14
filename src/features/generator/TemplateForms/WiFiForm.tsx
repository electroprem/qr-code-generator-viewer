import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Wifi, CheckCircle } from 'lucide-react';

export interface WiFiFormData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface WiFiFormProps {
  initialData?: Partial<WiFiFormData>;
  onSubmit: (data: WiFiFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function WiFiForm({ initialData, onSubmit, onCancel, className }: WiFiFormProps) {
  const [formData, setFormData] = useState<WiFiFormData>({
    ssid: initialData?.ssid || '',
    password: initialData?.password || '',
    encryption: initialData?.encryption || 'WPA',
    hidden: initialData?.hidden || false,
  });
  const [errors, setErrors] = useState<Partial<WiFiFormData>>({});

  const validate = useCallback(() => {
    const newErrors: Partial<WiFiFormData> = {};
    if (!formData.ssid.trim()) newErrors.ssid = 'SSID is required';
    if (formData.encryption !== 'nopass' && !formData.password.trim()) {
      newErrors.password = 'Password is required for secured networks';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof WiFiFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          WiFi Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Network Name (SSID)"
            placeholder="MyWiFiNetwork"
            value={formData.ssid}
            onChange={(e) => handleChange('ssid', e.target.value)}
            error={errors.ssid}
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Encryption</label>
            <div className="flex gap-2" role="radiogroup" aria-label="Encryption type">
              {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                <button
                  key={enc}
                  type="button"
                  role="radio"
                  aria-checked={formData.encryption === enc}
                  onClick={() => handleChange('encryption', enc)}
                  className={clsx(
                    'flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                    formData.encryption === enc
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50'
                  )}
                >
                  {enc === 'nopass' ? 'No Password' : enc}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={errors.password}
            disabled={formData.encryption === 'nopass'}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hidden}
              onChange={(e) => handleChange('hidden', e.target.checked)}
              className="w-4 h-4 rounded border-glass-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Hidden network</span>
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Generate QR
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}