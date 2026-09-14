import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { MessageSquare, CheckCircle } from 'lucide-react';

export interface WhatsAppFormData {
  phone: string;
  message: string;
}

export interface WhatsAppFormProps {
  initialData?: Partial<WhatsAppFormData>;
  onSubmit: (data: WhatsAppFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function WhatsAppForm({ initialData, onSubmit, onCancel, className }: WhatsAppFormProps) {
  const [formData, setFormData] = useState<WhatsAppFormData>({
    phone: initialData?.phone || '',
    message: initialData?.message || '',
  });
  const [errors, setErrors] = useState<Partial<WhatsAppFormData>>({});

  const validate = useCallback(() => {
    const newErrors: Partial<WhatsAppFormData> = {};
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[\d\s+\-()]{7,}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof WhatsAppFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-500" />
          WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={errors.phone}
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Pre-filled Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Hello! I'd like to chat..."
              className="w-full px-4 py-2.5 rounded-xl border border-glass-border dark:border-glass-border-dark bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-y min-h-[80px]"
              rows={3}
            />
          </div>

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