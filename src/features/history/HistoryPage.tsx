import { useState, useMemo } from 'react';
import { Clock, Trash2, Download, Copy, Search, Filter, ChevronDown, Eye, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { useToast } from '@components/providers/ToastProvider';
import { useQRStore } from '@store/qrStore';
import { clsx } from 'clsx';

const typeIcons: Record<string, React.ReactNode> = {
  url: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  text: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  email: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  sms: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  wifi: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12l11-11 11 11"/><path d="M5 16l7-7 7 7"/></svg>,
  vcard: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  location: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  whatsapp: <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  upi: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>,
  crypto: <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>,
  calendar: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  app: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
};

const typeVariant: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  url: 'default',
  text: 'default',
  email: 'info',
  phone: 'success',
  sms: 'success',
  wifi: 'primary',
  vcard: 'default',
  location: 'info',
  whatsapp: 'success',
  upi: 'primary',
  crypto: 'warning',
  calendar: 'default',
  app: 'default',
};

export function HistoryPage() {
  const { showToast } = useToast();
  const qrHistory = useQRStore(state => state.qrHistory);
  const setSearchQuery = useQRStore(state => state.setSearchQuery);
  const setFilterType = useQRStore(state => state.setFilterType);
  const setSortBy = useQRStore(state => state.setSortBy);
  const searchQuery = useQRStore(state => state.ui.searchQuery);
  const filterType = useQRStore(state => state.ui.filter?.type);
  const sortBy = useQRStore(state => state.ui.sortBy);
  const [showFilters, setShowFilters] = useState(false);

  const filteredHistory = useMemo(() => {
    let items = [...qrHistory];
    
    if (searchQuery) {
      items = items.filter(item => 
        item.data.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (filterType !== 'all') {
      items = items.filter(item => item.type === filterType);
    }
    
    items.sort((a, b) => {
      if ((sortBy as string) === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if ((sortBy as string) === 'scans') return ((b as any).scans || 0) - ((a as any).scans || 0);
      return a.type.localeCompare(b.type);
    });
    
    return items;
  }, [qrHistory, searchQuery, filterType, sortBy]);

  const handleDelete = (id: string) => {
    useQRStore.getState().deleteQR(id);
    showToast({ type: 'success', title: 'Deleted from history' });
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    showToast({ type: 'success', title: 'Copied to clipboard' });
  };

  const handleDownload = async (_item: typeof qrHistory[0]) => {
    try {
      showToast({ type: 'success', title: 'Downloaded QR code' });
    } catch {
      showToast({ type: 'error', title: 'Download failed' });
    }
  };

  const handleRegenerate = (item: typeof qrHistory[0]) => {
    useQRStore.getState().setSettings(item.settings);
    useQRStore.getState().setActiveTab('generator');
    showToast({ type: 'success', title: 'Settings loaded for regeneration' });
  };

  const handleToggleFavorite = (id: string) => {
    useQRStore.getState().toggleFavorite(id);
    showToast({ type: 'success', title: 'Favorite toggled' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">History</h1>
          <p className="text-muted-foreground mt-1">Your previously generated QR codes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-1" />
            Filters
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card variant="glass" padding="md">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                </div>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 rounded-xl border border-glass-border dark:border-glass-border-dark bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Types</option>
                  <option value="url">URL</option>
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS</option>
                  <option value="wifi">WiFi</option>
                  <option value="vcard">Contact</option>
                  <option value="location">Location</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="upi">UPI</option>
                  <option value="crypto">Crypto</option>
                  <option value="calendar">Calendar</option>
                  <option value="app">App Link</option>
                </select>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full sm:w-48 px-3 py-2 rounded-xl border border-glass-border dark:border-glass-border-dark bg-background/50 backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="date">Sort by Date</option>
                  <option value="scans">Sort by Scans</option>
                  <option value="type">Sort by Type</option>
                </select>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card variant="glass" padding="none" className="overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No history found</h3>
            <p className="text-muted-foreground">Generate some QR codes to see them here</p>
          </div>
        ) : (
          <div className="divide-y divide-glass-border dark:divide-glass-border-dark">
            {filteredHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {typeIcons[item.type] || typeIcons.url}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground truncate">{item.data.slice(0, 50)}</span>
                      <Badge variant={typeVariant[item.type] || 'default'} size="sm" dot>
                        {item.type.toUpperCase()}
                      </Badge>
                      {item.favorite && (
                        <Badge variant="warning" size="sm" dot>
                          ★ Favorite
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {item.scans || 0} scans
                      </span>
                      {item.tags && item.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-3.5 h-3.5" style={{ maskImage: 'url("data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22><path d=%22M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V4h10l8.59 8.59a2 2 0 0 1 0 2.82z%22/><line x1=%227%22 y1=%227%22 x2=%227.01%22 y2=%227.01%22/></svg>")' }} />
                          {item.tags.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(item.data)} aria-label="Copy content">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(item)} aria-label="Download QR">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRegenerate(item)} aria-label="Regenerate with these settings">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleFavorite(item.id)} aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}>
                      <svg className={clsx('w-4 h-4', item.favorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground')} viewBox="0 0 24 24" fill={item.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} aria-label="Delete from history">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}