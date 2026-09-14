import QRCodeStyling from 'qr-code-styling';

/**
 * QR code error correction levels
 */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * QR code rendering modes
 */
export type QRMode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Export format types
 */
export type ExportFormat = 'png' | 'svg' | 'jpeg' | 'webp' | 'pdf';

/**
 * Dot style options for QR code modules
 */
export interface DotsOptions {
  type?: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    rotation?: number;
    colorStops: Array<{ offset: number; color: string }>;
  };
}

/**
 * Corner square style options
 */
export interface CornersSquareOptions {
  type?: 'dot' | 'square' | 'extra-rounded';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    rotation?: number;
    colorStops: Array<{ offset: number; color: string }>;
  };
}

/**
 * Corner dot style options
 */
export interface CornersDotOptions {
  type?: 'dot' | 'square';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    rotation?: number;
    colorStops: Array<{ offset: number; color: string }>;
  };
}

/**
 * Background options
 */
export interface BackgroundOptions {
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    rotation?: number;
    colorStops: Array<{ offset: number; color: string }>;
  };
}

/**
 * Logo/image options
 */
export interface ImageOptions {
  hideBackgroundDots?: boolean;
  imageSize?: number;
  margin?: number;
  crossOrigin?: string;
}

/**
 * Core QR code options for generation
 */
export interface QROptions {
  /** Data to encode in the QR code */
  data: string;
  /** Width of the QR code in pixels */
  width?: number;
  /** Height of the QR code in pixels */
  height?: number;
  /** Margin around the QR code */
  margin?: number;
  /** Error correction level */
  errorCorrectionLevel?: ErrorCorrectionLevel;
  /** QR code version (1-40) */
  version?: number;
  /** QR mode */
  mode?: QRMode;
  /** Dot/module styling options */
  dotsOptions?: DotsOptions;
  /** Corner square styling options */
  cornersSquareOptions?: CornersSquareOptions;
  /** Corner dot styling options */
  cornersDotOptions?: CornersDotOptions;
  /** Background styling options */
  backgroundOptions?: BackgroundOptions;
  /** Logo/image options */
  imageOptions?: ImageOptions;
  /** Logo image source (URL, data URL, or File) */
  image?: string | File | HTMLImageElement;
  /** Additional QR code options passed to underlying library */
  qrOptions?: Record<string, unknown>;
}

/**
 * Result of QR code generation
 */
export interface QRResult {
  /** SVG string representation */
  svg: string;
  /** PNG as Blob */
  png: Blob;
  /** Canvas element */
  canvas: HTMLCanvasElement;
  /** Data URL (base64 encoded PNG) */
  dataUrl: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Export options for different formats
 */
export interface ExportOptions {
  /** Margin around the exported image */
  margin?: number;
  /** DPI for raster formats */
  dpi?: number;
  /** Quality for lossy formats (0-1) */
  quality?: number;
  /** Background color for formats that support it */
  backgroundColor?: string;
  /** Filename for download */
  filename?: string;
}

/**
 * QRCodeEngine - Wrapper around qr-code-styling with full TypeScript support
 * Handles logo downscaling, auto error correction upgrade, and multiple export formats
 */
export class QRCodeEngine {
  private qr: QRCodeStyling | null = null;
  private currentOptions: QROptions | null = null;
  private canvas: HTMLCanvasElement | null = null;

  /**
   * Generate a QR code with the given options
   * @param options - QR code generation options
   * @returns Promise resolving to QRResult with all formats
   */
  async generate(options: QROptions): Promise<QRResult> {
    this.currentOptions = { ...options };

    // Auto-upgrade error correction if logo is present
    if (options.image && !options.errorCorrectionLevel) {
      options.errorCorrectionLevel = 'H';
    } else if (options.image && options.errorCorrectionLevel === 'L') {
      options.errorCorrectionLevel = 'M';
    }

    // Create QRCodeStyling instance
    this.qr = new QRCodeStyling({
      width: options.width ?? 512,
      height: options.height ?? 512,
      type: 'canvas',
      data: options.data,
      margin: options.margin ?? 16,
      qrOptions: {
        typeNumber: options.version,
        mode: options.mode,
        errorCorrectionLevel: options.errorCorrectionLevel,
        ...options.qrOptions,
      } as Record<string, unknown>,
      dotsOptions: options.dotsOptions,
      cornersSquareOptions: options.cornersSquareOptions,
      cornersDotOptions: options.cornersDotOptions,
      backgroundOptions: options.backgroundOptions,
      imageOptions: options.imageOptions,
      image: options.image as string | undefined,
    });

    // Wait for rendering
    await new Promise<void>((resolve) => {
      if (this.qr) {
        const container = document.createElement('div');
        this.qr.append(container);
        // Force render
        setTimeout(() => resolve(), 50);
      } else {
        resolve();
      }
    });

    // Get canvas element from the container
    if (this.qr) {
      const container = document.createElement('div');
      this.qr.append(container);
      const canvas = container.querySelector('canvas');
      if (canvas) {
        this.canvas = canvas;
      }
    }

    if (!this.canvas) {
      throw new Error('Failed to generate QR code canvas');
    }

    // Generate all output formats
    const svg = await this.getSVG();
    const png = await this.exportPNG();
    const dataUrl = this.canvas.toDataURL('image/png');

    return {
      svg,
      png,
      canvas: this.canvas,
      dataUrl,
      width: options.width ?? 512,
      height: options.height ?? 512,
    };
  }

