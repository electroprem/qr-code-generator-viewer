import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Input';
import { Smartphone, CheckCircle, Globe, Mail, MessageSquare, MapPin, Calendar, Camera, Music, ShoppingCart, Gamepad2, Link } from 'lucide-react';

const APP_CATEGORIES = [
  { value: 'web', label: 'Website', icon: <Globe className="w-4 h-4" />, schemes: ['https://', 'http://'] },
  { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" />, schemes: ['mailto:'] },
  { value: 'phone', label: 'Phone', icon: <Smartphone className="w-4 h-4" />, schemes: ['tel:'] },
  { value: 'sms', label: 'SMS', icon: <MessageSquare className="w-4 h-4" />, schemes: ['sms:'] },
  { value: 'maps', label: 'Maps', icon: <MapPin className="w-4 h-4" />, schemes: ['geo:', 'maps:'] },
  { value: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" />, schemes: ['calshow:'] },
  { value: 'camera', label: 'Camera', icon: <Camera className="w-4 h-4" />, schemes: ['camera:'] },
  { value: 'music', label: 'Music', icon: <Music className="w-4 h-4" />, schemes: ['spotify:', 'music:'] },
  { value: 'shopping', label: 'Shopping', icon: <ShoppingCart className="w-4 h-4" />, schemes: ['amazon:', 'ebay:'] },
  { value: 'games', label: 'Games', icon: <Gamepad2 className="w-4 h-4" />, schemes: ['steam:', 'epicgames:'] },
  { value: 'custom', label: 'Custom URI', icon: <Link className="w-4 h-4" />, schemes: [] },
];

export interface AppLinkFormData {
  category: string;
  url: string;
  fallbackUrl: string;
  packageName: string;
  customScheme: string;
}

export interface AppLinkFormProps {
  initialData?: Partial<AppLinkFormData>;
  onSubmit: (data: AppLinkFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function AppLinkForm({ initialData, onSubmit, onCancel, className }: AppLinkFormProps) {
  const [formData, setFormData] = useState<AppLinkFormData>({
    category: initialData?.category || 'web',
    url: initialData?.url || '',
    fallbackUrl: initialData?.fallbackUrl || '',
    packageName: initialData?.packageName || '',
    customScheme: initialData?.customScheme || '',
  });
  const [errors, setErrors] = useState<Partial<AppLinkFormData>>({});

  const selectedCategory = APP_CATEGORIES.find((c) => c.value === formData.category);

  const validate = useCallback(() => {
    const newErrors: Partial<AppLinkFormData> = {};
    if (!formData.url.trim()) newErrors.url = 'URL/URI is required';
    if (formData.category === 'custom' && !formData.customScheme.trim()) {
      newErrors.customScheme = 'Custom scheme is required (e.g., myapp:)';
    }
    if (formData.fallbackUrl && !/^https?:\/\//.test(formData.fallbackUrl)) {
      newErrors.fallbackUrl = 'Fallback URL must be a valid HTTPS URL';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof AppLinkFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCategoryChange = (value: string) => {
    handleChange('category', value);
    const cat = APP_CATEGORIES.find((c) => c.value === value);
    if (cat && cat.schemes.length > 0 && !formData.url) {
      handleChange('url', cat.schemes[0]);
    }
  };

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          App Link / Deep Link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Category"
            value={formData.category}
            onChange={handleCategoryChange}
            options={APP_CATEGORIES.map((c) => ({ value: c.value, label: c.label, icon: c.icon }))}
          />

          <Input
            label="Deep Link URL"
            placeholder={selectedCategory?.schemes[0] || 'myapp://path'}
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            error={errors.url}
            required
          />

          {formData.category === 'custom' && (
            <Input
              label="Custom Scheme"
              placeholder="myapp:"
              value={formData.customScheme}
              onChange={(e) => handleChange('customScheme', e.target.value)}
              error={errors.customScheme}
            />
          )}

          <Input
            label="Android Package Name (optional)"
            placeholder="com.example.app"
            value={formData.packageName}
            onChange={(e) => handleChange('packageName', e.target.value)}
          />

          <Input
            label="Fallback URL (optional)"
            placeholder="https://example.com/download"
            value={formData.fallbackUrl}
            onChange={(e) => handleChange('fallbackUrl', e.target.value)}
            error={errors.fallbackUrl}
          />

          <p className="text-xs text-muted-foreground">
            Generates an intent: URI for Android deep linking with fallback.
          </p>

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