import { useCallback } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  Trash2,
  Tag,
  Star,
  X,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Dropdown, DropdownItem, DropdownTrigger } from '@components/ui/Dropdown';
import { Tooltip } from '@components/ui/Tooltip';
import { useQRStore } from '@store/qrStore';
import { useToast } from '@components/providers/ToastProvider';
import type { QRRecord } from '@lib/storage/indexedDB';

interface BatchActionsToolbarProps {
  selectedIds: Set<string>;
  items: QRRecord[];
  onClearSelection: () => void;
}

export function BatchActionsToolbar({ selectedIds, items, onClearSelection }: BatchActionsToolbarProps) {
  const { showToast } = useToast();
  const { addTag, removeTag, toggleFavorite, deleteQR } = useQRStore();
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const selectedCount = selectedItems.length;

  const handleDownloadZIP = useCallback(async () => {
    if (selectedCount === 0) return;
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      for (const item of selectedItems) {
        const response = await fetch(item.png);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
        zip.file(`qr-${item.type}-${item.id.slice(0, 8)}.png`, base64, { base64: true });
      }
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qr-codes-${Date.now()}.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      showToast({ type: 'success', title: 'ZIP downloaded', message: `${selectedCount} QR codes` });
    } catch {
      showToast({ type: 'error', title: 'Failed to create ZIP' });
    }
  }, [selectedItems, selectedCount, showToast]);

  const handleExportPDF = useCallback(async () => {
    if (selectedCount === 0) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      
      let y = 20;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const response = await fetch(item.png);
        const blob = await response.blob();
        const imgData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = 180;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        if (y + pdfHeight > pageHeight - 20) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 15, y, pdfWidth, pdfHeight);
        y += pdfHeight + 10;
        
        pdf.setFontSize(10);
        pdf.text(`${item.type.toUpperCase()}: ${item.data.slice(0, 80)}`, 15, y);
        y += 15;
      }
      
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.download = `qr-codes-${Date.now()}.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      showToast({ type: 'success', title: 'PDF exported', message: `${selectedCount} QR codes` });
    } catch {
      showToast({ type: 'error', title: 'Failed to export PDF' });
    }
  }, [selectedItems, selectedCount, showToast]);

  const handleDelete = useCallback(async () => {
    if (selectedCount === 0) return;
    if (!confirm(`Delete ${selectedCount} QR code${selectedCount > 1 ? 's' : ''}?`)) return;
    
    try {
      for (const item of selectedItems) {
        await deleteQR(item.id);
      }
      onClearSelection();
      showToast({ type: 'success', title: 'Deleted', message: `${selectedCount} QR code${selectedCount > 1 ? 's' : ''} removed` });
    } catch {
      showToast({ type: 'error', title: 'Failed to delete' });
    }
  }, [selectedItems, selectedCount, deleteQR, onClearSelection, showToast]);

  const handleTag = useCallback(async (tag: string) => {
    if (selectedCount === 0) return;
    
    try {
      for (const item of selectedItems) {
        if (!item.tags.includes(tag)) {
          await addTag(item.id, tag);
        }
      }
      showToast({ type: 'success', title: 'Tag added', message: `Added "${tag}" to ${selectedCount} item${selectedCount > 1 ? 's' : ''}` });
    } catch {
      showToast({ type: 'error', title: 'Failed to add tag' });
    }
  }, [selectedItems, selectedCount, addTag, showToast]);

  const handleRemoveTag = useCallback(async (tag: string) => {
    if (selectedCount === 0) return;
    
    try {
      for (const item of selectedItems) {
        if (item.tags.includes(tag)) {
          await removeTag(item.id, tag);
        }
      }
      showToast({ type: 'success', title: 'Tag removed', message: `Removed "${tag}" from ${selectedCount} item${selectedCount > 1 ? 's' : ''}` });
    } catch {
      showToast({ type: 'error', title: 'Failed to remove tag' });
    }
  }, [selectedItems, selectedCount, removeTag, showToast]);

  const handleFavoriteToggle = useCallback(async () => {
    if (selectedCount === 0) return;
    
    try {
      const allFavorited = selectedItems.every((item) => item.favorite);
      for (const item of selectedItems) {
        if (item.favorite !== !allFavorited) {
          await toggleFavorite(item.id);
        }
      }
      showToast({ 
        type: 'success', 
        title: allFavorited ? 'Removed from favorites' : 'Added to favorites',
        message: `${selectedCount} item${selectedCount > 1 ? 's' : ''} updated`
      });
    } catch {
      showToast({ type: 'error', title: 'Failed to update favorites' });
    }
  }, [selectedItems, selectedCount, toggleFavorite, showToast]);

  const allTags = Array.from(new Set(selectedItems.flatMap((item) => item.tags))).sort();

  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4"
      >
        <Card variant="glass" padding="md" className="shadow-[var(--shadow-2xl)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onClearSelection} aria-label="Clear selection">
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-foreground">{selectedCount}</span>
                <span className="text-muted-foreground">selected</span>
              </div>
              <div className="flex items-center gap-1">
                {selectedItems.some((i) => i.favorite) && selectedItems.some((i) => !i.favorite) && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current/50" />
                )}
                {selectedItems.every((i) => i.favorite) && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Tooltip content="Download as ZIP">
                <Button onClick={handleDownloadZIP} size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  ZIP
                </Button>
              </Tooltip>

              <Tooltip content="Export as PDF">
                <Button onClick={handleExportPDF} variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </Tooltip>

              <Tooltip content={selectedItems.some((i) => !i.favorite) ? 'Add to favorites' : 'Remove from favorites'}>
                <Button onClick={handleFavoriteToggle} variant="outline" size="sm" className={clsx(selectedItems.every((i) => i.favorite) && 'text-yellow-500 border-yellow-500')}>
                  <Star className={clsx('w-4 h-4 mr-1', selectedItems.every((i) => i.favorite) && 'fill-current')} />
                  Fav
                </Button>
              </Tooltip>

              <Dropdown>
                <DropdownTrigger>
                  <Tooltip content="Add tag">
                    <Button variant="outline" size="sm">
                      <Tag className="w-4 h-4 mr-1" />
                      Tag
                      <MoreHorizontal className="w-4 h-4 ml-1" />
                    </Button>
                  </Tooltip>
                </DropdownTrigger>
                <div className="dropdown-menu dropdown-menu-end w-48">
                  <DropdownItem value="add-tag" onClick={() => {
                    const tag = prompt('Enter tag name:');
                    if (tag) handleTag(tag.trim().toLowerCase());
                  }}>
                    <Plus className="w-4 h-4" />
                    Add new tag
                  </DropdownItem>
                  {allTags.map((tag) => (
                    <DropdownItem key={tag} value={tag} onClick={() => handleRemoveTag(tag)} className="text-red-500">
                      <Tag className="w-4 h-4" />
                      Remove #{tag}
                    </DropdownItem>
                  ))}
                </div>
              </Dropdown>

              <Tooltip content="Delete selected">
                <Button onClick={handleDelete} variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}