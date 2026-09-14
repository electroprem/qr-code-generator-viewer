import { useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Trash2,
  Download,
  Settings,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { Tabs, TabList, TabTrigger, TabContent } from '@components/ui/Tabs';
import { useToast } from '@components/providers/ToastProvider';
import Papa from 'papaparse';

interface ParsedRow {
  id: string;
  type: string;
  data: Record<string, string>;
  original: Record<string, string>;
  valid: boolean;
  errors: string[];
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
}

interface BatchImportProps {
  onImport: (rows: ParsedRow[]) => void;
  className?: string;
}

const QR_TYPES = [
  'url', 'text', 'email', 'phone', 'sms', 'wifi',
  'vcard', 'location', 'whatsapp', 'upi', 'crypto', 'calendar', 'applink'
] as const;

const TYPE_FIELDS: Record<string, { field: string; required: boolean; label: string }[]> = {
  url: [{ field: 'url', required: true, label: 'URL' }],
  text: [{ field: 'text', required: true, label: 'Text' }],
  email: [
    { field: 'email', required: true, label: 'Email' },
    { field: 'subject', required: false, label: 'Subject' },
    { field: 'body', required: false, label: 'Body' },
  ],
  phone: [{ field: 'phone', required: true, label: 'Phone' }],
  sms: [
    { field: 'phone', required: true, label: 'Phone' },
    { field: 'message', required: false, label: 'Message' },
  ],
  wifi: [
    { field: 'ssid', required: true, label: 'SSID' },
    { field: 'password', required: false, label: 'Password' },
    { field: 'encryption', required: false, label: 'Encryption (WPA/WEP/nopass)' },
    { field: 'hidden', required: false, label: 'Hidden (true/false)' },
  ],
  vcard: [
    { field: 'name', required: true, label: 'Name' },
    { field: 'organization', required: false, label: 'Organization' },
    { field: 'phone', required: false, label: 'Phone' },
    { field: 'email', required: false, label: 'Email' },
    { field: 'url', required: false, label: 'URL' },
    { field: 'address', required: false, label: 'Address' },
  ],
  location: [
    { field: 'latitude', required: true, label: 'Latitude' },
    { field: 'longitude', required: true, label: 'Longitude' },
    { field: 'query', required: false, label: 'Query/Label' },
  ],
  whatsapp: [
    { field: 'phone', required: true, label: 'Phone' },
    { field: 'message', required: false, label: 'Message' },
  ],
  upi: [
    { field: 'pa', required: true, label: 'Payee Address (VPA)' },
    { field: 'pn', required: false, label: 'Payee Name' },
    { field: 'am', required: false, label: 'Amount' },
    { field: 'cu', required: false, label: 'Currency (INR)' },
    { field: 'tn', required: false, label: 'Transaction Note' },
  ],
  crypto: [
    { field: 'address', required: true, label: 'Address' },
    { field: 'amount', required: false, label: 'Amount' },
    { field: 'label', required: false, label: 'Label' },
    { field: 'message', required: false, label: 'Message' },
  ],
  calendar: [
    { field: 'title', required: true, label: 'Title' },
    { field: 'description', required: false, label: 'Description' },
    { field: 'location', required: false, label: 'Location' },
    { field: 'start', required: true, label: 'Start (ISO 8601)' },
    { field: 'end', required: true, label: 'End (ISO 8601)' },
  ],
  applink: [
    { field: 'url', required: true, label: 'App URL' },
    { field: 'package', required: false, label: 'Package Name' },
    { field: 'fallback', required: false, label: 'Fallback URL' },
  ],
};

export function BatchImport({ onImport, className }: BatchImportProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'file' | 'manual'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<string>('url');
  const [showMapping, setShowMapping] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    parseFile(selectedFile);
  }, []);

  const parseFile = useCallback(async (selectedFile: File) => {
    const text = await selectedFile.text();
    let parsed: any[] = [];

    try {
      if (selectedFile.name.endsWith('.csv')) {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase(),
        });
        parsed = result.data;
        if (result.errors.length > 0) {
          console.warn('CSV parse warnings:', result.errors);
        }
      } else if (selectedFile.name.endsWith('.json')) {
        const json = JSON.parse(text);
        parsed = Array.isArray(json) ? json : [json];
      } else {
        showToast({ type: 'error', title: 'Unsupported file type', message: 'Please use CSV or JSON' });
        return;
      }

      if (parsed.length === 0) {
        showToast({ type: 'warning', title: 'Empty file', message: 'No data rows found' });
        return;
      }

      const columns = Object.keys(parsed[0] || {});
      setPreviewRows(parsed.slice(0, 5));
      setColumnMapping(
        columns.reduce((acc, col) => {
          acc[col] = '';
          return acc;
        }, {} as Record<string, string>)
      );
      setShowMapping(true);
    } catch (error) {
      showToast({ type: 'error', title: 'Parse failed', message: String(error) });
    }
  }, [showToast]);

  const handleMappingChange = useCallback((sourceField: string, targetField: string) => {
    setColumnMapping((prev) => ({ ...prev, [sourceField]: targetField }));
  }, []);

  const applyMapping = useCallback(() => {
    if (!file || !parsedData.length) return;

    const mappedRows: ParsedRow[] = previewRows.map((row, index) => {
      const mappedData: Record<string, string> = {};
      let type = selectedType;

      Object.entries(row).forEach(([sourceKey, value]) => {
        const targetKey = columnMapping[sourceKey];
        if (targetKey) {
          if (targetKey === 'type') {
            type = value;
          } else {
            mappedData[targetKey] = value;
          }
        }
      });

      const fields = TYPE_FIELDS[type] || [];
      const errors: string[] = [];
      fields.forEach((f) => {
        if (f.required && !mappedData[f.field]) {
          errors.push(`Missing required field: ${f.label}`);
        }
      });

      return {
        id: `import-${Date.now()}-${index}`,
        type,
        data: mappedData,
        original: row,
        valid: errors.length === 0,
        errors,
      };
    });

    setParsedData(mappedRows);
    showToast({ type: 'success', title: 'Mapping applied', message: `${mappedRows.length} rows ready` });
  }, [previewRows, columnMapping, selectedType, parsedData, showToast]);

  const validateRow = useCallback((row: ParsedRow): ParsedRow => {
    const fields = TYPE_FIELDS[row.type] || [];
    const errors: string[] = [];
    fields.forEach((f) => {
      if (f.required && !row.data[f.field]) {
        errors.push(`Missing required field: ${f.label}`);
      }
    });
    return { ...row, valid: errors.length === 0, errors };
  }, []);

  const handleConfirmImport = useCallback(() => {
    const validRows = parsedData.filter((r) => r.valid);
    if (validRows.length === 0) {
      showToast({ type: 'warning', title: 'No valid rows', message: 'Fix errors or adjust mapping' });
      return;
    }
    onImport(validRows);
    showToast({ type: 'success', title: 'Imported', message: `${validRows.length} rows added` });
    resetImport();
  }, [parsedData, onImport, showToast]);

  const resetImport = useCallback(() => {
    setFile(null);
    setParsedData([]);
    setColumnMapping({});
    setShowMapping(false);
    setPreviewRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleManualAdd = useCallback(() => {
    const fields = TYPE_FIELDS[selectedType] || [];
    const emptyData: Record<string, string> = {};
    fields.forEach((f) => { emptyData[f.field] = ''; });
    
    const newRow: ParsedRow = {
      id: `manual-${Date.now()}`,
      type: selectedType,
      data: emptyData,
      original: {},
      valid: false,
      errors: fields.filter(f => f.required).map(f => `Missing required field: ${f.label}`),
    };
    setParsedData([...parsedData, newRow]);
  }, [selectedType, parsedData]);

  const updateManualRow = useCallback((id: string, field: string, value: string) => {
    setParsedData(parsedData.map((row) => {
      if (row.id !== id) return row;
      const newData = { ...row.data, [field]: value };
      const validated = validateRow({ ...row, data: newData });
      return validated;
    }));
  }, [parsedData, validateRow]);

  const removeRow = useCallback((id: string) => {
    setParsedData(parsedData.filter((r) => r.id !== id));
  }, [parsedData]);

  const validCount = parsedData.filter((r) => r.valid).length;
  const errorCount = parsedData.filter((r) => !r.valid).length;

  return (
    <Card variant="glass" padding="none" className={clsx('overflow-hidden', className)}>
      <div className="p-4 border-b border-glass-border dark:border-glass-border-dark">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabList className="w-full sm:w-auto">
            <TabTrigger value="file" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              CSV / JSON
            </TabTrigger>
            <TabTrigger value="manual" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Manual Entry
            </TabTrigger>
          </TabList>
        </Tabs>
      </div>

      <TabContent value="file" className="p-4">
        {!showMapping ? (
          <div className="text-center py-12">
            <label className="relative cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="sr-only"
              />
              <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">Drop CSV or JSON file here</p>
              <p className="text-muted-foreground">Or click to browse</p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Columns will be mapped to QR code fields
              </p>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Column Mapping</h4>
              <Badge variant={validCount > 0 ? 'success' : 'default'}>
                {validCount} valid / {errorCount} errors
              </Badge>
            </div>

            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border dark:border-glass-border-dark">
                    <th className="px-3 py-2 text-left text-muted-foreground">Source Column</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Sample Data</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Map To</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(columnMapping).map((sourceKey) => (
                    <tr key={sourceKey} className="border-b border-glass-border/50 dark:border-glass-border-dark/50">
                      <td className="px-3 py-2 font-mono text-foreground">{sourceKey}</td>
                      <td className="px-3 py-2 text-muted-foreground font-mono truncate max-w-[150px]">
                        {previewRows[0]?.[sourceKey] || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button variant="outline" className="w-full justify-between text-xs py-1.5">
                              {columnMapping[sourceKey] || '— Ignore —'}
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </DropdownTrigger>
                          <div className="dropdown-menu dropdown-menu-end w-56 max-h-64 overflow-auto">
                            <DropdownItem onClick={() => handleMappingChange(sourceKey, '')}>
                              Ignore
                            </DropdownItem>
                            <DropdownItem onClick={() => handleMappingChange(sourceKey, 'type')}>
                              Type
                            </DropdownItem>
                            <hr className="border-glass-border dark:border-glass-border-dark my-1" />
                            {(TYPE_FIELDS[selectedType] || []).map((f) => (
                              <DropdownItem
                                key={f.field}
                                onClick={() => handleMappingChange(sourceKey, f.field)}
                                className={clsx(columnMapping[sourceKey] === f.field && 'bg-primary/10')}
                              >
                                {columnMapping[sourceKey] === f.field && <Check className="w-4 h-4 text-primary" />}
                                {f.label} {f.required && <span className="text-red-500 ml-1">*</span>}
                              </DropdownItem>
                            ))}
                          </div>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="input-base py-1.5 text-sm w-auto"
                >
                  {QR_TYPES.map((t) => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
                <Button onClick={applyMapping} variant="primary" size="sm">
                  <Check className="w-4 h-4 mr-1" />
                  Apply Mapping
                </Button>
              </label>
            </div>
          </div>
        )}

        {parsedData.length > 0 && (
          <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
            <h4 className="font-medium text-foreground mb-3">Preview ({parsedData.length} rows)</h4>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border dark:border-glass-border-dark sticky top-0 bg-glass/50 backdrop-blur">
                    <th className="px-3 py-2 text-left text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left text-muted-foreground">Type</th>
                    {Object.keys(parsedData[0]?.data || {}).map((field) => (
                      <th key={field} className="px-3 py-2 text-left text-muted-foreground">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-muted-foreground">Status</th>
                    <th className="px-3 py-2 text-left text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 50).map((row, index) => (
                    <tr key={row.id} className={clsx('border-b border-glass-border/50 dark:border-glass-border-dark/50', !row.valid && 'bg-red-500/5')}>
                      <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline">{row.type.toUpperCase()}</Badge>
                      </td>
                      {Object.entries(row.data).map(([field, value]) => (
                        <td key={field} className="px-3 py-2 font-mono truncate max-w-[150px]">
                          {value || <span className="text-muted-foreground/50">—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <Badge variant={row.valid ? 'success' : 'destructive'} className="gap-1">
                          {row.valid ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {row.valid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        {!row.valid && row.errors.length > 0 && (
                          <Tooltip content={row.errors.join('\n')}>
                            <AlertCircle className="w-4 h-4 text-red-500 cursor-help" />
                          </Tooltip>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} className="text-muted-foreground">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {parsedData.length > 50 && (
                    <tr>
                      <td colSpan={5 + Object.keys(parsedData[0]?.data || {}).length} className="px-3 py-4 text-center text-muted-foreground">
                        Showing first 50 of {parsedData.length} rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-glass-border dark:border-glass-border-dark">
              <Button variant="outline" onClick={resetImport}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button onClick={handleConfirmImport} disabled={validCount === 0}>
                <ArrowRight className="w-4 h-4 mr-1" />
                Import {validCount} Row{validCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </TabContent>

      <TabContent value="manual" className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground">Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-base py-1.5 text-sm w-auto"
          >
            {QR_TYPES.map((t) => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
          <Button variant="outline" onClick={handleManualAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Row
          </Button>
        </div>

        {parsedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No rows added. Select a type and click "Add Row" to start.</p>
          </div>
        )}

        <div className="space-y-3 max-h-96 overflow-auto">
          {parsedData.map((row, index) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx('p-3 rounded-xl border', row.valid ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5')}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{index + 1}.</span>
                  <Badge variant="outline">{row.type.toUpperCase()}</Badge>
                  <Badge variant={row.valid ? 'success' : 'destructive'} className="gap-1">
                    {row.valid ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {row.valid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} className="text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {(TYPE_FIELDS[row.type] || []).map((f) => (
                  <div key={f.field} className={clsx('space-y-1', f.required && 'border-l-2 border-red-500 pl-2')}>
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={row.data[f.field] || ''}
                      onChange={(e) => updateManualRow(row.id, f.field, e.target.value)}
                      placeholder={f.label}
                      className={clsx(
                        'input-base py-1.5 text-sm',
                        !row.valid && row.errors.some(e => e.includes(f.label)) && 'border-red-500'
                      )}
                    />
                    {row.errors.some(e => e.includes(f.label)) && (
                      <p className="text-xs text-red-500">{row.errors.find(e => e.includes(f.label))}</p>
                    )}
                  </div>
                ))}
              </div>

              {!row.valid && row.errors.length > 0 && (
                <div className="mt-2 p-2 bg-red-500/10 rounded-lg text-xs text-red-500">
                  {row.errors.join(', ')}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {parsedData.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t border-glass-border dark:border-glass-border-dark">
            <Button variant="outline" onClick={resetImport}>
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
            <Button onClick={handleConfirmImport} disabled={validCount === 0}>
              <ArrowRight className="w-4 h-4 mr-1" />
              Import {validCount} Row{validCount !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </TabContent>
    </Card>
  );
}

import { TabContent } from '@components/ui/Tabs';