import { useState, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Calendar, Tag, Star, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { Badge } from '@components/ui/Badge';
import { useQRStore, selectAllTags, selectByType } from '@store/qrStore';

const QR_TYPES = [
  'url', 'text', 'email', 'phone', 'sms', 'wifi',
  'vcard', 'location', 'whatsapp', 'upi', 'crypto', 'calendar', 'applink'
] as const;

const TYPE_LABELS: Record<string, string> = {
  url: 'URL',
  text: 'Text',
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  wifi: 'WiFi',
  vcard: 'vCard',
  location: 'Location',
  whatsapp: 'WhatsApp',
  upi: 'UPI',
  crypto: 'Crypto',
  calendar: 'Calendar',
  applink: 'App Link',
};

interface HistoryFiltersProps {
  className?: string;
}

export function HistoryFilters({ className }: HistoryFiltersProps) {
  const {
    ui,
    setFilter,
    setSearch,
    setViewMode,
    setSort,
    toggleFavorite: _toggleFavorite,
  } = useQRStore();

  const { searchQuery, filter, viewMode, sortBy, sortOrder } = ui;
  const allTags = useQRStore(selectAllTags);
  const byType = useQRStore(selectByType);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState(filter.dateFrom || '');
  const [dateTo, setDateTo] = useState(filter.dateTo || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(filter.tags || []);
  const [favoritesOnly, setFavoritesOnly] = useState(filter.favorite || false);
  const [selectedType, setSelectedType] = useState<string>(filter.type || 'all');

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, [setSearch]);

  const handleTypeChange = useCallback((type: string) => {
    setSelectedType(type);
    setFilter({ type: type === 'all' ? undefined : type });
  }, [setFilter]);

  const handleTagToggle = useCallback((tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    setFilter({ tags: newTags.length > 0 ? newTags : undefined });
  }, [selectedTags, setFilter]);

  const handleDateFromChange = useCallback((value: string) => {
    setDateFrom(value);
    setFilter({ dateFrom: value || undefined });
  }, [setFilter]);

  const handleDateToChange = useCallback((value: string) => {
    setDateTo(value);
    setFilter({ dateTo: value || undefined });
  }, [setFilter]);

  const handleFavoritesToggle = useCallback((checked: boolean) => {
    setFavoritesOnly(checked);
    setFilter({ favorite: checked || undefined });
  }, [setFilter]);

  const handleClearFilters = useCallback(() => {
    setSelectedType('all');
    setSelectedTags([]);
    setDateFrom('');
    setDateTo('');
    setFavoritesOnly(false);
    setFilter({});
    setSearch('');
  }, [setFilter, setSearch]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery ||
      selectedType !== 'all' ||
      selectedTags.length > 0 ||
      dateFrom ||
      dateTo ||
      favoritesOnly
    );
  }, [searchQuery, selectedType, selectedTags.length, dateFrom, dateTo, favoritesOnly]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedType !== 'all') count++;
    if (selectedTags.length > 0) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (favoritesOnly) count++;
    return count;
  }, [searchQuery, selectedType, selectedTags.length, dateFrom, dateTo, favoritesOnly]);

  return (
    <div className={clsx('space-y-4', className)}>
      <Card variant="glass" padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
              icon={<Filter className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip content="View mode">
              <div className="flex bg-surface rounded-lg p-1" role="radiogroup" aria-label="View mode">
                {(['grid', 'list'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'primary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    aria-label={mode === 'grid' ? 'Grid view' : 'List view'}
                  >
                    {mode === 'grid' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </Button>
                ))}
              </div>
            </Tooltip>

            <Tooltip content="Sort">
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="outline" size="sm" className="gap-1">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">Sort</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <div className="dropdown-menu dropdown-menu-end">
                  {(['createdAt', 'updatedAt', 'type', 'favorite'] as const).map((sort) => (
                    <DropdownItem
                      key={sort}
                      value={sort}
                      onClick={() => setSort(sort)}
                      className={sortBy === sort ? 'bg-primary/10' : ''}
                    >
                      {sortBy === sort && (
                        <span className="w-4 h-4 text-primary">✓</span>
                      )}
                      <span className="flex-1">
                        {sort === 'createdAt' ? 'Date Created' : sort === 'updatedAt' ? 'Date Updated' : sort === 'type' ? 'Type' : 'Favorite'}
                      </span>
                      {sortBy === sort && (
                        <span className={sortOrder === 'asc' ? 'text-primary' : 'text-muted-foreground'}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </DropdownItem>
                  ))}
                </div>
              </Dropdown>
            </Tooltip>

            <Tooltip content={showAdvanced ? 'Hide advanced filters' : 'Show advanced filters'}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={clsx(hasActiveFilters && 'border-primary/50 text-primary')}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </Tooltip>
          </div>
        </div>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-4 pt-4 border-t border-glass-border dark:border-glass-border-dark"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant="outline" className="w-full justify-between">
                        <span>{TYPE_LABELS[selectedType] || 'All Types'}</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownTrigger>
                    <div className="dropdown-menu dropdown-menu-end w-56">
                      <DropdownItem value="all" onClick={() => handleTypeChange('all')}>
                        {selectedType === 'all' && <span className="w-4 h-4 text-primary">✓</span>}
                        All Types
                      </DropdownItem>
                      {QR_TYPES.map((type) => (
                        <DropdownItem key={type} value={type} onClick={() => handleTypeChange(type)}>
                          {selectedType === type && <span className="w-4 h-4 text-primary">✓</span>}
                          {TYPE_LABELS[type]} {byType[type] && <span className="text-muted-foreground ml-auto">({byType[type].length})</span>}
                        </DropdownItem>
                      ))}
                    </div>
                  </Dropdown>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant="outline" className="w-full justify-between">
                        <span>
                          {selectedTags.length === 0
                            ? 'All Tags'
                            : selectedTags.length === 1
                            ? selectedTags[0]
                            : `${selectedTags.length} selected`}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownTrigger>
                    <div className="dropdown-menu dropdown-menu-end w-64 max-h-64 overflow-auto">
                      {allTags.length === 0 ? (
                        <DropdownItem value="no-tags" className="text-muted-foreground pointer-events-none">No tags yet</DropdownItem>
                      ) : (
                        allTags.map((tag) => (
                          <DropdownItem
                            key={tag}
                            value={tag}
                            onClick={() => handleTagToggle(tag)}
                            className="flex items-center justify-between"
                          >
                            <span>#{tag}</span>
                            {selectedTags.includes(tag) && <span className="w-4 h-4 text-primary">✓</span>}
                          </DropdownItem>
                        ))
                      )}
                    </div>
                  </Dropdown>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Date From</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    placeholder="Start date"
                    icon={<Calendar className="w-4 h-4" />}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Date To</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    placeholder="End date"
                    icon={<Calendar className="w-4 h-4" />}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={favoritesOnly}
                    onChange={(e) => handleFavoritesToggle(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-foreground">Favorites only</span>
                </label>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear all filters
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2" role="status" aria-live="polite">
          {searchQuery && (
            <Badge variant="outline" className="gap-1">
              <span>Search: "{searchQuery}"</span>
              <Button variant="ghost" size="icon" className="p-0" onClick={() => handleSearchChange('')} aria-label="Clear search">
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          {selectedType !== 'all' && (
            <Badge variant="outline" className="gap-1">
              <span>Type: {TYPE_LABELS[selectedType]}</span>
              <Button variant="ghost" size="icon" className="p-0" onClick={() => handleTypeChange('all')} aria-label="Clear type filter">
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1">
              <Tag className="w-3 h-3" />
              <span>#{tag}</span>
              <Button variant="ghost" size="icon" className="p-0" onClick={() => handleTagToggle(tag)} aria-label={`Remove tag ${tag}`}>
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
          {dateFrom && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              <span>From: {dateFrom}</span>
              <Button variant="ghost" size="icon" className="p-0" onClick={() => handleDateFromChange('')} aria-label="Clear date from">
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          {dateTo && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              <span>To: {dateTo}</span>
              <Button variant="ghost" size="icon" className="p-0" onClick={() => handleDateToChange('')} aria-label="Clear date to">
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          {favoritesOnly && (
            <Badge variant="outline" className="gap-1">
              <Star className="w-3 h-3 fill-current text-yellow-500" />
              <span>Favorites only</span>
              <Button variant="ghost" size="icon" className="p-0" onClick={() => handleFavoritesToggle(false)} aria-label="Clear favorites filter">
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}