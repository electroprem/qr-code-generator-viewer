import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Calendar, CheckCircle } from 'lucide-react';

export interface CalendarFormData {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  timezone: string;
}

export interface CalendarFormProps {
  initialData?: Partial<CalendarFormData>;
  onSubmit: (data: CalendarFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function CalendarForm({ initialData, onSubmit, onCancel, className }: CalendarFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState<CalendarFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    startDate: initialData?.startDate || today,
    startTime: initialData?.startTime || now,
    endDate: initialData?.endDate || today,
    endTime: initialData?.endTime || now,
    allDay: initialData?.allDay || false,
    timezone: initialData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [errors, setErrors] = useState<Partial<CalendarFormData>>({});

  const validate = useCallback(() => {
    const newErrors: Partial<CalendarFormData> = {};
    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);
    if (end <= start && !formData.allDay) newErrors.endTime = 'End time must be after start time';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof CalendarFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof CalendarFormData]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Calendar Event
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="Meeting with team"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={errors.title}
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Event details..."
              className="w-full px-4 py-2.5 rounded-xl border border-glass-border dark:border-glass-border-dark bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-y min-h-[80px]"
              rows={3}
            />
          </div>

          <Input
            label="Location"
            placeholder="Conference Room A / Online"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-glass-border dark:border-glass-border-dark bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                disabled={formData.allDay}
                className={clsx(
                  'w-full px-4 py-2.5 rounded-xl border bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200',
                  formData.allDay && 'opacity-50 cursor-not-allowed'
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-glass-border dark:border-glass-border-dark bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                disabled={formData.allDay}
                className={clsx(
                  'w-full px-4 py-2.5 rounded-xl border bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200',
                  formData.allDay && 'opacity-50 cursor-not-allowed'
                )}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allDay}
              onChange={(e) => handleChange('allDay', e.target.checked)}
              className="w-4 h-4 rounded border-glass-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">All day event</span>
          </label>

          <Input
            label="Timezone"
            value={formData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
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