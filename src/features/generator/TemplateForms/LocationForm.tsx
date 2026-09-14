import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { MapPin, CheckCircle, Navigation } from 'lucide-react';

export interface LocationFormData {
  latitude: string;
  longitude: string;
  label: string;
  query: string;
}

export interface LocationFormProps {
  initialData?: Partial<LocationFormData>;
  onSubmit: (data: LocationFormData) => void;
  onCancel?: () => void;
  className?: string;
}

export function LocationForm({ initialData, onSubmit, onCancel, className }: LocationFormProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
    label: initialData?.label || '',
    query: initialData?.query || '',
  });
  const [errors, setErrors] = useState<Partial<LocationFormData>>({});
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const validate = useCallback(() => {
    const newErrors: Partial<LocationFormData> = {};
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      newErrors.latitude = 'Coordinates are required';
    } else if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    } else if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  const handleChange = (field: keyof LocationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setUseCurrentLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setUseCurrentLocation(false);
      },
      (error) => {
        setUseCurrentLocation(false);
        alert(`Error getting location: ${error.message}`);
      }
    );
  };

  return (
    <Card variant="glass" padding="md" className={clsx('space-y-4', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude"
              type="number"
              step="0.000001"
              placeholder="37.7749"
              value={formData.latitude}
              onChange={(e) => handleChange('latitude', e.target.value)}
              error={errors.latitude}
              required
            />
            <Input
              label="Longitude"
              type="number"
              step="0.000001"
              placeholder="-122.4194"
              value={formData.longitude}
              onChange={(e) => handleChange('longitude', e.target.value)}
              error={errors.longitude}
              required
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={useCurrentLocation}
            className="w-full"
          >
            {useCurrentLocation ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Getting location...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Use Current Location
              </>
            )}
          </Button>

          <Input
            label="Label (optional)"
            placeholder="Golden Gate Bridge"
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
          />

          <Input
            label="Search Query (optional)"
            placeholder="San Francisco, CA"
            value={formData.query}
            onChange={(e) => handleChange('query', e.target.value)}
          />

          <p className="text-xs text-muted-foreground">
            Generates a geo: URI. Opens in maps applications.
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