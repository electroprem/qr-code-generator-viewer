import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * QR Record stored in IndexedDB
 */
export interface QRRecord {
  /** Unique identifier */
  id: string;
  /** QR code data */
  data: string;
  /** Template type */
  type: string;
  /** SVG string */
  svg: string;
  /** PNG as base64 data URL */
  png: string;
  /** Thumbnail data URL (smaller version) */
  thumbnail: string;
  /** Generation settings */
  settings: QRSettings;
  /** User tags */
  tags: string[];
  /** Favorite flag */
  favorite: boolean;
  /** Scan count */
  scans: number;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * QR generation settings snapshot
 */
export interface QRSettings {
  width: number;
  height: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  dotsOptions?: Record<string, unknown>;
  cornersSquareOptions?: Record<string, unknown>;
  cornersDotOptions?: Record<string, unknown>;
  backgroundOptions?: Record<string, unknown>;
  imageOptions?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Filter options for querying QR records
 */
export interface QRFilter {
  /** Search query (matches data, type, tags) */
  query?: string;
  /** Filter by type */
  type?: string;
  /** Filter by favorite status */
  favorite?: boolean;
  /** Filter by tags (any match) */
  tags?: string[];
  /** Date range start */
  dateFrom?: string;
  /** Date range end */
  dateTo?: string;
  /** Sort field */
  sortBy?: 'createdAt' | 'updatedAt' | 'type' | 'favorite';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Pagination offset */
  offset?: number;
  /** Pagination limit */
  limit?: number;
}

/**
 * Database statistics
 */
export interface DBStats {
  totalRecords: number;
  totalSize: number;
  byType: Record<string, number>;
  favoriteCount: number;
  tagCounts: Record<string, number>;
  oldestRecord: string | null;
  newestRecord: string | null;
}

/**
 * Export data structure
 */
export interface ExportData {
  version: number;
  exportedAt: string;
  records: QRRecord[];
}

// Type-safe database schema using idb's DBSchema
// Using a simplified approach to avoid complex index signature issues
interface QRDatabase extends DBSchema {
  qrs: {
    key: string;
    value: QRRecord;
    indexes: {
      'by-type': string;
      'by-favorite': boolean;
      'by-created': string;
      'by-updated': string;
      'by-tags': string;
    };
  };
  metadata: {
    key: string;
    value: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any;
}

let dbInstance: IDBPDatabase<QRDatabase> | null = null;
const DB_NAME = 'qr-studio-db';
const DB_VERSION = 1;

/**
 * Initialize and get database instance
 */
export async function initDB(): Promise<IDBPDatabase<QRDatabase>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<QRDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // QR records store
      const qrStore = db.createObjectStore('qrs', { keyPath: 'id' });
      qrStore.createIndex('by-type', 'type');
      qrStore.createIndex('by-favorite', 'favorite');
      qrStore.createIndex('by-created', 'createdAt');
      qrStore.createIndex('by-updated', 'updatedAt');
      qrStore.createIndex('by-tags', 'tags', { multiEntry: true });

      // Metadata store for settings, version info, etc.
      db.createObjectStore('metadata', { keyPath: 'key' });
    },
  });

  return dbInstance;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Save QR record
 * @param qr - QR record to save (id optional for new records)
 * @returns Saved record with ID
 */
