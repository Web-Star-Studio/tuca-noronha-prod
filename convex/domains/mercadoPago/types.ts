import { v } from "convex/values";

// Mercado Pago payment statuses (simplified mapping)
export const MP_PAYMENT_STATUS = {
  PENDING: "pending",
  IN_PROCESS: "in_process",
  AUTHORIZED: "authorized",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  CHARGED_BACK: "charged_back",
} as const;

export const MP_ASSET_TYPES = {
  ACTIVITY: "activity",
  EVENT: "event",
  RESTAURANT: "restaurant",
  VEHICLE: "vehicle",
  PACKAGE: "package",
} as const;

export const createCheckoutPreferenceForBookingValidator = v.object({
  bookingId: v.string(),
  assetType: v.union(
    v.literal("activity"),
    v.literal("event"),
    v.literal("restaurant"),
    v.literal("vehicle"),
    v.literal("package"),
  ),
  successUrl: v.string(),
  cancelUrl: v.string(),
  customerEmail: v.optional(v.string()),
  couponCode: v.optional(v.string()),
  discountAmount: v.optional(v.number()),
  finalAmount: v.optional(v.number()),
  originalAmount: v.optional(v.number()),
  currency: v.optional(v.string()),
});

export const createPaymentValidator = v.object({
  bookingId: v.string(),
  assetType: v.union(
    v.literal("activity"),
    v.literal("event"),
    v.literal("restaurant"),
    v.literal("vehicle"),
    v.literal("package"),
  ),
  transactionAmount: v.number(), // cents or currency base unit depending on your normalization
  // Bricks/card form fields
  token: v.string(),
  paymentMethodId: v.optional(v.string()),
  installments: v.optional(v.number()),
  payer: v.optional(v.object({
    email: v.optional(v.string()),
    identification: v.optional(v.object({ type: v.string(), number: v.string() })),
  })),
  metadata: v.optional(v.object({
    assetId: v.optional(v.string()),
    userId: v.optional(v.string()),
    bookingId: v.optional(v.string()),
  })),
  currency: v.optional(v.string()), // default BRL
});

export const capturePaymentValidator = v.object({
  paymentId: v.string(),
  amount: v.optional(v.number()), // if omitted, full amount
});

export const cancelPaymentValidator = v.object({
  paymentId: v.string(),
  reason: v.optional(v.string()),
});

export const refundPaymentValidator = v.object({
  paymentId: v.string(),
  amount: v.optional(v.number()),
  reason: v.optional(v.string()),
});

export const processWebhookValidator = v.object({
  // Mercado Pago webhooks can vary; we keep flexible
  id: v.optional(v.union(v.string(), v.number())),
  type: v.optional(v.string()),
  action: v.optional(v.string()),
  data: v.optional(v.any()),
});

export const updateBookingPaymentStatusValidator = v.object({
  bookingId: v.string(),
  paymentStatus: v.union(
    v.literal("pending"),
    v.literal("in_process"),
    v.literal("authorized"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("cancelled"),
    v.literal("refunded"),
    v.literal("charged_back"),
  ),
  paymentId: v.optional(v.string()),
  receiptUrl: v.optional(v.string()),
});

export type MpPaymentStatus = keyof typeof MP_PAYMENT_STATUS;
export type MpAssetType = keyof typeof MP_ASSET_TYPES;
