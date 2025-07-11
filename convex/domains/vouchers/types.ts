import { v } from "convex/values";

// Voucher status values
export const VOUCHER_STATUS = {
  ACTIVE: "active",
  USED: "used", 
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

// Voucher action types for logging
export const VOUCHER_ACTIONS = {
  GENERATED: "generated",
  EMAILED: "emailed",
  DOWNLOADED: "downloaded",
  SCANNED: "scanned",
  USED: "used",
  CANCELLED: "cancelled",
} as const;

// Booking types supported by vouchers
export const BOOKING_TYPES = {
  ACTIVITY: "activity",
  EVENT: "event",
  RESTAURANT: "restaurant",
  VEHICLE: "vehicle",
  ACCOMMODATION: "accommodation",
} as const;

// User types for logging
export const USER_TYPES = {
  CUSTOMER: "customer",
  PARTNER: "partner",
  EMPLOYEE: "employee",
  ADMIN: "admin",
} as const;

// Create voucher validator
export const createVoucherValidator = v.object({
  bookingId: v.string(),
  bookingType: v.union(
    v.literal("activity"),
    v.literal("event"),
    v.literal("restaurant"),
    v.literal("vehicle"),
    v.literal("accommodation"),
    v.literal("package")
  ),
  partnerId: v.id("users"),
  customerId: v.id("users"),
  expiresAt: v.optional(v.number()),
});

// Update voucher validator
export const updateVoucherValidator = v.object({
  voucherId: v.id("vouchers"),
  status: v.optional(v.union(
    v.literal("active"),
    v.literal("used"),
    v.literal("cancelled"),
    v.literal("expired")
  )),
  pdfUrl: v.optional(v.string()),
  emailSent: v.optional(v.boolean()),
  emailSentAt: v.optional(v.number()),
  downloadCount: v.optional(v.number()),
  scanCount: v.optional(v.number()),
  lastScannedAt: v.optional(v.number()),
  usedAt: v.optional(v.number()),
});

// Voucher verification validator
export const verifyVoucherValidator = v.object({
  verificationToken: v.string(),
  partnerId: v.optional(v.id("users")),
});

// Usage log validator
export const createUsageLogValidator = v.object({
  voucherId: v.id("vouchers"),
  action: v.union(
    v.literal("generated"),
    v.literal("emailed"),
    v.literal("downloaded"),
    v.literal("scanned"),
    v.literal("used"),
    v.literal("cancelled")
  ),
  userId: v.optional(v.id("users")),
  userType: v.optional(v.string()),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  location: v.optional(v.string()),
  metadata: v.optional(v.string()),
});

// Partner voucher query validator
export const getPartnerVouchersValidator = v.object({
  partnerId: v.id("users"),
  status: v.optional(v.union(
    v.literal("active"),
    v.literal("used"),
    v.literal("cancelled"),
    v.literal("expired")
  )),
  bookingType: v.optional(v.union(
    v.literal("activity"),
    v.literal("event"),
    v.literal("restaurant"),
    v.literal("vehicle"),
    v.literal("accommodation")
  )),
  dateRange: v.optional(v.object({
    from: v.number(),
    to: v.number()
  })),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

// Customer voucher query validator
export const getCustomerVouchersValidator = v.object({
  customerId: v.id("users"),
  status: v.optional(v.union(
    v.literal("active"),
    v.literal("used"),
    v.literal("cancelled"),
    v.literal("expired")
  )),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

// Voucher template validator
export const createVoucherTemplateValidator = v.object({
  name: v.string(),
  assetType: v.string(),
  version: v.string(),
  htmlTemplate: v.string(),
  cssStyles: v.string(),
  isDefault: v.optional(v.boolean()),
  partnerId: v.optional(v.id("users")),
  organizationId: v.optional(v.id("partnerOrganizations")),
  metadata: v.optional(v.string()),
});

// Mark voucher as used validator
export const useVoucherValidator = v.object({
  voucherId: v.id("vouchers"),
  partnerId: v.id("users"),
  usageNotes: v.optional(v.string()),
  location: v.optional(v.string()),
});

// Cancel voucher validator
export const cancelVoucherValidator = v.object({
  voucherId: v.id("vouchers"),
  reason: v.string(),
  userId: v.id("users"),
});

// QR Code data structure
export interface QRCodeData {
  v: string;         // Version
  t: string;         // Type ("voucher")
  n: string;         // Voucher number
  tk: string;        // Verification token
  exp: number;       // Expiration timestamp
  sig: string;       // Security signature
}

// Voucher display data interface
export interface VoucherDisplayData {
  voucher: {
    voucherNumber: string;
    status: string;
    qrCode: string;
    generatedAt: number;
    expiresAt?: number;
    usedAt?: number;
    downloadCount: number;
    scanCount: number;
  };
  booking: {
    id: string;
    type: string;
    confirmationCode: string;
    status: string;
    date: string;
    time?: string;
    participants?: number;
    totalAmount?: number;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  asset: {
    name: string;
    location?: string;
    description?: string;
    type: string;
  };
  partner: {
    name: string;
    contactInfo?: string;
  };
}

// Voucher template data interface
export interface VoucherTemplateData extends VoucherDisplayData {
  brandInfo: {
    logoUrl?: string;
    companyName: string;
    website?: string;
    supportEmail: string;
    supportPhone: string;
  };
  instructions: {
    checkIn: string[];
    preparation: string[];
    cancellation: string;
  };
  termsAndConditions: string;
  confirmationInfo?: {
    confirmedBy: string;
    confirmedAt: number;
    role: string;
  };
}

// Asset-specific data interfaces
export interface ActivityVoucherData extends VoucherTemplateData {
  activity: {
    meetingPoint: string;
    equipmentProvided: string[];
    difficultyLevel: string;
    ageRestrictions: string;
    duration: string;
  };
}

export interface EventVoucherData extends VoucherTemplateData {
  event: {
    venue: string;
    dressCode?: string;
    schedule: string;
    ticketType: string;
  };
}

export interface RestaurantVoucherData extends VoucherTemplateData {
  restaurant: {
    reservationTime: string;
    partySize: number;
    specialRequests?: string;
    dietaryRequirements?: string;
  };
}

export interface VehicleVoucherData extends VoucherTemplateData {
  vehicle: {
    pickupLocation: string;
    returnLocation: string;
    vehicleDetails: string;
    driverRequirements: string;
    rentalPeriod: string;
  };
}

export interface AccommodationVoucherData extends VoucherTemplateData {
  accommodation: {
    checkInTime: string;
    checkOutTime: string;
    roomType: string;
    guestCount: number;
    amenities: string[];
  };
}

// Booking type for vouchers
export type VoucherBookingType = "activity" | "event" | "restaurant" | "vehicle" | "accommodation" | "package";