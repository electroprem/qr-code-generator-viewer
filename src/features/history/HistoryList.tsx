import { useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { clsx } from 'clsx';
import {
  Star,
  Trash2,
  Download,
  Copy,
  Edit2,
  Plus,
  Share2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { Badge } from '@components/ui/Badge';
import type { QRRecord } from '@lib/storage/indexedDB';
import { useQRStore } from '@store/qrStore';

interface HistoryListProps {
  items: QRRecord[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onItemAction: (id: string, action: string) => void;
}

function formatDataPreview(data: string, maxLength = 60): string {
  if (data.length <= maxLength) return data;
  return data.slice(0, maxLength - 3) + '...';
}

function getTypeBadgeVariant(type: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' {
  const variants: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    url: 'primary',
    text: 'default',
    email: 'secondary',
    phone: 'success',
    sms: 'warning',
    wifi: 'primary',
    vcard: 'secondary',
    location: 'destructive',
    whatsapp: 'success',
    upi: 'warning',
    crypto: 'destructive',
    calendar: 'primary',
    applink: 'secondary',
  };
  return variants[type] || 'default';
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    url: '🌐',
    text: '📝',
    email: '📧',
    phone: '📞',
    sms: '💬',
    wifi: '📶',
    vcard: '👤',
    location: '📍',
    whatsapp: '💬',
    upi: '💰',
    crypto: '₿',
    calendar: '📅',
    applink: '📱',
  };
  return icons[type] || '📱';
}

export function HistoryList({
  items,
  selectedIds,
  onSelectionChange,
  onItemAction,
}: HistoryListProps) {
  const { ui } = useQRStore();
  const viewMode = ui.viewMode;

  const RowRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = items[index];
      const isSelected = selectedIds.has(item.id);

      return (
        <div
          key={item.id}
          style={style}
          className={clsx(
            'flex items-center gap-4 p-3 hover:bg-surface/50 transition-colors',
            isSelected && 'bg-primary/5 border-l-2 border-primary'
          )}
          role="row"
          aria-selected={isSelected}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              const newSelected = new Set(selectedIds);
              if (e.target.checked) newSelected.add(item.id);
              else newSelected.delete(item.id);
              onSelectionChange(newSelected);
            }}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            aria-label="Select item"
          />

          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
            {getTypeIcon(item.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-foreground truncate block">
                {formatDataPreview(item.data)}
              </span>
              <Badge variant={getTypeBadgeVariant(item.type)}>
                {item.type.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {item.favorite && (
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Favorite
                </span>
              )}
              {item.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {item.tags.slice(0, 3).join(', ')}
                  {item.tags.length > 3 && <span>+{item.tags.length - 3}</span>}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Tooltip content="Toggle favorite">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onItemAction(item.id, 'favorite')}
                aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star
                  className={clsx('w-5 h-5', item.favorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground')}
                />
              </Button>
            </Tooltip>
            <Dropdown>
              <DropdownTrigger>
                <Tooltip content="More actions">
                  <Button variant="ghost" size="icon" aria-label="More actions">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </Tooltip>
              </DropdownTrigger>
              <div className="dropdown-menu">
                <DropdownItem onClick={() => onItemAction(item.id, 'download')}>
                  <Download className="w-4 h-4" />
                  Download
                </DropdownItem>
                <DropdownItem onClick={() => onItemAction(item.id, 'regenerate')}>
                  <RotateCcw className="w-4 h-4" />
                  Regenerate
                </DropdownItem>
                <DropdownItem onClick={() => onItemAction(item.id, 'edit')}>
                  <Edit2 className="w-4 h-4" />
                  Edit
                </DropdownItem>
                <DropdownItem onClick={() => onItemAction(item.id, 'duplicate')}>
                  <Plus className="w-4 h-4" />
                  Duplicate
                </DropdownItem>
                <DropdownItem onClick={() => onItemAction(item.id, 'share')}>
                  <Share2 className="w-4 h-4" />
                  Share
                </DropdownItem>
                <hr className="border-glass-border dark:border-glass-border-dark my-1" />
                <DropdownItem onClick={() => onItemAction(item.id, 'delete')} className="text-red-500">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownItem>
              </div>
            </Dropdown>
          </div>
        </div>
      );
    },
    [items, selectedIds, onSelectionChange, onItemAction]
  );

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-8 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground">No QR codes found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      </div>
    );
  }

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Card variant="glass" padding="none" className="overflow-hidden">
          <div
            className="sticky top-0 bg-glass/50 backdrop-blur-xl border-b border-glass-border dark:border-glass-border-dark"
            role="row"
            aria-rowindex={0}
          >
            <div className="flex items-center gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="w-4 h-4" />
              <div className="w-12" />
              <div className="flex-1">Content / Type</div>
              <div className="w-48 text-center">Tags</div>
              <div className="w-40 text-center">Favorite</div>
              <div className="w-40 text-center">Date</div>
              <div className="w-16" />
            </div>
          </div>
          <div style={{ height: height - 40, width }} role="rowgroup">
            <List
              height={height - 40}
              itemCount={items.length}
              itemSize={72}
              width={width}
              overscanCount={5}
            >
              {RowRenderer}
            </List>
          </div>
        </Card>
      )}
    </AutoSizer>
  );
}