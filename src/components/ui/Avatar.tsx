import { forwardRef, useState, ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Globe } from 'lucide-react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  fallback?: ReactNode;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

const shapeStyles: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-xl',
};

const statusSizes: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-neutral-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
};

const statusPositions: Record<string, string> = {
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
    'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getFallbackIcon(name?: string): ReactNode {
  if (!name) return <User className="w-full h-full" />;
  const firstChar = name.trim()[0]?.toLowerCase();
  if (firstChar === '@') return <Mail className="w-full h-full" />;
  if (firstChar === '+') return <Phone className="w-full h-full" />;
  if (firstChar === 'h' && name.startsWith('http')) return <Globe className="w-full h-full" />;
  return null;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', shape = 'circle', status, statusPosition = 'bottom-right', fallback, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const initials = name ? getInitials(name) : '?';
    const bgColor = name ? getColorFromName(name) : 'bg-muted';
    const fallbackIcon = getFallbackIcon(name);
    const showFallback = !src || imageError;
    const showImage = src && !imageError && imageLoaded;

    return (
      <div
        ref={ref}
        className={clsx(
          'relative inline-flex items-center justify-center overflow-hidden bg-muted',
          'select-none animate-in zoom-in-95 duration-300 ease-out',
          sizeStyles[size],
          shapeStyles[shape],
          className
        )}
        {...props}
      >
        {showImage && (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            aria-hidden={true}
          />
        )}
        {showFallback && (
          <div
            className={clsx(
              'flex items-center justify-center w-full h-full font-medium text-white',
              bgColor
            )}
            aria-label={name ? `${name}'s avatar` : 'Avatar'}
          >
            {fallback || fallbackIcon || initials}
          </div>
        )}
        {status && (
          <span
            className={clsx(
              'absolute border-2 border-card',
              'rounded-full',
              statusColors[status],
              statusSizes[size],
              statusPositions[statusPosition]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({ children, max = 5, size = 'md', className }: AvatarGroupProps) {
  const avatars = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<AvatarProps>[];
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={clsx('flex -space-x-2', className)} role="group" aria-label={`${avatars.length} users`}>
      {visibleAvatars.map((avatar, index) => (
        <motion.div
          key={avatar.props.name || avatar.props.src || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          {React.cloneElement(avatar, { size })}
        </motion.div>
      ))}
      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className={clsx(
            'flex items-center justify-center font-medium text-foreground border-2 border-card',
            sizeStyles[size],
            shapeStyles.circle
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
}

export interface AvatarStackProps extends AvatarGroupProps {}

export function AvatarStack({ children, max = 5, size = 'md', className }: AvatarStackProps) {
  return <AvatarGroup children={children} max={max} size={size} className={clsx('-space-x-2', className)} />;
}