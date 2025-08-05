// Export all voucher domain functions for external use

// Queries
export {
  getVoucherByNumber,
  getVoucherByBooking,
  verifyVoucher,
  getPartnerVouchers,
  getCustomerVouchers,
  getVoucherUsageLogs,
  getVoucherStats,
} from "./queries";

// Mutations  
export {
  generateVoucher,
  updateVoucher,
  useVoucher,
  cancelVoucher,
  recordVoucherScan,
  recordVoucherDownload,
  recordVoucherEmailSent,
  regenerateVoucher,
  bulkUpdateVoucherExpiration,
  updateVoucherPDF,
} from "./mutations";

// Actions
export {
  generateVoucherPDF,
  getVoucherPDFUrl,
} from "./actions";

// Types and constants
export {
  VOUCHER_STATUS,
  VOUCHER_ACTIONS,
  BOOKING_TYPES,
  USER_TYPES,
  createVoucherValidator,
  updateVoucherValidator,
  verifyVoucherValidator,
  useVoucherValidator,
  cancelVoucherValidator,
  createUsageLogValidator,
  getPartnerVouchersValidator,
  getCustomerVouchersValidator,
  createVoucherTemplateValidator,
} from "./types";

export type {
  QRCodeData,
  VoucherDisplayData,
  VoucherTemplateData,
  ActivityVoucherData,
  EventVoucherData,
  RestaurantVoucherData,
  VehicleVoucherData,

} from "./types";

// Utilities
export {
  generateVoucherNumber,
  generateVerificationToken,
  verifyToken,
  generateQRCodeData,
  verifyQRCodeSignature,
  qrCodeDataToString,
  parseQRCodeString,
  isVoucherExpired,
  calculateVoucherExpiration,
  formatVoucherNumber,
  isValidVoucherNumber,
  generateVoucherFilename,
  getBookingTypeName,
  getVoucherStatusName,
  getVoucherStatusColor,
} from "./utils";