/**
 * Template builders for common QR code data formats
 * Each builder validates required fields and returns standardized output
 */

/**
 * Base template result
 */
export interface TemplateResult {
  /** Encoded data string */
  data: string;
  /** Template type identifier */
  type: string;
}

/**
 * WiFi configuration options
 */
export interface WiFiOptions {
  /** Network SSID */
  ssid: string;
  /** Password (empty for open networks) */
  password?: string;
  /** Encryption type */
  encryption?: 'WPA' | 'WEP' | 'nopass';
  /** Hidden network */
  hidden?: boolean;
}

/**
 * Build WiFi configuration QR code
 * Format: WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden>;;
 */
export function buildWiFi(options: WiFiOptions): TemplateResult {
  if (!options.ssid || options.ssid.trim() === '') {
    throw new Error('SSID is required for WiFi QR code');
  }

  const encryption = options.encryption ?? (options.password ? 'WPA' : 'nopass');
  const password = options.password ?? '';
  const hidden = options.hidden ? 'true' : 'false';

  const data = `WIFI:T:${encryption};S:${escapeValue(options.ssid)};P:${escapeValue(password)};H:${hidden};;`;

  return { data, type: 'wifi' };
}

/**
 * vCard contact options
 */
export interface VCardOptions {
  /** First name */
  firstName: string;
  /** Last name */
  lastName?: string;
  /** Organization */
  organization?: string;
  /** Title */
  title?: string;
  /** Phone numbers */
  phones?: Array<{ type?: string; number: string }>;
  /** Email addresses */
  emails?: Array<{ type?: string; address: string }>;
  /** URLs */
  urls?: Array<{ type?: string; url: string }>;
  /** Address */
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  /** Birthday (YYYY-MM-DD) */
  birthday?: string;
  /** Note */
  note?: string;
}

/**
 * Build vCard QR code
 * Format: BEGIN:VCARD...END:VCARD
 */
export function buildVCard(options: VCardOptions): TemplateResult {
  if (!options.firstName || options.firstName.trim() === '') {
    throw new Error('First name is required for vCard');
  }

  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  const fullName = options.lastName ? `${options.firstName} ${options.lastName}` : options.firstName;
  lines.push(`FN:${escapeValue(fullName)}`);
  lines.push(`N:${escapeValue(options.lastName ?? '')};${escapeValue(options.firstName)};;;`);

  if (options.organization) {
    lines.push(`ORG:${escapeValue(options.organization)}`);
  }
  if (options.title) {
    lines.push(`TITLE:${escapeValue(options.title)}`);
  }

  options.phones?.forEach((phone) => {
    const type = phone.type ? `${phone.type.toUpperCase()},VOICE` : 'VOICE';
    lines.push(`TEL;TYPE=${type}:${escapeValue(phone.number)}`);
  });

  options.emails?.forEach((email) => {
    const type = email.type ? email.type.toUpperCase() : 'INTERNET';
    lines.push(`EMAIL;TYPE=${type}:${escapeValue(email.address)}`);
  });

  options.urls?.forEach((url) => {
    const type = url.type ? url.type.toUpperCase() : 'HOMEPAGE';
    lines.push(`URL;TYPE=${type}:${escapeValue(url.url)}`);
  });

  if (options.address) {
    const { street, city, region, postalCode, country } = options.address;
    lines.push(
      `ADR;TYPE=HOME:;;${escapeValue(street ?? '')};${escapeValue(city ?? '')};${escapeValue(region ?? '')};${escapeValue(postalCode ?? '')};${escapeValue(country ?? '')}`
    );
  }

  if (options.birthday) {
    lines.push(`BDAY:${options.birthday}`);
  }
  if (options.note) {
    lines.push(`NOTE:${escapeValue(options.note)}`);
  }

  lines.push('END:VCARD');
  const data = lines.join('\r\n');

  return { data, type: 'vcard' };
}

/**
 * Email options
 */
export interface EmailOptions {
  /** Recipient email address */
  to: string;
  /** Subject */
  subject?: string;
  /** Body text */
  body?: string;
  /** CC recipients */
  cc?: string[];
  /** BCC recipients */
  bcc?: string[];
}

/**
 * Build email QR code
 * Format: mailto:...
 */
export function buildEmail(options: EmailOptions): TemplateResult {
  if (!options.to || !isValidEmail(options.to)) {
    throw new Error('Valid recipient email is required');
  }

  const params = new URLSearchParams();
  if (options.subject) params.set('subject', options.subject);
  if (options.body) params.set('body', options.body);
  if (options.cc?.length) params.set('cc', options.cc.join(','));
  if (options.bcc?.length) params.set('bcc', options.bcc.join(','));

  const data = `mailto:${options.to}${params.toString() ? `?${params.toString()}` : ''}`;

  return { data, type: 'email' };
}

