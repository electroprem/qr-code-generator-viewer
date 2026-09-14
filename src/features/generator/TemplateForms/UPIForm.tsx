import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Wallet, CheckCircle } from 'lucide-react';

export interface UPIFormData {
  vpa: string;
  name: string;
  amount: string;
  currency: string;
  note: string;
}

export interface UPIFormProps {
  initialData?: Partial<UPIFormData>;
  onSubmit: (data: UPIFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function UPIForm({ initialData, onSubmit, onCancel, className }: UPIFormProps) {
  const [formData, setFormData] = useState<UPIFormData>({
    vpa: initialData?.vpa || '',
    name: initialData?.name || '',
    amount: initialData?.amount || '',
    currency: initialData?.currency || 'INR',
    note: initialData?.note || '',
  });
  const [errors, setErrors] = useState<Partial<UPIFormData>>({});

  const validate = useCallback(() => {
    const newErrors: Partial<UPIFormData> = {};
    if (!formData.vpa.trim()) newErrors.vpa = 'UPI ID (VPA) is required';
    else if (!/^[a-zA-Z0-9.\-]{2,}@[a-zA-Z]{2,}$/.test(formData.vpa)) newErrors.vpa = 'Invalid UPI ID format (e.g., user@bank)';
    if (!formData.name.trim()) newErrors.name = 'Recipient name is required';
    if (formData.amount && isNaN(Number(formData.amount))) newErrors.amount = 'Amount must be a number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof UPIFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          UPI Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="UPI ID (VPA)"
            placeholder="user@bank"
            value={formData.vpa}
            onChange={(e) => handleChange('vpa', e.target.value)}
            error={errors.vpa}
            required
          />

          <Input
            label="Recipient Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="100.00"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              error={errors.amount}
            />
            <Input
              label="Currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
            />
          </div>

          <Input
            label="Note"
            placeholder="Payment for services"
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
          />

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