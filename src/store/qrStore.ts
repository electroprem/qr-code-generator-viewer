import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QRRecord, QRFilter } from '../lib/storage/indexedDB';

/**
 * Current QR generation settings
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
 * UI state
 */
export interface UIState {
  activeTab: 'generator' | 'scanner' | 'history' | 'batch' | 'settings';
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  searchQuery: string;
  filter: QRFilter;
  viewMode: 'grid' | 'list';
  sortBy: 'createdAt' | 'updatedAt' | 'type' | 'favorite';
  sortOrder: 'asc' | 'desc';
}

/**
 * Default settings
 */
const defaultSettings: QRSettings = {
  width: 512,
  height: 512,
  margin: 16,
  errorCorrectionLevel: 'M',
};

/**
 * Default UI state
 */
const defaultUIState: UIState = {
  activeTab: 'generator',
  sidebarOpen: true,
  commandPaletteOpen: false,
  searchQuery: '',
  filter: {},
  viewMode: 'grid',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * QR Store state
 */
export interface QRStoreState {
  // History
  qrHistory: QRRecord[];
  historyLoading: boolean;
  historyError: string | null;

  // Current settings
  currentSettings: QRSettings;

  // UI state
  ui: UIState;

  // Actions - History
  addQR: (qr: QRRecord) => void;
  deleteQR: (id: string) => void;
  updateQR: (id: string, updates: Partial<QRRecord>) => void;
  setHistory: (history: QRRecord[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  setHistoryError: (error: string | null) => void;
  toggleFavorite: (id: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  setFilter: (filter: Partial<QRFilter>) => void;
  setSearch: (query: string) => void;
  // Convenience methods for feature components
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string) => void;
  setSortBy: (sortBy: UIState['sortBy']) => void;
  importHistory: (records: QRRecord[]) => void;
  exportHistory: () => QRRecord[];
  clearHistory: () => void;

  // Actions - Settings
  setSettings: (settings: Partial<QRSettings>) => void;
  resetSettings: () => void;

  // Actions - UI
  setActiveTab: (tab: UIState['activeTab']) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setViewMode: (mode: UIState['viewMode']) => void;
  setSort: (sortBy: UIState['sortBy'], sortOrder?: UIState['sortOrder']) => void;
  resetUI: () => void;
}

/**
 * Create the QR store with Zustand
 */
export const useQRStore = create<QRStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      qrHistory: [],
      historyLoading: false,
      historyError: null,
      currentSettings: defaultSettings,
      ui: defaultUIState,

      // History actions
      addQR: (qr) =>
        set((state) => ({
          qrHistory: [qr, ...state.qrHistory].slice(0, 1000), // Limit to 1000
        })),

      deleteQR: (id) =>
        set((state) => ({
          qrHistory: state.qrHistory.filter((qr) => qr.id !== id),
        })),

      updateQR: (id, updates) =>
        set((state) => ({
          qrHistory: state.qrHistory.map((qr) =>
            qr.id === id ? { ...qr, ...updates, updatedAt: new Date().toISOString() } : qr
          ),
        })),

      setHistory: (history) =>
        set({ qrHistory: history, historyLoading: false, historyError: null }),

      setHistoryLoading: (loading) =>
        set({ historyLoading: loading }),

      setHistoryError: (error) =>
        set({ historyError: error, historyLoading: false }),

      toggleFavorite: (id) =>
        set((state) => ({
          qrHistory: state.qrHistory.map((qr) =>
            qr.id === id ? { ...qr, favorite: !qr.favorite, updatedAt: new Date().toISOString() } : qr
          ),
        })),

      addTag: (id, tag) =>
        set((state) => ({
          qrHistory: state.qrHistory.map((qr) =>
            qr.id === id && !qr.tags.includes(tag)
              ? { ...qr, tags: [...qr.tags, tag], updatedAt: new Date().toISOString() }
              : qr
          ),
        })),

      removeTag: (id, tag) =>
        set((state) => ({
          qrHistory: state.qrHistory.map((qr) =>
            qr.id === id
              ? { ...qr, tags: qr.tags.filter((t) => t !== tag), updatedAt: new Date().toISOString() }
              : qr
          ),
        })),

      setFilter: (filter) =>
        set((state) => ({
          ui: { ...state.ui, filter: { ...state.ui.filter, ...filter } },
        })),

      setSearch: (query) =>
        set((state) => ({
          ui: { ...state.ui, searchQuery: query },
        })),

      // Convenience methods for feature components
      setSearchQuery: (query) =>
        set((state) => ({
          ui: { ...state.ui, searchQuery: query },
        })),

      setFilterType: (type) =>
        set((state) => ({
          ui: { ...state.ui, filter: { ...state.ui.filter, type } },
        })),

      setSortBy: (sortBy) =>
        set((state) => ({
          ui: { ...state.ui, sortBy },
        })),

      importHistory: (records) =>
        set((state) => {
          // Merge with existing, avoiding duplicates by ID
          const existingIds = new Set(state.qrHistory.map((qr) => qr.id));
          const newRecords = records.filter((qr) => !existingIds.has(qr.id));
          return {
            qrHistory: [...newRecords, ...state.qrHistory].slice(0, 1000),
          };
        }),

      exportHistory: () => get().qrHistory,

      clearHistory: () =>
        set({ qrHistory: [] }),

      // Settings actions
      setSettings: (settings) =>
        set((state) => ({
          currentSettings: { ...state.currentSettings, ...settings },
        })),

      resetSettings: () =>
        set({ currentSettings: defaultSettings }),

      // UI actions
      setActiveTab: (tab) =>
        set((state) => ({
          ui: { ...state.ui, activeTab: tab },
        })),

      toggleSidebar: () =>
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
        })),

      setSidebarOpen: (open) =>
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: open },
        })),

      toggleCommandPalette: () =>
        set((state) => ({
          ui: { ...state.ui, commandPaletteOpen: !state.ui.commandPaletteOpen },
        })),

      setCommandPaletteOpen: (open) =>
        set((state) => ({
          ui: { ...state.ui, commandPaletteOpen: open },
        })),

      setViewMode: (mode) =>
        set((state) => ({
          ui: { ...state.ui, viewMode: mode },
        })),

      setSort: (sortBy, sortOrder) =>
        set((state) => ({
          ui: {
            ...state.ui,
            sortBy,
            sortOrder: sortOrder ?? (state.ui.sortBy === sortBy && state.ui.sortOrder === 'asc' ? 'desc' : 'asc'),
          },
        })),

      resetUI: () =>
        set({ ui: defaultUIState }),
    }),
    {
      name: 'qr-studio-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSettings: state.currentSettings,
        ui: {
          activeTab: state.ui.activeTab,
          sidebarOpen: state.ui.sidebarOpen,
          viewMode: state.ui.viewMode,
          sortBy: state.ui.sortBy,
          sortOrder: state.ui.sortOrder,
        },
      }),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Migration from v0
          const state = persistedState as Partial<QRStoreState>;
          return {
            ...state,
            ui: {
              ...defaultUIState,
              ...state.ui,
            },
          };
        }
        return persistedState as QRStoreState;
      },
    }
  )
);

