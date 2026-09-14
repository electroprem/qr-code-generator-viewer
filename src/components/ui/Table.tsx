import { useState, useMemo, ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown, Check, CheckSquare, MinusSquare } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => ReactNode;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  headerClassName?: string;
  cellClassName?: string;
  renderHeader?: (props: { sortDirection: SortDirection; onSort: () => void }) => ReactNode;
  renderCell?: (value: ReactNode, row: T, index: number) => ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyAccessor: (row: T) => string;
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedKeys: Set<string>) => void;
  selectedKeys?: Set<string>;
  selectable?: boolean;
  multiSelect?: boolean;
  sortable?: boolean;
  resizable?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function defaultKeyAccessor<T>(row: T): string {
  return JSON.stringify(row);
}

export function Table<T>({
  columns,
  data,
  keyAccessor = defaultKeyAccessor,
  onRowClick,
  onSelectionChange,
  selectedKeys: controlledSelectedKeys,
  selectable = false,
  multiSelect = true,
  sortable = true,
  resizable: _resizable = false,
  striped = true,
  hoverable = true,
  bordered = true,
  compact = false,
  loading = false,
  emptyMessage = 'No data available',
  className,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [_hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [localSelectedKeys, setLocalSelectedKeys] = useState<Set<string>>(new Set());

  const isControlled = controlledSelectedKeys !== undefined;
  const selectedKeys = isControlled ? controlledSelectedKeys : localSelectedKeys;
  const setSelectedKeys = isControlled ? onSelectionChange : setLocalSelectedKeys;

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;
    const col = columns.find((c) => c.key === sortColumn);
    if (!col?.sortable) return data;

    return [...data].sort((a, b) => {
      const aVal = col.accessor(a);
      const bVal = col.accessor(b);
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const handleSort = (key: string) => {
    if (!sortable) return;
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;

    setSortColumn(key);
    setSortDirection((prev) => {
      if (prev === 'asc') return 'desc';
      if (prev === 'desc') return null;
      return 'asc';
    });
  };

  const toggleRowSelection = (key: string) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(key)) newSelected.delete(key);
    else newSelected.add(key);
    setSelectedKeys?.(newSelected);
    onSelectionChange?.(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size === sortedData.length) {
      setSelectedKeys?.(new Set());
      onSelectionChange?.(new Set());
    } else {
      const allKeys = new Set(sortedData.map(keyAccessor));
      setSelectedKeys?.(allKeys);
      onSelectionChange?.(allKeys);
    }
  };

  const isRowSelected = (key: string) => selectedKeys.has(key);
  const allSelected = sortedData.length > 0 && sortedData.every((row) => isRowSelected(keyAccessor(row)));

  if (loading) {
    return (
      <div className={clsx('relative min-h-[200px] rounded-xl border border-glass-border dark:border-glass-border-dark bg-card', className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
          </svg>
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className={clsx('rounded-xl border border-glass-border dark:border-glass-border-dark bg-card', className)}>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  const tableStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    border: bordered ? '1px solid var(--color-border)' : 'none',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
    backgroundColor: 'var(--color-card)',
  };

  return (
    <div className={clsx(className)} style={tableStyle} role="grid">
      <div className="sticky top-0 z-10 overflow-x-auto">
        <table className="w-full border-collapse min-w-max" role="table">
          <thead>
            <tr className="bg-surface border-b border-glass-border dark:border-glass-border-dark">
              {columns.map((col, colIndex) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-left font-medium text-muted-foreground',
                    'whitespace-nowrap',
                    col.sortable && sortable && 'cursor-pointer hover:text-foreground select-none',
                    col.headerClassName
                  )}
                  style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth, textAlign: col.align }}
                  onClick={() => col.sortable && sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {selectable && colIndex === 0 && multiSelect && (
                      <button
                        onClick={toggleSelectAll}
                        className={clsx(
                          'p-1.5 rounded transition-colors',
                          allSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-surface'
                        )}
                        aria-label={allSelected ? 'Deselect all' : 'Select all'}
                      >
                        {allSelected ? <Check className="w-4 h-4" /> : <MinusSquare className="w-4 h-4" />}
                      </button>
                    )}
                    {col.renderHeader ? (
                      col.renderHeader({ sortDirection: sortColumn === col.key ? sortDirection : null, onSort: () => handleSort(col.key) })
                    ) : (
                      <>
                        {col.header}
                        {col.sortable && sortable && (
                          <span className="flex items-center">
                            {sortColumn === col.key ? (
                              sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
                            ) : (
                              <ChevronsUpDown className="w-4 h-4 text-muted-foreground/50" />
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={keyAccessor(row)}
                className={clsx(
                  'border-b border-glass-border dark:border-glass-border-dark',
                  'transition-colors',
                  striped && rowIndex % 2 === 1 && 'bg-surface/50',
                  hoverable && 'hover:bg-surface',
                  compact && 'h-[40px]',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row, rowIndex)}
                onMouseEnter={() => hoverable && setHoverIndex(rowIndex)}
                onMouseLeave={() => hoverable && setHoverIndex(null)}
              >
                {selectable && (
                  <td className="px-4 py-3 border-r border-glass-border dark:border-glass-border-dark">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleRowSelection(keyAccessor(row)); }}
                      className={clsx(
                        'p-1.5 rounded transition-colors',
                        isRowSelected(keyAccessor(row)) ? 'bg-primary text-primary-foreground' : 'hover:bg-surface'
                      )}
                      aria-label={isRowSelected(keyAccessor(row)) ? 'Deselect row' : 'Select row'}
                    >
                      {isRowSelected(keyAccessor(row)) ? <Check className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                    </button>
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-4 py-3',
                      'whitespace-nowrap',
                      col.align && `text-${col.align}`,
                      col.cellClassName
                    )}
                    style={{ textAlign: col.align, width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
                  >
                    {col.renderCell ? col.renderCell(col.accessor(row), row, rowIndex) : col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface SimpleTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyAccessor?: (row: T) => string;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  emptyMessage?: string;
}

export function SimpleTable<T>({
  columns,
  data,
  keyAccessor = defaultKeyAccessor,
  className,
  striped = true,
  hoverable = true,
  bordered: _bordered = true,
  compact = false,
  emptyMessage = 'No data available',
}: SimpleTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={clsx('rounded-xl border border-glass-border dark:border-glass-border-dark bg-card', className)}>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('overflow-x-auto rounded-xl border border-glass-border dark:border-glass-border-dark bg-card', className)}>
      <table className="w-full border-collapse" role="table">
        <thead>
          <tr className="bg-surface border-b border-glass-border dark:border-glass-border-dark">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'px-4 py-3 text-left font-medium text-muted-foreground',
                  'whitespace-nowrap',
                  col.headerClassName
                )}
                style={{ width: col.width, textAlign: col.align }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={keyAccessor(row)}
              className={clsx(
                'border-b border-glass-border dark:border-glass-border-dark',
                'transition-colors',
                striped && rowIndex % 2 === 1 && 'bg-surface/50',
                hoverable && 'hover:bg-surface',
                compact && 'h-[40px]'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    'px-4 py-3',
                    'whitespace-nowrap',
                    col.align && `text-${col.align}`,
                    col.cellClassName
                  )}
                  style={{ textAlign: col.align }}
                >
                  {col.renderCell ? col.renderCell(col.accessor(row), row, rowIndex) : col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}