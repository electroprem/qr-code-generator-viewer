// IndexedDB Storage
export * from './indexedDB';
export {
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
} from './indexedDB';

export type {
  QRRecord,
  QRSettings,
  QRFilter,
  DBStats,
  ExportData,
} from './indexedDB';