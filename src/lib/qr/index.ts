// QR Engine & Types
export * from './qrEngine';
export { QRCodeEngine } from './qrEngine';
export type { QROptions, QRResult, ExportFormat, ExportOptions, ErrorCorrectionLevel, QRMode } from './qrEngine';

// Template Builders
export * from './builders';
export type { TemplateResult, TemplateType, TemplateOptions } from './builders';
export type {
  WiFiOptions,
  VCardOptions,
  EmailOptions,
  SMSOptions,
  PhoneOptions,
  WhatsAppOptions,
  UPIOptions,
  CryptoOptions,
  CalendarOptions,
  LocationOptions,
  AppLinkOptions,
} from './builders';

// Exporters
export * from './exporters';
export type { QRResult as ExportQRResult, ImageExportOptions, PDFExportOptions, ZIPExportOptions, QRWithMeta } from './exporters';