/**
 * SMS options
 */
export interface SMSOptions {
  /** Phone number */
  phone: string;
  /** Message body */
  body?: string;
}

/**
 * Build SMS QR code
 * Format: sms:... or smsto:...
 */
export function buildSMS(options: SMSOptions): TemplateResult {
  if (!options.phone || options.phone.trim() === '') {
    throw new Error('Phone number is required for SMS');
  }

  const phone = options.phone.replace(/[^\d+]/g, '');
  const body = options.body ? `?body=${encodeURIComponent(options.body)}` : '';
  const data = `smsto:${phone}${body}`;

  return { data, type: 'sms' };
}

/**
 * Phone call options
 */
export interface PhoneOptions {
  /** Phone number */
  phone: string;
}

/**
 * Build phone call QR code
 * Format: tel:...
 */
export function buildPhone(options: PhoneOptions): TemplateResult {
  if (!options.phone || options.phone.trim() === '') {
    throw new Error('Phone number is required');
  }

  const phone = options.phone.replace(/[^\d+]/g, '');
  const data = `tel:${phone}`;

  return { data, type: 'phone' };
}

/**
 * WhatsApp options
 */
export interface WhatsAppOptions {
  /** Phone number with country code (no +) */
  phone: string;
  /** Pre-filled message */
  message?: string;
}

/**
 * Build WhatsApp QR code
 * Format: https://wa.me/...
 */
export function buildWhatsApp(options: WhatsAppOptions): TemplateResult {
  if (!options.phone || options.phone.trim() === '') {
    throw new Error('Phone number is required for WhatsApp');
  }

  const phone = options.phone.replace(/[^\d]/g, '');
  const message = options.message ? `?text=${encodeURIComponent(options.message)}` : '';
  const data = `https://wa.me/${phone}${message}`;

  return { data, type: 'whatsapp' };
}

/**
 * UPI payment options
 */
export interface UPIOptions {
  /** Payee VPA (UPI ID) */
  vpa: string;
  /** Payee name */
  name: string;
  /** Amount */
  amount?: number;
  /** Currency code */
  currency?: string;
  /** Transaction note */
  note?: string;
  /** Transaction reference */
  ref?: string;
}

/**
 * Build UPI payment QR code
 * Format: upi://pay?...
 */
export function buildUPI(options: UPIOptions): TemplateResult {
  if (!options.vpa || !options.vpa.includes('@')) {
    throw new Error('Valid UPI VPA (e.g., user@bank) is required');
  }
  if (!options.name || options.name.trim() === '') {
    throw new Error('Payee name is required');
  }

  const params = new URLSearchParams();
  params.set('pa', options.vpa);
  params.set('pn', options.name);
  if (options.amount) params.set('am', options.amount.toFixed(2));
  if (options.currency) params.set('cu', options.currency);
  if (options.note) params.set('tn', options.note);
  if (options.ref) params.set('tr', options.ref);

  const data = `upi://pay?${params.toString()}`;

  return { data, type: 'upi' };
}

/**
 * Cryptocurrency payment options
 */
export interface CryptoOptions {
  /** Cryptocurrency type */
  currency: 'bitcoin' | 'ethereum' | 'litecoin' | 'bitcoin-cash' | 'dogecoin' | 'ripple' | 'solana' | 'polygon' | 'binance-smart-chain' | string;
  /** Wallet address */
  address: string;
  /** Amount */
  amount?: number;
  /** Label */
  label?: string;
  /** Message */
  message?: string;
}

/**
 * Build cryptocurrency payment QR code
 * Format: bitcoin:... ethereum:... etc.
 */
export function buildCrypto(options: CryptoOptions): TemplateResult {
  if (!options.address || options.address.trim() === '') {
    throw new Error('Wallet address is required');
  }

  const scheme = options.currency.toLowerCase().replace(/[_\s-]/g, '');
  const params = new URLSearchParams();
  if (options.amount) params.set('amount', options.amount.toString());
  if (options.label) params.set('label', options.label);
  if (options.message) params.set('message', options.message);

  const data = `${scheme}:${options.address}${params.toString() ? `?${params.toString()}` : ''}`;

  return { data, type: 'crypto' };
}

/**
 * Calendar event options
 */
export interface CalendarOptions {
  /** Event title */
  title: string;
  /** Start date/time (ISO 8601) */
  start: string;
  /** End date/time (ISO 8601) */
  end?: string;
  /** All day event */
  allDay?: boolean;
  /** Description */
  description?: string;
  /** Location */
  location?: string;
  /** Organizer email */
  organizer?: string;
}

/**
 * Build calendar event QR code
 * Format: BEGIN:VEVENT...END:VEVENT
 */