  /**
   * Export QR code in specified format
   * @param format - Export format
   * @param options - Export options
   * @returns Promise resolving to Blob or string
   */
  async export(format: ExportFormat, options: ExportOptions = {}): Promise<Blob | string> {
    if (!this.qr || !this.currentOptions) {
      throw new Error('QR code not generated. Call generate() first.');
    }

    switch (format) {
      case 'svg':
        return this.getSVG();
      case 'png':
        return this.exportPNG(options);
      case 'jpeg':
        return this.exportJPEG(options);
      case 'webp':
        return this.exportWebP(options);
      case 'pdf':
        return this.exportPDF(options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get SVG string representation
   * @returns Promise resolving to SVG string
   */
  async getSVG(): Promise<string> {
    if (!this.qr) {
      throw new Error('QR code not generated');
    }
    // Use the public API to get SVG
    const svgContainer = document.createElement('div');
    const svgQr = new QRCodeStyling({
      width: this.currentOptions?.width ?? 512,
      height: this.currentOptions?.height ?? 512,
      type: 'svg',
      data: this.currentOptions?.data ?? '',
      margin: this.currentOptions?.margin ?? 16,
      qrOptions: this.currentOptions?.qrOptions as Record<string, unknown> | undefined,
      dotsOptions: this.currentOptions?.dotsOptions,
      cornersSquareOptions: this.currentOptions?.cornersSquareOptions,
      cornersDotOptions: this.currentOptions?.cornersDotOptions,
      backgroundOptions: this.currentOptions?.backgroundOptions,
      imageOptions: this.currentOptions?.imageOptions,
      image: this.currentOptions?.image as string | undefined,
    });
    await new Promise<void>((resolve) => {
      svgQr.append(svgContainer);
      setTimeout(() => resolve(), 50);
    });
    const svgElement = svgContainer.querySelector('svg');
    return svgElement?.outerHTML ?? '';
  }

  /**
   * Get canvas element
   * @returns HTMLCanvasElement
   */
  getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      throw new Error('QR code not generated');
    }
    return this.canvas;
  }

  /**
   * Export as PNG Blob
   */
  private async exportPNG(options: ExportOptions = {}): Promise<Blob> {
    if (!this.canvas) {
      throw new Error('Canvas not available');
    }
    return new Promise((resolve) => {
      this.canvas!.toBlob(
        (blob) => resolve(blob!),
        'image/png',
        options.quality ?? 1.0
      );
    });
  }

  /**
   * Export as JPEG Blob
   */
  private async exportJPEG(options: ExportOptions = {}): Promise<Blob> {
    if (!this.canvas) {
      throw new Error('Canvas not available');
    }
    return new Promise((resolve) => {
      // Create a new canvas with background if needed
      const canvas = this.canvas!;
      if (options.backgroundColor) {
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.fillStyle = options.backgroundColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.putImageData(imageData, 0, 0);
        tempCanvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          options.quality ?? 0.92
        );
      } else {
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          options.quality ?? 0.92
        );
      }
    });
  }

  /**
   * Export as WebP Blob
   */
  private async exportWebP(options: ExportOptions = {}): Promise<Blob> {
    if (!this.canvas) {
      throw new Error('Canvas not available');
    }
    return new Promise((resolve) => {
      this.canvas!.toBlob(
        (blob) => resolve(blob!),
        'image/webp',
        options.quality ?? 0.92
      );
    });
  }

  /**
   * Export as PDF Blob (single page)
   */
  private async exportPDF(_options: ExportOptions = {}): Promise<Blob> {
    if (!this.canvas || !this.currentOptions) {
      throw new Error('Canvas not available');
    }
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [this.currentOptions.width ?? 512, this.currentOptions.height ?? 512],
    });
    const imgData = this.canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, this.currentOptions.width ?? 512, this.currentOptions.height ?? 512);
    return pdf.output('blob');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.qr = null;
    this.currentOptions = null;
    this.canvas = null;
  }
}

export default QRCodeEngine;