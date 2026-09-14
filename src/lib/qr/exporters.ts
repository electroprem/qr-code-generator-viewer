import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

/**
 * QR result interface for export functions
 */
export interface QRResult {
  svg: string;
  png: Blob;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Export options for image formats
 */
export interface ImageExportOptions {
  /** Margin around the image in pixels */
  margin?: number;
  /** DPI for raster formats */
  dpi?: number;
  /** Quality for lossy formats (0-1) */
  quality?: number;
  /** Background color */
  backgroundColor?: string;
}

/**
 * Export options for PDF
 */
export interface PDFExportOptions {
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Page format */
  format?: 'a4' | 'letter' | 'legal' | [number, number];
  /** Margin around QR codes */
  margin?: number;
  /** QR codes per page */
  perPage?: number;
  /** Gap between QR codes */
  gap?: number;
  /** Include filename as caption */
  includeFilename?: boolean;
}

/**
 * Export options for ZIP
 */
export interface ZIPExportOptions {
  /** Format for images in ZIP */
  format?: 'png' | 'svg' | 'jpeg' | 'webp';
  /** Image export options */
  imageOptions?: ImageExportOptions;
  /** Include metadata JSON */
  includeMetadata?: boolean;
  /** Filename prefix */
  prefix?: string;
}

/**
 * Apply margin and background to canvas
 */
function prepareCanvas(
  canvas: HTMLCanvasElement,
  options: ImageExportOptions = {}
): HTMLCanvasElement {
  const margin = options.margin ?? 0;
  const bgColor = options.backgroundColor;

  if (margin === 0 && !bgColor) {
    return canvas;
  }

  const newCanvas = document.createElement('canvas');
  const ctx = newCanvas.getContext('2d')!;
  const newWidth = canvas.width + margin * 2;
  const newHeight = canvas.height + margin * 2;

  newCanvas.width = newWidth;
  newCanvas.height = newHeight;

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, newWidth, newHeight);
  }

  ctx.drawImage(canvas, margin, margin);
  return newCanvas;
}

/**
 * Convert canvas to Blob with specified format and quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' | 'webp',
  quality?: number
): Promise<Blob> {
  const mimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to create ${format.toUpperCase()} blob`));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Export canvas as PNG Blob
 * @param canvas - Source canvas
 * @param options - Export options
 * @returns Promise resolving to PNG Blob
 */
export async function exportPNG(
  canvas: HTMLCanvasElement,
  options: ImageExportOptions = {}
): Promise<Blob> {
  const preparedCanvas = prepareCanvas(canvas, options);
  return canvasToBlob(preparedCanvas, 'png', options.quality ?? 1.0);
}

/**
 * Export SVG string as Blob
 * @param svgString - SVG content
 * @param options - Export options
 * @returns Promise resolving to SVG Blob
 */
export async function exportSVG(
  svgString: string,
  options: ImageExportOptions = {}
): Promise<Blob> {
  const margin = options.margin ?? 0;
  let svg = svgString;

  if (margin > 0) {
    // Add margin to SVG by wrapping in a group with transform
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const [_, viewBox] = viewBoxMatch;
      const [x, y, width, height] = viewBox.split(' ').map(Number);
      const newViewBox = `${x - margin} ${y - margin} ${width + margin * 2} ${height + margin * 2}`;
      svg = svg.replace(/viewBox="[^"]+"/, `viewBox="${newViewBox}"`);
    }
  }

  return new Blob([svg], { type: 'image/svg+xml' });
}

/**
 * Export canvas as JPEG Blob
 * @param canvas - Source canvas
 * @param options - Export options
 * @returns Promise resolving to JPEG Blob
 */
export async function exportJPEG(
  canvas: HTMLCanvasElement,
  options: ImageExportOptions = {}
): Promise<Blob> {
  const preparedCanvas = prepareCanvas(canvas, {
    ...options,
    backgroundColor: options.backgroundColor ?? '#ffffff',
  });
  return canvasToBlob(preparedCanvas, 'jpeg', options.quality ?? 0.92);
}

/**
 * Export canvas as WebP Blob
 * @param canvas - Source canvas
 * @param options - Export options
 * @returns Promise resolving to WebP Blob
 */
export async function exportWebP(
  canvas: HTMLCanvasElement,
  options: ImageExportOptions = {}
): Promise<Blob> {
  const preparedCanvas = prepareCanvas(canvas, options);
  return canvasToBlob(preparedCanvas, 'webp', options.quality ?? 0.92);
}

