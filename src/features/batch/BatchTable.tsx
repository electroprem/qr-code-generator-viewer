import { useState, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
  Row,
} from '@tanstack/react-table';
import { clsx } from 'clsx';
import {
  Plus,
  Trash2,
  Copy,
  GripVertical,
  Download,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { Card } from '@components/ui/Card';
import { Modal } from '@components/ui/Modal';
import { Tabs, TabList, TabTrigger, TabContent } from '@components/ui/CompoundTabs';
import { QRCodeEngine, QROptions } from '@lib/qr/qrEngine';
import { useToast } from '@components/providers/ToastProvider';
import type { QRRecord } from '@lib/storage/indexedDB';

const columnHelper = createColumnHelper<BatchRow>();

interface BatchRow {
  id: string;
  type: string;
  data: Record<string, string>;
  status: 'pending' | 'processing' | 'done' | 'error';
  qrDataUrl?: string;
  qrSvg?: string;
  error?: string;
}

interface BatchTableProps {
  rows: BatchRow[];
  onRowsChange: (rows: BatchRow[]) => void;
  onGenerate: (rows: BatchRow[]) => Promise<void>;
  onExport: (rows: BatchRow[], format: string) => Promise<void>;
  isGenerating: boolean;
  progress: number;
}

const QR_TYPES = [
  { value: 'url', label: 'URL', fields: ['url'] },
  { value: 'text', label: 'Text', fields: ['text'] },
  { value: 'email', label: 'Email', fields: ['email', 'subject', 'body'] },
  { value: 'phone', label: 'Phone', fields: ['phone'] },
  { value: 'sms', label: 'SMS', fields: ['phone', 'message'] },
  { value: 'wifi', label: 'WiFi', fields: ['ssid', 'password', 'encryption', 'hidden'] },
  { value: 'vcard', label: 'vCard', fields: ['name', 'organization', 'phone', 'email', 'url', 'address'] },
  { value: 'location', label: 'Location', fields: ['latitude', 'longitude', 'query'] },
  { value: 'whatsapp', label: 'WhatsApp', fields: ['phone', 'message'] },
  { value: 'upi', label: 'UPI', fields: ['pa', 'pn', 'am', 'cu', 'tn'] },
  { value: 'crypto', label: 'Crypto', fields: ['address', 'amount', 'label', 'message'] },
  { value: 'calendar', label: 'Calendar', fields: ['title', 'description', 'location', 'start', 'end'] },
  { value: 'applink', label: 'App Link', fields: ['url', 'package', 'fallback'] },
] as const;

function getFieldsForType(type: string): string[] {
  const t = QR_TYPES.find((qt) => qt.value === type);
  return t?.fields || ['data'];
}

function buildDataString(type: string, data: Record<string, string>): string {
  const fields = getFieldsForType(type);
  
  switch (type) {
    case 'url':
      return data.url || '';
    case 'text':
      return data.text || '';
    case 'email': {
      const params = new URLSearchParams();
      if (data.subject) params.set('subject', data.subject);
      if (data.body) params.set('body', data.body);
      const query = params.toString();
      return `mailto:${data.email || ''}${query ? `?${query}` : ''}`;
    }
    case 'phone':
      return `tel:${data.phone || ''}`;
    case 'sms': {
      const params = new URLSearchParams();
      if (data.message) params.set('body', data.message);
      const query = params.toString();
      return `sms:${data.phone || ''}${query ? `?${query}` : ''}`;
    }
    case 'wifi': {
      const parts = ['WIFI:'];
      if (data.encryption) parts.push(`T:${data.encryption};`);
      if (data.ssid) parts.push(`S:${data.ssid};`);
      if (data.password) parts.push(`P:${data.password};`);
      if (data.hidden === 'true') parts.push('H:true;');
      parts.push(';');
      return parts.join('');
    }
    case 'vcard': {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      if (data.name) lines.push(`FN:${data.name}`);
      if (data.organization) lines.push(`ORG:${data.organization}`);
      if (data.phone) lines.push(`TEL:${data.phone}`);
      if (data.email) lines.push(`EMAIL:${data.email}`);
      if (data.url) lines.push(`URL:${data.url}`);
      if (data.address) lines.push(`ADR:${data.address}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    case 'location': {
      if (data.latitude && data.longitude) {
        let geo = `geo:${data.latitude},${data.longitude}`;
        if (data.query) geo += `?q=${encodeURIComponent(data.query)}`;
        return geo;
      }
      return data.query || '';
    }
    case 'whatsapp': {
      const params = new URLSearchParams();
      if (data.message) params.set('text', data.message);
      const query = params.toString();
      return `https://wa.me/${data.phone || ''}${query ? `?${query}` : ''}`;
    }
    case 'upi': {
      const params = new URLSearchParams();
      if (data.pa) params.set('pa', data.pa);
      if (data.pn) params.set('pn', data.pn);
      if (data.am) params.set('am', data.am);
      if (data.cu) params.set('cu', data.cu);
      if (data.tn) params.set('tn', data.tn);
      return `upi://pay?${params.toString()}`;
    }
    case 'crypto': {
      let addr = data.address || '';
      const params = new URLSearchParams();
      if (data.amount) params.set('amount', data.amount);
      if (data.label) params.set('label', data.label);
      if (data.message) params.set('message', data.message);
      const query = params.toString();
      return query ? `${addr}?${query}` : addr;
    }
    case 'calendar': {
      const lines = ['BEGIN:VEVENT'];
      if (data.title) lines.push(`SUMMARY:${data.title}`);
      if (data.description) lines.push(`DESCRIPTION:${data.description}`);
      if (data.location) lines.push(`LOCATION:${data.location}`);
      if (data.start) lines.push(`DTSTART:${data.start.replace(/[-:]/g, '').split('.')[0]}Z`);
      if (data.end) lines.push(`DTEND:${data.end.replace(/[-:]/g, '').split('.')[0]}Z`);
      lines.push('END:VEVENT');
      return lines.join('\n');
    }
    case 'applink':
      return data.url || '';
    default:
      return data.data || '';
  }
}

export function BatchTable({
  rows,
  onRowsChange,
  onGenerate,
  onExport,
  isGenerating,
  progress,
}: BatchTableProps) {
  const { showToast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showTypeModal, setShowTypeModal] = useState<string | null>(null);
  const [modalTypeData, setModalTypeData] = useState<Record<string, string>>({});

  const columns = useMemo(() => {
    const baseColumns = [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            aria-label="Select row"
          />
        ),
        size: 50,
      }),
      columnHelper.display({
        id: 'drag',
        header: ' ',
        cell: () => <GripVertical className="w-5 h-5 text-muted-foreground/50 cursor-grab" />,
        size: 40,
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('type');
          const typeInfo = QR_TYPES.find((t) => t.value === type);
          return (
            <Badge variant="outline" className="gap-1">
              {typeInfo?.label || type.toUpperCase()}
            </Badge>
          );
        },
        size: 120,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status');
          const variants: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'destructive'> = {
            pending: 'default',
            processing: 'primary',
            done: 'success',
            error: 'destructive',
          };
          return (
            <Badge variant={variants[status] || 'default'} className="gap-1 capitalize">
              {status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
              {status === 'done' && <Check className="w-3 h-3" />}
              {status === 'error' && <AlertCircle className="w-3 h-3" />}
              {status}
            </Badge>
          );
        },
        size: 100,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const rowData = row.original;
          return (
            <div className="flex items-center gap-1">
              {rowData.qrDataUrl && (
                <>
                  <Tooltip content="Copy image">
                    <Button variant="ghost" size="icon" onClick={async () => {
                      try {
                        const res = await fetch(rowData.qrDataUrl!);
                        const blob = await res.blob();
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        showToast({ type: 'success', title: 'Image copied' });
                      } catch { showToast({ type: 'error', title: 'Copy failed' }); }
                    }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Download">
                    <Button variant="ghost" size="icon" onClick={() => {
                      const link = document.createElement('a');
                      link.download = `qr-${rowData.type}-${rowData.id.slice(0,8)}.png`;
                      link.href = rowData.qrDataUrl!;
                      link.click();
                    }}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </>
              )}
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <div className="dropdown-menu dropdown-menu-end">
                  <DropdownItem onClick={() => setShowTypeModal(rowData.id)}>
                    Edit fields
                  </DropdownItem>
                  <DropdownItem onClick={() => duplicateRow(rowData.id)} className="text-primary">
                    <Plus className="w-4 h-4" />
                    Duplicate
                  </DropdownItem>
                  <hr className="border-glass-border dark:border-glass-border-dark my-1" />
                  <DropdownItem onClick={() => deleteRow(rowData.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownItem>
                </div>
              </Dropdown>
            </div>
          );
        },
        size: 120,
      }),
    ];

    const allFields = Array.from(new Set(rows.flatMap((r) => Object.keys(r.data))));
    const dynamicColumns = allFields.map((field) =>
      columnHelper.accessor((row) => row.data[field] || '', {
        header: field.charAt(0).toUpperCase() + field.slice(1),
        cell: ({ row, getValue }) => {
          const value = getValue();
          const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === field;
          
          if (isEditing) {
            return (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => saveEdit(row.id, field)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(row.id, field); if (e.key === 'Escape') cancelEdit(); }}
                className="input-base py-1.5 text-sm w-full font-mono"
                autoFocus
              />
            );
          }
          
          return (
            <span
              className="font-mono text-sm truncate block max-w-[200px]"
              onDoubleClick={() => startEdit(row.id, field, value)}
            >
              {value || <span className="text-muted-foreground/50">—</span>}
            </span>
          );
        },
        size: 200,
      })
    );

    return [...baseColumns, ...dynamicColumns];
  }, [rows, editingCell, editValue, showToast]);

  const startEdit = useCallback((rowId: string, columnId: string, value: string) => {
    setEditingCell({ rowId, columnId });
    setEditValue(value);
  }, []);

  const saveEdit = useCallback((rowId: string, columnId: string) => {
    onRowsChange(rows.map((r) =>
      r.id === rowId ? { ...r, data: { ...r.data, [columnId]: editValue } } : r
    ));
    setEditingCell(null);
    setEditValue('');
  }, [rows, onRowsChange, editValue]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const duplicateRow = useCallback((id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const newRow: BatchRow = {
      ...row,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      status: 'pending',
      qrDataUrl: undefined,
      qrSvg: undefined,
      error: undefined,
    };
    onRowsChange([...rows, newRow]);
  }, [rows, onRowsChange]);

  const deleteRow = useCallback((id: string) => {
    onRowsChange(rows.filter((r) => r.id !== id));
  }, [rows, onRowsChange]);

  const addRow = useCallback(() => {
    const newRow: BatchRow = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: 'url',
      data: { url: '' },
      status: 'pending',
    };
    onRowsChange([...rows, newRow]);
  }, [rows, onRowsChange]);

  const clearAll = useCallback(() => {
    if (confirm('Clear all rows?')) onRowsChange([]);
  }, [onRowsChange]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: -1,
    rowSelection: {
      onChange: (selected) => {
        // Selection handled externally
      },
    },
  });

  const handleGenerate = useCallback(async () => {
    const pendingRows = rows.filter((r) => r.status === 'pending' && buildDataString(r.type, r.data).trim());
    if (pendingRows.length === 0) {
      showToast({ type: 'warning', title: 'No valid rows', message: 'Add data to generate QR codes' });
      return;
    }
    await onGenerate(pendingRows);
  }, [rows, onGenerate, showToast]);

  const handleExport = useCallback(async (format: string) => {
    const doneRows = rows.filter((r) => r.status === 'done' && r.qrDataUrl);
    if (doneRows.length === 0) {
      showToast({ type: 'warning', title: 'Nothing to export', message: 'Generate QR codes first' });
      return;
    }
    await onExport(doneRows, format);
  }, [rows, onExport, showToast]);

  const selectedCount = rows.filter((r) => r.getIsSelected?.()).length;

  return (
    <div className="space-y-4">
      <Card variant="glass" padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-glass-border dark:border-glass-border-dark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground">Batch Items ({rows.length})</h3>
            {selectedCount > 0 && (
              <Badge variant="outline">{selectedCount} selected</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={addRow} disabled={isGenerating}>
              <Plus className="w-4 h-4 mr-1" />
              Add Row
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} disabled={isGenerating || rows.length === 0}>
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" role="grid">
            <thead className="sticky top-0 bg-glass/50 backdrop-blur-xl border-b border-glass-border dark:border-glass-border-dark">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={clsx(
                        'px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground'
                      )}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                      aria-sort={
                        header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : header.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : 'none'
                      }
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span>
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-glass-border dark:divide-glass-border-dark">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={clsx(
                    'transition-colors',
                    row.original.status === 'error' && 'bg-red-500/5',
                    row.original.status === 'processing' && 'bg-primary/5'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-2"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                    No rows. Click "Add Row" or import CSV/JSON.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isGenerating && (
          <div className="p-4 border-t border-glass-border dark:border-glass-border-dark bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Generating QR codes...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 300 }}
              />
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Export:</label>
          {(['png', 'svg', 'pdf'] as const).map((fmt) => (
            <Button key={fmt} variant="outline" size="sm" onClick={() => handleExport(fmt)} disabled={isGenerating}>
              {fmt.toUpperCase()}
            </Button>
          ))}
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} size="lg" className="w-full sm:w-auto">
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5 mr-2" />
              Generate All
            </>
          )}
        </Button>
      </div>

      <Modal
        isOpen={!!showTypeModal}
        onClose={() => { setShowTypeModal(null); setModalTypeData({}); }}
        title="Edit Fields"
        size="lg"
      >
        {showTypeModal && (
          <div className="space-y-4">
            {QR_TYPES.find((t) => t.value === rows.find((r) => r.id === showTypeModal)?.type)?.fields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <Input
                  value={modalTypeData[field] || ''}
                  onChange={(e) => setModalTypeData({ ...modalTypeData, [field]: e.target.value })}
                  placeholder={field}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4 border-t border-glass-border dark:border-glass-border-dark">
              <Button variant="outline" onClick={() => { setShowTypeModal(null); setModalTypeData({}); }}>
                Cancel
              </Button>
              <Button onClick={() => {
                const row = rows.find((r) => r.id === showTypeModal);
                if (row) {
                  onRowsChange(rows.map((r) => r.id === showTypeModal ? { ...r, data: modalTypeData } : r));
                }
                setShowTypeModal(null);
                setModalTypeData({});
              }}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { QrCode } from 'lucide-react';