export function buildCalendar(options: CalendarOptions): TemplateResult {
  if (!options.title || options.title.trim() === '') {
    throw new Error('Event title is required');
  }
  if (!options.start) {
    throw new Error('Start date/time is required');
  }

  const formatDate = (dateStr: string, allDay: boolean) => {
    const date = new Date(dateStr);
    if (allDay) {
      return date.toISOString().split('T')[0].replace(/-/g, '');
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT'];
  lines.push(`SUMMARY:${escapeValue(options.title)}`);
  lines.push(`DTSTART:${formatDate(options.start, options.allDay ?? false)}`);
  if (options.end) {
    lines.push(`DTEND:${formatDate(options.end, options.allDay ?? false)}`);
  }
  if (options.description) {
    lines.push(`DESCRIPTION:${escapeValue(options.description)}`);
  }
  if (options.location) {
    lines.push(`LOCATION:${escapeValue(options.location)}`);
  }
  if (options.organizer) {
    lines.push(`ORGANIZER:mailto:${options.organizer}`);
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');

  const data = lines.join('\r\n');
  return { data, type: 'calendar' };
}

/**
 * Location options
 */
export interface LocationOptions {
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
  /** Label/name */
  label?: string;
  /** Query for search */
  query?: string;
}

/**
 * Build location QR code
 * Format: geo:... or maps URL
 */
export function buildLocation(options: LocationOptions): TemplateResult {
  if (typeof options.latitude !== 'number' || typeof options.longitude !== 'number') {
    throw new Error('Valid latitude and longitude are required');
  }
  if (options.latitude < -90 || options.latitude > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (options.longitude < -180 || options.longitude > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }

  const params = new URLSearchParams();
  if (options.label) params.set('q', `${options.latitude},${options.longitude}(${options.label})`);
  else if (options.query) params.set('q', options.query);
  else params.set('q', `${options.latitude},${options.longitude}`);

  // Use geo: URI for universal compatibility
  const data = `geo:${options.latitude},${options.longitude}${params.toString() ? `?${params.toString()}` : ''}`;

  return { data, type: 'location' };
}

/**
 * App link options
 */
export interface AppLinkOptions {
  /** iOS App Store URL */
  ios?: string;
  /** Android Play Store URL */
  android?: string;
  /** Fallback web URL */
  web?: string;
  /** Custom scheme */
  customScheme?: string;
}

/**
 * Build app link QR code (universal link)
 * Returns a landing page URL or custom scheme
 */
export function buildAppLink(options: AppLinkOptions): TemplateResult {
  if (!options.ios && !options.android && !options.web && !options.customScheme) {
    throw new Error('At least one platform URL or custom scheme is required');
  }

  // For QR codes, we typically use a universal link service or custom scheme
  // Here we'll use a simple approach: prefer custom scheme, then web fallback
  let data: string;
  if (options.customScheme) {
    data = options.customScheme;
  } else if (options.web) {
    data = options.web;
  } else if (options.ios) {
    data = options.ios;
  } else {
    data = options.android!;
  }

  return { data, type: 'applink' };
}

/**
 * Escape special characters for vCard/meCard formats
 */
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * All available template types
 */
export type TemplateType =
  | 'wifi'
  | 'vcard'
  | 'email'
  | 'sms'
  | 'phone'
  | 'whatsapp'
  | 'upi'
  | 'crypto'
  | 'calendar'
  | 'location'
  | 'applink';

/**
 * Union of all template options
 */
export type TemplateOptions =
  | WiFiOptions
  | VCardOptions
  | EmailOptions
  | SMSOptions
  | PhoneOptions
  | WhatsAppOptions
  | UPIOptions
  | CryptoOptions
  | CalendarOptions
  | LocationOptions
  | AppLinkOptions;

/**
 * Build QR data from template type and options
 */
export function buildFromTemplate(type: TemplateType, options: TemplateOptions): TemplateResult {
  switch (type) {
    case 'wifi':
      return buildWiFi(options as WiFiOptions);
    case 'vcard':
      return buildVCard(options as VCardOptions);
    case 'email':
      return buildEmail(options as EmailOptions);
    case 'sms':
      return buildSMS(options as SMSOptions);
    case 'phone':
      return buildPhone(options as PhoneOptions);
    case 'whatsapp':
      return buildWhatsApp(options as WhatsAppOptions);
    case 'upi':
      return buildUPI(options as UPIOptions);
    case 'crypto':
      return buildCrypto(options as CryptoOptions);
    case 'calendar':
      return buildCalendar(options as CalendarOptions);
    case 'location':
      return buildLocation(options as LocationOptions);
    case 'applink':
      return buildAppLink(options as AppLinkOptions);
    default:
      throw new Error(`Unknown template type: ${type}`);
  }
}