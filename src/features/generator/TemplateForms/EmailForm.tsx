import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Mail, CheckCircle } from 'lucide-react';

export interface EmailFormData {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}

export interface EmailFormProps {
  initialData?: Partial<EmailFormData>;
  onSubmit: (data: EmailFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function EmailForm({ initialData, onSubmit, onCancel, className }: EmailFormProps) {
  const [formData, setFormData] = useState<EmailFormData>({
    to: initialData?.to || '',
    cc: initialData?.cc || '',
    bcc: initialData?.bcc || '',
    subject: initialData?.subject || '',
    body: initialData?.body || '',
  });
  const [errors, setErrors] = useState<Partial<EmailFormData>>({});

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = useCallback(() => {
    const newErrors: Partial<EmailFormData> = {};
    if (!formData.to.trim()) newErrors.to = 'Recipient is required';
    else if (!validateEmail(formData.to)) newErrors.to = 'Invalid email format';
    if (formData.cc && !validateEmail(formData.cc)) newErrors.cc = 'Invalid email format';
    if (formData.bcc && !validateEmail(formData.bcc)) newErrors.bcc = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof EmailFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="To"
            type="email"
            placeholder="recipient@example.com"
            value={formData.to}
            onChange={(e) => handleChange('to', e.target.value)}
            error={errors.to}
            required
          />

          <Input
            label="CC"
            type="email"
            placeholder="cc@example.com"
            value={formData.cc}
            onChange={(e) => handleChange('cc', e.target.value)}
            error={errors.cc}
          />

          <Input
            label="BCC"
            type="email"
            placeholder="bcc@example.com"
            value={formData.bcc}
            onChange={(e) => handleChange('bcc', e.target.value)}
            error={errors.bcc}
          />

          <Input
            label="Subject"
            placeholder="Email subject"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Body</label>
            <textarea
              value={formData.body}
              onChange={(e) => handleChange('body', e.target.value)}
              placeholder="Email body..."
              className="w-full px-4 py-2.5 rounded-xl border border-glass-border dark:border-glass-border-dark bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-y min-h-[100px]"
              rows={4}
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