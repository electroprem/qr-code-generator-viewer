import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { User, CheckCircle } from 'lucide-react';

export interface VCardFormData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
  address: string;
  note: string;
}

export interface VCardFormProps {
  initialData?: Partial<VCardFormData>;
  onSubmit: (data: VCardFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function VCardForm({ initialData, onSubmit, onCancel, className }: VCardFormProps) {
  const [formData, setFormData] = useState<VCardFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    organization: initialData?.organization || '',
    title: initialData?.title || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    url: initialData?.url || '',
    address: initialData?.address || '',
    note: initialData?.note || '',
  });
  const [errors, setErrors] = useState<Partial<VCardFormData>>({});

  const validate = useCallback(() => {
    const newErrors: Partial<VCardFormData> = {};
    if (!formData.firstName.trim() && !formData.lastName.trim()) {
      newErrors.firstName = 'At least first or last name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof VCardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Contact (vCard)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              error={errors.firstName}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
            />
          </div>

          <Input
            label="Organization"
            placeholder="Acme Inc."
            value={formData.organization}
            onChange={(e) => handleChange('organization', e.target.value)}
          />

          <Input
            label="Job Title"
            placeholder="Software Engineer"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />

          <Input
            label="Phone"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />

          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
          />

          <Input
            label="Website"
            placeholder="https://example.com"
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
          />

          <Input
            label="Address"
            placeholder="123 Main St, City, State 12345"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Additional notes..."
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