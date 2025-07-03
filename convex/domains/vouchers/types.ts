import { v } from "convex/values";

// Voucher status enum
export const VOUCHER_STATUS = {
  ACTIVE: "active",
  USED: "used",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;

// Voucher booking types
export const VOUCHER_BOOKING_TYPES = {
  ACTIVITY: "activity",
  EVENT: "event",
  RESTAURANT: "restaurant",
  VEHICLE: "vehicle",
  PACKAGE: "package",
} as const;

export type VoucherStatus = typeof VOUCHER_STATUS[keyof typeof VOUCHER_STATUS];
export type VoucherBookingType = typeof VOUCHER_BOOKING_TYPES[keyof typeof VOUCHER_BOOKING_TYPES];

// Voucher validator for mutations
export const createVoucherValidator = {
  bookingId: v.string(),
  bookingType: v.union(
    v.literal("activity"),
    v.literal("event"),
    v.literal("restaurant"),
    v.literal("vehicle"),
    v.literal("package")
  ),
  customerInfo: v.object({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    document: v.optional(v.string()),
  }),
  assetInfo: v.object({
    name: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    description: v.optional(v.string()),
  }),
  bookingDetails: v.any(),
  partnerId: v.id("users"),
  confirmationCode: v.string(),
};

// Activity booking details for voucher
export const activityVoucherDetailsValidator = v.object({
  date: v.string(),
  time: v.string(),
  participants: v.number(),
  ticketType: v.optional(v.string()),
  totalPrice: v.number(),
  meetingPoint: v.optional(v.string()),
  duration: v.optional(v.string()),
  includes: v.optional(v.array(v.string())),
  specialRequests: v.optional(v.string()),
});

// Event booking details for voucher
export const eventVoucherDetailsValidator = v.object({
  date: v.string(),
  time: v.string(),
  quantity: v.number(),
  ticketType: v.optional(v.string()),
  totalPrice: v.number(),
  location: v.string(),
  sector: v.optional(v.string()),
  seats: v.optional(v.string()),
  specialRequests: v.optional(v.string()),
});

// Restaurant reservation details for voucher
export const restaurantVoucherDetailsValidator = v.object({
  date: v.string(),
  time: v.string(),
  partySize: v.number(),
  table: v.optional(v.string()),
  specialRequests: v.optional(v.string()),
  menuType: v.optional(v.string()),
});

// Vehicle booking details for voucher
export const vehicleVoucherDetailsValidator = v.object({
  startDate: v.string(),
  endDate: v.string(),
  pickupLocation: v.string(),
  returnLocation: v.string(),
  vehicleModel: v.string(),
  vehicleCategory: v.string(),
  totalPrice: v.number(),
  additionalDrivers: v.optional(v.number()),
  insurance: v.optional(v.string()),
  additionalOptions: v.optional(v.array(v.string())),
  specialRequests: v.optional(v.string()),
});

// Package booking details for voucher
export const packageVoucherDetailsValidator = v.object({
  startDate: v.string(),
  endDate: v.string(),
  guests: v.number(),
  totalPrice: v.number(),
  includedItems: v.object({
    accommodation: v.optional(v.string()),
    vehicle: v.optional(v.string()),
    activities: v.array(v.string()),
    restaurants: v.array(v.string()),
    events: v.array(v.string()),
  }),
  itinerary: v.optional(v.array(v.object({
    day: v.number(),
    title: v.string(),
    description: v.string(),
  }))),
  specialRequests: v.optional(v.string()),
});

// Voucher template data type
export interface VoucherTemplateData {
  voucherNumber: string;
  issueDate: Date;
  confirmationCode: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    document?: string;
  };
  assetInfo: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    description?: string;
  };
  bookingType: VoucherBookingType;
  bookingDetails: any;
  qrCode?: string;
  validFrom?: Date;
  validUntil?: Date;
  partnerName?: string;
  partnerLogo?: string;
  termsAndConditions?: string[];
} 