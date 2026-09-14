import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Input';
import { Bitcoin, CheckCircle } from 'lucide-react';

const CRYPTO_TYPES = [
  { value: 'bitcoin', label: 'Bitcoin (BTC)', prefix: 'bitcoin:' },
  { value: 'ethereum', label: 'Ethereum (ETH)', prefix: 'ethereum:' },
  { value: 'litecoin', label: 'Litecoin (LTC)', prefix: 'litecoin:' },
  { value: 'bitcoin-cash', label: 'Bitcoin Cash (BCH)', prefix: 'bitcoincash:' },
  { value: 'dogecoin', label: 'Dogecoin (DOGE)', prefix: 'dogecoin:' },
  { value: 'ripple', label: 'XRP (Ripple)', prefix: 'ripple:' },
  { value: 'custom', label: 'Custom URI', prefix: '' },
];

export interface CryptoFormData {
  type: string;
  address: string;
  amount: string;
  label: string;
  message: string;
  customPrefix: string;
}

export interface CryptoFormProps {
  initialData?: Partial<CryptoFormData>;
  onSubmit: (data: CryptoFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function CryptoForm({ initialData, onSubmit, onCancel, className }: CryptoFormProps) {
  const [formData, setFormData] = useState<CryptoFormData>({
    type: initialData?.type || 'bitcoin',
    address: initialData?.address || '',
    amount: initialData?.amount || '',
    label: initialData?.label || '',
    message: initialData?.message || '',
    customPrefix: initialData?.customPrefix || '',
  });
  const [errors, setErrors] = useState<Partial<CryptoFormData>>({});

  const selectedType = CRYPTO_TYPES.find((t) => t.value === formData.type);

  const validate = useCallback(() => {
    const newErrors: Partial<CryptoFormData> = {};
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.amount && isNaN(Number(formData.amount))) newErrors.amount = 'Amount must be a number';
    if (formData.type === 'custom' && !formData.customPrefix.trim()) newErrors.customPrefix = 'Custom URI prefix is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof CryptoFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleTypeChange = (value: string) => {
    handleChange('type', value);
    const type = CRYPTO_TYPES.find((t) => t.value === value);
    if (type && type.prefix) {
      // Address format might differ, but we keep user's input
    }
  };

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bitcoin className="w-5 h-5 text-amber-500" />
          Cryptocurrency
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Cryptocurrency"
            value={formData.type}
            onChange={handleTypeChange}
            options={CRYPTO_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />

          {formData.type === 'custom' && (
            <Input
              label="Custom URI Prefix"
              placeholder="bitcoin:"
              value={formData.customPrefix}
              onChange={(e) => handleChange('customPrefix', e.target.value)}
              error={errors.customPrefix}
            />
          )}

          <Input
            label="Address"
            placeholder={selectedType?.value === 'bitcoin' ? '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' : '0x...'}
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            error={errors.address}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (optional)"
              type="number"
              step="0.00000001"
              placeholder="0.001"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              error={errors.amount}
            />
            <Input
              label="Label"
              placeholder="My Wallet"
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
            />
          </div>

          <Input
            label="Message"
            placeholder="Payment for order #123"
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
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