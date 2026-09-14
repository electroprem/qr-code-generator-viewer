import { useState, useMemo, ReactNode } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, Search, X, Globe, Wifi, User, Mail, MessageSquare, Phone, Bitcoin, Calendar, MapPin, Smartphone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Dropdown, DropdownItem } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  category: string;
}

export interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: string | null;
  onSelect: (templateId: string | null) => void;
  className?: string;
}

const templateCategories = [
  { id: 'all', label: 'All', icon: <Globe className="w-4 h-4" /> },
  { id: 'contact', label: 'Contact', icon: <User className="w-4 h-4" /> },
  { id: 'communication', label: 'Communication', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'network', label: 'Network', icon: <Wifi className="w-4 h-4" /> },
  { id: 'payment', label: 'Payment', icon: <Bitcoin className="w-4 h-4" /> },
  { id: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  { id: 'app', label: 'App Links', icon: <Smartphone className="w-4 h-4" /> },
];

export function TemplateSelector({ templates, selectedTemplate, onSelect, className }: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, activeCategory]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, Template[]> = {};
    filteredTemplates.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filteredTemplates]);

  const dropdownItems: DropdownItem[] = templateCategories.map((cat) => ({
    value: cat.id,
    label: cat.label,
    icon: cat.icon,
  }));

  return (
    <Card variant="glass" padding="md" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-glass-border dark:border-glass-border-dark bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <Dropdown
          trigger={
            <Button variant="outline" className="w-full justify-between">
              <span>Category: {templateCategories.find(c => c.id === activeCategory)?.label}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          }
          items={dropdownItems}
          onSelect={(value) => setActiveCategory(value)}
        />

        <div className="max-h-96 overflow-y-auto space-y-3">
          {Object.entries(groupedTemplates).map(([category, tmpls]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
                {templateCategories.find(c => c.id === category)?.label}
              </h4>
              {tmpls.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelect(selectedTemplate === template.id ? null : template.id)}
                  className={clsx(
                    'w-full p-3 rounded-xl border-2 transition-all duration-200',
                    'flex items-center gap-3 text-left',
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50 hover:bg-surface'
                  )}
                >
                  <div className="p-2 rounded-lg bg-surface flex-shrink-0">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                  </div>
                  {selectedTemplate === template.id && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onSelect(null); }}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                      aria-label="Deselect template"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No templates found</p>
            </div>
          )}
        </div>

        {selectedTemplate && (
          <div className="pt-4 border-t border-glass-border dark:border-glass-border-dark">
            <Button variant="outline" className="w-full" onClick={() => onSelect(null)}>
              <X className="w-4 h-4 mr-2" />
              Clear Template
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}