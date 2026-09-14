import { useCallback, useRef, useState, useEffect } from 'react';
import { QRCodeEngine, type QROptions, type QRResult, type ExportFormat, type ExportOptions } from '../lib/qr/qrEngine';

/**
 * Hook for QR code generation and export
 * Wraps QRCodeEngine with React lifecycle management
 */
export function useQR() {
  const engineRef = useRef<QRCodeEngine | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<QRResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize engine on mount
  useEffect(() => {
    engineRef.current = new QRCodeEngine();
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  /**
   * Generate QR code
   */
  const generateQR = useCallback(async (options: QROptions): Promise<QRResult | null> => {
    const engine = engineRef.current;
    if (!engine) {
      setError(new Error('QR engine not initialized'));
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await engine.generate(options);
      setLastResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate QR code');
      setError(error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Export QR code in specified format
   */
  const exportQR = useCallback(
    async (format: ExportFormat, options: ExportOptions = {}): Promise<Blob | string | null> => {
      const engine = engineRef.current;
      if (!engine || !lastResult) {
        setError(new Error('No QR code to export. Generate one first.'));
        return null;
      }

      try {
        return await engine.export(format, options);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(`Failed to export as ${format}`);
        setError(error);
        return null;
      }
    },
    [lastResult]
  );

  /**
   * Preview QR code (returns data URL for live preview)
   * Lightweight generation for preview without full export
   */
  const previewQR = useCallback(
    async (options: QROptions): Promise<string | null> => {
      const engine = engineRef.current;
      if (!engine) {
        setError(new Error('QR engine not initialized'));
        return null;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const result = await engine.generate({
          ...options,
          width: Math.min(options.width ?? 256, 256),
          height: Math.min(options.height ?? 256, 256),
        });
        return result.dataUrl;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate preview');
        setError(error);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Get canvas element for direct manipulation
   */
  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    const engine = engineRef.current;
    if (!engine) return null;
    try {
      return engine.getCanvas();
    } catch {
      return null;
    }
  }, []);

  /**
   * Get SVG string
   */
  const getSVG = useCallback(async (): Promise<string | null> => {
    const engine = engineRef.current;
    if (!engine) return null;
    try {
      return await engine.getSVG();
    } catch {
      return null;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => setError(null), []);

  /**
   * Reset engine (useful for recovery)
   */
  const reset = useCallback(() => {
    engineRef.current?.destroy();
    engineRef.current = new QRCodeEngine();
    setLastResult(null);
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    lastResult,
    error,
    // Actions
    generateQR,
    exportQR,
    previewQR,
    getCanvas,
    getSVG,
    clearError,
    reset,
  };
}

/**
 * Hook for managing multiple QR codes (batch operations)
 */
export function useQRBatch() {
  const engineRef = useRef<QRCodeEngine | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<QRResult[]>([]);
  const [errors, setErrors] = useState<Array<{ index: number; error: Error }>>([]);

  useEffect(() => {
    engineRef.current = new QRCodeEngine();
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  const generateBatch = useCallback(
    async (optionsList: QROptions[]): Promise<QRResult[]> => {
      const engine = engineRef.current;
      if (!engine) throw new Error('QR engine not initialized');

      setIsProcessing(true);
      setProgress(0);
      setResults([]);
      setErrors([]);

      const batchResults: QRResult[] = [];
      const batchErrors: Array<{ index: number; error: Error }> = [];

      for (let i = 0; i < optionsList.length; i++) {
        try {
          const result = await engine.generate(optionsList[i]);
          batchResults.push(result);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Generation failed');
          batchErrors.push({ index: i, error });
        }
        setProgress((i + 1) / optionsList.length);
      }

      setResults(batchResults);
      setErrors(batchErrors);
      setIsProcessing(false);

      return batchResults;
    },
    []
  );

  const exportBatch = useCallback(
    async (format: ExportFormat, options: ExportOptions = {}): Promise<(Blob | string)[]> => {
      const engine = engineRef.current;
      if (!engine || results.length === 0) return [];

      const exports: (Blob | string)[] = [];
      for (const result of results) {
        // We need to regenerate or use the engine's export
        // For now, convert canvas to blob
        const canvas = result.canvas;
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), `image/${format === 'svg' ? 'svg+xml' : format}`, options.quality);
        });
        exports.push(blob);
      }
      return exports;
    },
    [results]
  );

  const clear = useCallback(() => {
    setResults([]);
    setErrors([]);
    setProgress(0);
  }, []);

  return {
    isProcessing,
    progress,
    results,
    errors,
    generateBatch,
    exportBatch,
    clear,
  };
}

export default useQR;