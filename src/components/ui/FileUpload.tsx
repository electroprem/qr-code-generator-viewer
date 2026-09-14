import { useState, useRef, useCallback, DragEvent, ChangeEvent, ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onFilesChange?: (files: File[]) => void;
  onError?: (error: string, file: File) => void;
  className?: string;
  disabled?: boolean;
  showPreviews?: boolean;
  previewSize?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
}

export interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress?: number;
  error?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (file: File): ReactNode => {
  if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
};

export function FileUpload({
  accept,
  multiple = false,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  onFilesChange,
  onError,
  className,
  disabled = false,
  showPreviews = true,
  previewSize = 'md',
  label = 'Drop files here or click to upload',
  description,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [dragCount, setDragCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`;
    }
    if (accept && !matchAccept(file, accept)) {
      return `File "${file.name}" is not an accepted file type`;
    }
    return null;
  };

  const matchAccept = (file: File, acceptStr: string): boolean => {
    const types = acceptStr.split(',').map((t) => t.trim());
    return types.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];
    const errors: { file: File; error: string }[] = [];

    for (const file of fileArray) {
      if (files.length + validFiles.length >= maxFiles) {
        errors.push({ file, error: `Maximum ${maxFiles} files allowed` });
        continue;
      }
      const error = validateFile(file);
      if (error) {
        errors.push({ file, error });
        continue;
      }

      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      validFiles.push({
        file,
        preview,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        status: 'pending',
      });
    }

    errors.forEach(({ file, error }) => onError?.(error, file));

    setFiles((prev) => [...prev, ...validFiles]);
    onFilesChange?.([...files, ...validFiles].map((f) => f.file));
  }, [files, maxFiles, maxSize, accept, onFilesChange, onError]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      const remaining = prev.filter((f) => f.id !== id);
      onFilesChange?.(remaining.map((f) => f.file));
      return remaining;
    });
  }, [onFilesChange]);

  const clearFiles = useCallback(() => {
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
    onFilesChange?.([]);
  }, [files, onFilesChange]);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCount((c) => c + 1);
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCount((c) => c - 1);
    if (dragCount <= 1) setDragActive(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDragCount(0);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const previewSizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className={clsx('w-full', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="sr-only"
        disabled={disabled}
        aria-label={label}
      />
      <div
        ref={dropzoneRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        tabIndex={0}
        role="button"
        aria-label={label}
        aria-disabled={disabled}
        className={clsx(
          'relative border-2 border-dashed rounded-2xl p-6 text-center',
          'transition-all duration-200 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          disabled && 'opacity-50 cursor-not-allowed',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-glass-border dark:border-glass-border-dark hover:border-primary/50 hover:bg-surface'
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: dragActive ? 1.1 : 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={clsx('p-3 rounded-xl', dragActive ? 'bg-primary/20' : 'bg-surface')}
          >
            <Upload className={clsx('w-8 h-8 text-muted-foreground', dragActive && 'text-primary')} />
          </motion.div>
          <div>
            <p className="text-base font-medium text-foreground">{label}</p>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            <p className="text-xs text-muted-foreground mt-2">
              {accept ? `Accepted: ${accept}` : 'All file types'}
              {maxSize && ` · Max: ${formatFileSize(maxSize)}`}
              {multiple && ` · Max ${maxFiles} files`}
            </p>
          </div>
        </div>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 border-2 border-primary rounded-2xl bg-primary/5 pointer-events-none flex items-center justify-center"
          >
            <span className="text-primary font-medium">Drop to upload</span>
          </motion.div>
        )}
      </div>

      {showPreviews && files.length > 0 && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 space-y-2"
          >
            {files.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-xl bg-surface border border-glass-border dark:border-glass-border-dark',
                  uploadedFile.status === 'error' && 'border-red-500/30 bg-red-500/5'
                )}
              >
                <div className={clsx('flex-shrink-0 relative overflow-hidden rounded-lg', previewSizes[previewSize])}>
                  {uploadedFile.preview ? (
                    <img src={uploadedFile.preview} alt={uploadedFile.file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                  )}
                  {uploadedFile.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  {uploadedFile.status === 'complete' && (
                    <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                  {uploadedFile.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{uploadedFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.file.size)}</p>
                  {uploadedFile.error && (
                    <p className="text-xs text-red-500 mt-0.5">{uploadedFile.error}</p>
                  )}
                  {uploadedFile.progress !== undefined && (
                    <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadedFile.progress}%` }}
                        transition={{ duration: 300 }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  disabled={uploadedFile.status === 'uploading'}
                  className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  aria-label={`Remove ${uploadedFile.file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {files.length > 0 && !showPreviews && (
        <div className="mt-3 text-sm text-muted-foreground">
          {files.length} file{files.length > 1 ? 's' : ''} selected
          <button
            onClick={clearFiles}
            className="ml-2 text-primary hover:underline"
            type="button"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}