/**
 * Selectors for common derived state
 */
export const selectFilteredHistory = (state: QRStoreState): QRRecord[] => {
  const { qrHistory, ui } = state;
  const { searchQuery, filter } = ui;

  let result = qrHistory;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (qr) =>
        qr.data.toLowerCase().includes(query) ||
        qr.type.toLowerCase().includes(query) ||
        qr.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  if (filter.type) {
    result = result.filter((qr) => qr.type === filter.type);
  }

  if (filter.favorite !== undefined) {
    result = result.filter((qr) => qr.favorite === filter.favorite);
  }

  if (filter.tags?.length) {
    result = result.filter((qr) => filter.tags!.some((t) => qr.tags.includes(t)));
  }

  if (filter.dateFrom) {
    result = result.filter((qr) => qr.createdAt >= filter.dateFrom!);
  }

  if (filter.dateTo) {
    result = result.filter((qr) => qr.createdAt <= filter.dateTo!);
  }

  // Sort
  result.sort((a, b) => {
    let aVal: string | boolean = a[ui.sortBy];
    let bVal: string | boolean = b[ui.sortBy];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return ui.sortOrder === 'asc' ? cmp : -cmp;
  });

  return result;
};

export const selectFavorites = (state: QRStoreState): QRRecord[] =>
  state.qrHistory.filter((qr) => qr.favorite);

export const selectRecent = (state: QRStoreState, limit = 10): QRRecord[] =>
  state.qrHistory.slice(0, limit);

export const selectByType = (state: QRStoreState): Record<string, QRRecord[]> =>
  state.qrHistory.reduce((acc, qr) => {
    if (!acc[qr.type]) acc[qr.type] = [];
    acc[qr.type].push(qr);
    return acc;
  }, {} as Record<string, QRRecord[]>);

export const selectAllTags = (state: QRStoreState): string[] => {
  const tags = new Set<string>();
  state.qrHistory.forEach((qr) => qr.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
};

export default useQRStore;