export async function saveQR(qr: Omit<QRRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<QRRecord> {
  const db = await initDB();
  const now = new Date().toISOString();

  const record: QRRecord = {
    ...qr,
    id: qr.id ?? generateId(),
    createdAt: qr.id ? (await db.get('qrs', qr.id))?.createdAt ?? now : now,
    updatedAt: now,
  };

  await db.put('qrs', record);
  return record;
}

/**
 * Get QR records with optional filtering
 * @param filter - Filter options
 * @returns Array of matching QR records
 */
export async function getQRs(filter: QRFilter = {}): Promise<QRRecord[]> {
  const db = await initDB();
  const {
    query,
    type,
    favorite,
    tags,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    offset = 0,
    limit = 100,
  } = filter;

  // Start with all records or use index
  let records: QRRecord[];

  if (type) {
    records = await db.getAllFromIndex('qrs', 'by-type', type);
  } else if (favorite !== undefined) {
    // Boolean index not directly queryable, filter after
    records = await db.getAll('qrs');
    records = records.filter((r) => r.favorite === favorite);
  } else {
    records = await db.getAll('qrs');
  }

  // Apply filters
  if (query) {
    const lowerQuery = query.toLowerCase();
    records = records.filter(
      (r) =>
        r.data.toLowerCase().includes(lowerQuery) ||
        r.type.toLowerCase().includes(lowerQuery) ||
        r.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }

  if (tags?.length) {
    records = records.filter((r) => tags.some((t) => r.tags.includes(t)));
  }

  if (dateFrom) {
    records = records.filter((r) => r.createdAt >= dateFrom);
  }

  if (dateTo) {
    records = records.filter((r) => r.createdAt <= dateTo);
  }

  // Sort
  records.sort((a, b) => {
    let aVal: string | boolean = a[sortBy];
    let bVal: string | boolean = b[sortBy];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // Paginate
  return records.slice(offset, offset + limit);
}

/**
 * Get single QR record by ID
 * @param id - Record ID
 * @returns QR record or undefined
 */
export async function getQR(id: string): Promise<QRRecord | undefined> {
  const db = await initDB();
  return db.get('qrs', id);
}

/**
 * Delete QR record by ID
 * @param id - Record ID
 * @returns True if deleted
 */
export async function deleteQR(id: string): Promise<boolean> {
  const db = await initDB();
  const record = await db.get('qrs', id);
  if (!record) return false;
  await db.delete('qrs', id);
  return true;
}

/**
 * Clear all QR records
 */
export async function clearAll(): Promise<void> {
  const db = await initDB();
  await db.clear('qrs');
}

/**
 * Get database statistics
 */
export async function getStats(): Promise<DBStats> {
  const db = await initDB();
  const records = await db.getAll('qrs');

  const byType: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  let favoriteCount = 0;
  let totalSize = 0;

  records.forEach((r: QRRecord) => {
    byType[r.type] = (byType[r.type] || 0) + 1;
    if (r.favorite) favoriteCount++;
    r.tags.forEach((t: string) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
    // Estimate size (rough)
    totalSize += JSON.stringify(r).length * 2; // UTF-16 approx
  });

  const sortedByDate = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return {
    totalRecords: records.length,
    totalSize,
    byType,
    favoriteCount,
    tagCounts,
    oldestRecord: sortedByDate[0]?.createdAt ?? null,
    newestRecord: sortedByDate[sortedByDate.length - 1]?.createdAt ?? null,
  };
}

/**
 * Export all records as JSON
 */
export async function exportAll(): Promise<ExportData> {
  const records = await getQRs({ limit: 10000 });
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
  };
}

/**
 * Import records from exported data
 * @param data - Exported data
 * @returns Number of imported records
 */
export async function importAll(data: ExportData): Promise<number> {
  const db = await initDB();
  let imported = 0;

  const tx = db.transaction('qrs', 'readwrite');
  for (const record of data.records) {
    // Check for duplicate by ID
    const existing = await tx.store.get(record.id);
    if (!existing) {
      await tx.store.put(record);
      imported++;
    }
  }
  await tx.done;

  return imported;
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(id: string): Promise<QRRecord | undefined> {
  const db = await initDB();
  const record = await db.get('qrs', id);
  if (!record) return undefined;

  record.favorite = !record.favorite;
  record.updatedAt = new Date().toISOString();
  await db.put('qrs', record);
  return record;
}

/**
 * Add tag to record
 */
export async function addTag(id: string, tag: string): Promise<QRRecord | undefined> {
  const db = await initDB();
  const record = await db.get('qrs', id);
  if (!record) return undefined;

  const normalizedTag = tag.trim().toLowerCase();
  if (!record.tags.includes(normalizedTag)) {
    record.tags.push(normalizedTag);
    record.updatedAt = new Date().toISOString();
    await db.put('qrs', record);
  }
  return record;
}

/**
 * Remove tag from record
 */
export async function removeTag(id: string, tag: string): Promise<QRRecord | undefined> {
  const db = await initDB();
  const record = await db.get('qrs', id);
  if (!record) return undefined;

  record.tags = record.tags.filter((t: string) => t !== tag);
  record.updatedAt = new Date().toISOString();
  await db.put('qrs', record);
  return record;
}

/**
 * Update record settings
 */
export async function updateSettings(id: string, settings: Partial<QRSettings>): Promise<QRRecord | undefined> {
  const db = await initDB();
  const record = await db.get('qrs', id);
  if (!record) return undefined;

  record.settings = { ...record.settings, ...settings };
  record.updatedAt = new Date().toISOString();
  await db.put('qrs', record);
  return record;
}

/**
 * Close database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export default {
  initDB,
  saveQR,
  getQRs,
  getQR,
  deleteQR,
  clearAll,
  getStats,
  exportAll,
  importAll,
  toggleFavorite,
  addTag,
  removeTag,
  updateSettings,
  closeDB,
};