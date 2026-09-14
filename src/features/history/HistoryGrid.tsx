import { useMemo } from 'react';
import { HistoryCard } from './HistoryCard';
import type { QRRecord } from '@lib/storage/indexedDB';
import { useQRStore } from '@store/qrStore';

interface HistoryGridProps {
  items: QRRecord[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onItemAction: (id: string, action: string) => void;
}

export function HistoryGrid({
  items,
  selectedIds,
  onSelectionChange,
  onItemAction,
}: HistoryGridProps) {
  const { ui } = useQRStore();
  const viewMode = ui.viewMode;

  const columnCount = useMemo(() => {
    if (viewMode === 'list') return 1;
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 1024) return 2;
    if (width < 1440) return 3;
    return 4;
  }, [viewMode]);

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
    <div
      className="grid gap-3 p-2"
      style={{
        gridTemplateColumns: viewMode === 'list' ? '1fr' : `repeat(${columnCount}, 1fr)`,
      }}
      role="grid"
      aria-label="QR code history"
    >
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);
        return (
          <div
            key={item.id}
            className="p-1"
            role="gridcell"
            aria-selected={isSelected}
          >
            <HistoryCard
              qr={item}
              isSelected={isSelected}
              onSelect={(selected) => {
                const newSelected = new Set(selectedIds);
                if (selected) newSelected.add(item.id);
                else newSelected.delete(item.id);
                onSelectionChange(newSelected);
              }}
              onAction={(action) => onItemAction(item.id, action)}
            />
          </div>
        );
      })}
    </div>
  );
}