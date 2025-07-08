import { QRCodeData } from "./types";

/**
 * Generate a unique voucher number with the format: VCH-YYYYMMDD-XXXX
 * @param date - Optional date for the voucher (defaults to current date)
 * @returns Unique voucher number string
 */
export function generateVoucherNumber(date?: Date): string {
  const voucherDate = date || new Date();
  
  // Format date as YYYYMMDD
  const year = voucherDate.getFullYear();
  const month = String(voucherDate.getMonth() + 1).padStart(2, '0');
  const day = String(voucherDate.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Generate random 4-digit suffix
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `VCH-${dateString}-${suffix}`;
}

/**
 * Generate a secure verification token for QR codes
 * @param voucherNumber - The voucher number
 * @param expiresAt - Optional expiration timestamp
 * @returns Verification token string
 */
export function generateVerificationToken(voucherNumber: string, expiresAt?: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const expiry = expiresAt || (timestamp + (24 * 60 * 60 * 1000)); // 24 hours default
  
  // Create token from voucher number, timestamp, random string, and expiry
  const tokenData = `${voucherNumber}:${timestamp}:${random}:${expiry}`;
  
  // Simple base64 encoding (in production, use proper encryption)
  return btoa(tokenData).replace(/[+/=]/g, (match) => {
    switch (match) {
      case '+': return '-';
      case '/': return '_';
      case '=': return '';
      default: return match;
    }
  });
}

/**
 * Verify and decode a verification token
 * @param token - The verification token to decode
 * @returns Decoded token data or null if invalid
 */
export function verifyToken(token: string): { voucherNumber: string; timestamp: number; expiresAt: number } | null {
  try {
    // Restore base64 format
    const base64Token = token.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64Token.length % 4) % 4);
    const tokenData = atob(base64Token + padding);
    
    const [voucherNumber, timestamp, , expiresAt] = tokenData.split(':');
    
    if (!voucherNumber || !timestamp || !expiresAt) {
      return null;
    }
    
    return {
      voucherNumber,
      timestamp: parseInt(timestamp),
      expiresAt: parseInt(expiresAt)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate QR code data for a voucher
 * @param voucherNumber - The voucher number
 * @param verificationToken - The verification token
 * @param expiresAt - Optional expiration timestamp
 * @returns QR code data object
 */
export function generateQRCodeData(
  voucherNumber: string, 
  verificationToken: string, 
  expiresAt?: number
): QRCodeData {
  const timestamp = Date.now();
  const expiry = expiresAt || (timestamp + (24 * 60 * 60 * 1000));
  
  // Generate simple signature (in production, use HMAC or similar)
  const signature = generateSignature(voucherNumber, verificationToken, expiry);
  
  return {
    v: "1.0",                    // Version
    t: "voucher",                // Type
    n: voucherNumber,            // Voucher number
    tk: verificationToken,       // Verification token
    exp: expiry,                 // Expiration timestamp
    sig: signature               // Security signature
  };
}

/**
 * Generate a simple signature for QR code security
 * @param voucherNumber - The voucher number
 * @param token - The verification token
 * @param expiresAt - The expiration timestamp
 * @returns Signature string
 */
function generateSignature(voucherNumber: string, token: string, expiresAt: number): string {
  // Simple hash-like signature (in production, use proper HMAC)
  const data = `${voucherNumber}:${token}:${expiresAt}`;
  let hash = 0;
  
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Verify QR code signature
 * @param qrData - The QR code data object
 * @returns True if signature is valid
 */
export function verifyQRCodeSignature(qrData: QRCodeData): boolean {
  const expectedSignature = generateSignature(qrData.n, qrData.tk, qrData.exp);
  return qrData.sig === expectedSignature;
}

/**
 * Convert QR code data to JSON string
 * @param qrData - The QR code data object
 * @returns JSON string for QR code generation
 */
export function qrCodeDataToString(qrData: QRCodeData): string {
  return JSON.stringify(qrData);
}

/**
 * Parse QR code string back to data object
 * @param qrString - The QR code JSON string
 * @returns QR code data object or null if invalid
 */
export function parseQRCodeString(qrString: string): QRCodeData | null {
  try {
    const data = JSON.parse(qrString) as QRCodeData;
    
    // Validate required fields
    if (!data.v || !data.t || !data.n || !data.tk || !data.exp || !data.sig) {
      return null;
    }
    
    // Verify signature
    if (!verifyQRCodeSignature(data)) {
      return null;
    }
    
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a voucher has expired
 * @param expiresAt - The expiration timestamp
 * @returns True if expired
 */
export function isVoucherExpired(expiresAt?: number): boolean {
  if (!expiresAt) {
    return false; // No expiration set
  }
  
  return Date.now() > expiresAt;
}

/**
 * Calculate voucher expiration date based on booking type
 * @param bookingType - The type of booking
 * @param bookingDate - The booking date
 * @returns Expiration timestamp
 */
export function calculateVoucherExpiration(bookingType: string, bookingDate?: string): number | undefined {
  const now = Date.now();
  
  if (!bookingDate) {
    // Default expiration policies by asset type
    switch (bookingType) {
      case "activity":
      case "event":
        return now + (30 * 24 * 60 * 60 * 1000); // 30 days
      case "restaurant":
        return now + (7 * 24 * 60 * 60 * 1000);  // 7 days
      case "vehicle":
        return now + (90 * 24 * 60 * 60 * 1000); // 90 days
      case "accommodation":
        return now + (90 * 24 * 60 * 60 * 1000); // 90 days
      default:
        return now + (30 * 24 * 60 * 60 * 1000); // 30 days default
    }
  }
  
  // Set expiration to 1 day after the booking date
  const booking = new Date(bookingDate);
  if (isNaN(booking.getTime())) {
    return undefined; // Invalid date
  }
  
  return booking.getTime() + (24 * 60 * 60 * 1000);
}

/**
 * Format voucher number for display (with hyphens)
 * @param voucherNumber - The voucher number
 * @returns Formatted voucher number
 */
export function formatVoucherNumber(voucherNumber: string): string {
  // Ensure proper formatting if hyphens are missing
  if (voucherNumber.length === 15 && !voucherNumber.includes('-')) {
    return `${voucherNumber.slice(0, 3)}-${voucherNumber.slice(3, 11)}-${voucherNumber.slice(11)}`;
  }
  
  return voucherNumber;
}

/**
 * Validate voucher number format
 * @param voucherNumber - The voucher number to validate
 * @returns True if format is valid
 */
export function isValidVoucherNumber(voucherNumber: string): boolean {
  const pattern = /^VCH-\d{8}-\d{4}$/;
  return pattern.test(voucherNumber);
}

/**
 * Generate voucher download filename
 * @param voucherNumber - The voucher number
 * @param assetName - Optional asset name
 * @returns Filename for PDF download
 */
export function generateVoucherFilename(voucherNumber: string, assetName?: string): string {
  const sanitizedAssetName = assetName 
    ? assetName.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 30)
    : 'voucher';
  
  return `${sanitizedAssetName}_${voucherNumber}.pdf`;
}

/**
 * Get user-friendly booking type name in Portuguese
 * @param bookingType - The booking type
 * @returns Localized booking type name
 */
export function getBookingTypeName(bookingType: string): string {
  switch (bookingType) {
    case "activity":
      return "Atividade";
    case "event":
      return "Evento";
    case "restaurant":
      return "Restaurante";
    case "vehicle":
      return "Veículo";
    case "accommodation":
      return "Hospedagem";
    default:
      return "Reserva";
  }
}

/**
 * Get voucher status display name in Portuguese
 * @param status - The voucher status
 * @returns Localized status name
 */
export function getVoucherStatusName(status: string): string {
  switch (status) {
    case "active":
      return "Ativo";
    case "used":
      return "Utilizado";
    case "cancelled":
      return "Cancelado";
    case "expired":
      return "Expirado";
    default:
      return "Desconhecido";
  }
}

/**
 * Get voucher status color for UI display
 * @param status - The voucher status
 * @returns Color class or hex code
 */
export function getVoucherStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-green-600 bg-green-50";
    case "used":
      return "text-blue-600 bg-blue-50";
    case "cancelled":
      return "text-red-600 bg-red-50";
    case "expired":
      return "text-gray-600 bg-gray-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}