/**
 * Export multiple QR results as PDF
 * @param qrResults - Array of QR results
 * @param options - PDF export options
 * @returns Promise resolving to PDF Blob
 */
export async function exportPDF(
  qrResults: QRResult[],
  options: PDFExportOptions = {}
): Promise<Blob> {
  const {
    orientation = 'portrait',
    format = 'a4',
    margin = 20,
    perPage = 4,
    gap = 10,
    includeFilename = true,
  } = options;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  // Calculate grid layout
  const cols = Math.ceil(Math.sqrt(perPage));
  const rows = Math.ceil(perPage / cols);
  const cellWidth = (usableWidth - gap * (cols - 1)) / cols;
  const cellHeight = (usableHeight - gap * (rows - 1)) / rows;
  const qrSize = Math.min(cellWidth, cellHeight) * 0.9;

  let currentPage = 1;
  let index = 0;

  for (const qr of qrResults) {
    if (index > 0 && index % perPage === 0) {
      pdf.addPage();
      currentPage++;
    }

    const pageIndex = index % perPage;
    const col = pageIndex % cols;
    const row = Math.floor(pageIndex / cols);

    const x = margin + col * (cellWidth + gap) + (cellWidth - qrSize) / 2;
    const y = margin + row * (cellHeight + gap) + (cellHeight - qrSize) / 2;

    // Add QR code image
    pdf.addImage(qr.dataUrl, 'PNG', x, y, qrSize, qrSize);

    // Add caption if enabled
    if (includeFilename) {
      pdf.setFontSize(8);
      pdf.text(`QR ${index + 1}`, x, y + qrSize + 4, { align: 'center' });
    }

    index++;
  }

  return pdf.output('blob');
}

/**
 * Export multiple QR results as ZIP archive
 * @param qrResults - Array of QR results with optional metadata
 * @param options - ZIP export options
 * @returns Promise resolving to ZIP Blob
 */
export interface QRWithMeta extends QRResult {
  id?: string;
  filename?: string;
  type?: string;
  data?: string;
  settings?: Record<string, unknown>;
  createdAt?: string;
}

export async function exportZIP(
  qrResults: QRWithMeta[],
  options: ZIPExportOptions = {}
): Promise<Blob> {
  const {
    format = 'png',
    imageOptions = {},
    includeMetadata = true,
    prefix = 'qr',
  } = options;

  const zip = new JSZip();

  for (let i = 0; i < qrResults.length; i++) {
    const qr = qrResults[i];
    const baseName = qr.filename ?? `${prefix}-${i + 1}`;

    // Export image
    let imageBlob: Blob;
    switch (format) {
      case 'png':
        imageBlob = await exportPNG(qr.canvas, imageOptions);
        break;
      case 'svg':
        imageBlob = await exportSVG(qr.svg, imageOptions);
        break;
      case 'jpeg':
        imageBlob = await exportJPEG(qr.canvas, imageOptions);
        break;
      case 'webp':
        imageBlob = await exportWebP(qr.canvas, imageOptions);
        break;
      default:
        imageBlob = await exportPNG(qr.canvas, imageOptions);
    }

    zip.file(`${baseName}.${format}`, imageBlob);
  }

  // Add metadata JSON
  if (includeMetadata) {
    const metadata = qrResults.map((qr, i) => ({
      id: qr.id,
      filename: qr.filename ?? `${prefix}-${i + 1}`,
      type: qr.type,
      data: qr.data,
      settings: qr.settings,
      createdAt: qr.createdAt,
      width: qr.width,
      height: qr.height,
    }));
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

/**
 * Create object URL for Blob
 * @param blob - Blob to create URL for
 * @returns Object URL string
 */
export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL
 * @param url - Object URL to revoke
 */
export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Download blob as file
 * @param blob - Blob to download
 * @param filename - Filename for download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  revokeObjectURL(url);
}

/**
 * Download multiple blobs as ZIP
 * @param blobs - Array of { blob, filename }
 * @param zipFilename - ZIP filename
 */
export async function downloadAsZIP(
  blobs: Array<{ blob: Blob; filename: string }>,
  zipFilename: string
): Promise<void> {
  const zip = new JSZip();
  blobs.forEach(({ blob, filename }) => {
    zip.file(filename, blob);
  });
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, zipFilename);
}