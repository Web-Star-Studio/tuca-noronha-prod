import { v } from "convex/values";

// Stripe Payment Status
export const STRIPE_PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  REQUIRES_CAPTURE: "requires_capture",
  SUCCEEDED: "succeeded",
  REQUIRES_ACTION: "requires_action",
  CANCELED: "canceled",
  FAILED: "failed",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded"
} as const;

// Stripe Refund Reasons
export const STRIPE_REFUND_REASONS = {
  REQUESTED_BY_CUSTOMER: "requested_by_customer",
  DUPLICATE: "duplicate",
  FRAUDULENT: "fraudulent",
  PARTNER_CANCELLED: "partner_cancelled",
  SERVICE_NOT_PROVIDED: "service_not_provided",
  OTHER: "other"
} as const;

// Asset Types that support Stripe integration
export const STRIPE_ASSET_TYPES = {
  ACTIVITY: "activity",
  EVENT: "event", 
  RESTAURANT: "restaurant",

  VEHICLE: "vehicle",
  PACKAGE: "package"
} as const;

// Webhook Event Types we handle
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_SESSION_COMPLETED: "checkout.session.completed",
  PAYMENT_INTENT_SUCCEEDED: "payment_intent.succeeded",
  PAYMENT_INTENT_PAYMENT_FAILED: "payment_intent.payment_failed",
  PAYMENT_INTENT_CANCELED: "payment_intent.canceled",
  CHARGE_DISPUTE_CREATED: "charge.dispute.created",
  INVOICE_PAYMENT_SUCCEEDED: "invoice.payment_succeeded",
  CUSTOMER_SUBSCRIPTION_UPDATED: "customer.subscription.updated"
} as const;

// Currency codes
export const SUPPORTED_CURRENCIES = {
  BRL: "brl",
  USD: "usd",
  EUR: "eur"
} as const;

// Validators for creating Stripe products
export const createStripeProductValidator = v.object({
  assetId: v.string(),
  assetType: v.union(
    v.literal("activity"),
    v.literal("event"),
    v.literal("restaurant"),

    v.literal("vehicle"),
    v.literal("package")
  ),
  name: v.string(),
  description: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  unitAmount: v.number(), // Price in cents
  currency: v.optional(v.string()),
  metadata: v.optional(v.object({
    partnerId: v.string(),
    assetType: v.string(),
    assetId: v.string(),
  })),
});

// Validators for creating checkout sessions
export const createCheckoutSessionValidator = v.object({
  bookingId: v.string(),
  assetType: v.union(
    v.literal("activity"),
    v.literal("event"), 
    v.literal("restaurant"),

    v.literal("vehicle"),
    v.literal("package")
  ),
  successUrl: v.string(),
  cancelUrl: v.string(),
  customerEmail: v.optional(v.string()),
  // New fields for coupons
  couponCode: v.optional(v.string()),
  discountAmount: v.optional(v.number()),
  finalAmount: v.optional(v.number()),
  currency: v.optional(v.string()),
  allowPromotionCodes: v.optional(v.boolean()),
  originalAmount: v.optional(v.number()),
});

// Validators for processing webhook events
export const processWebhookValidator = v.object({
  eventId: v.string(),
  eventType: v.string(),
  livemode: v.boolean(),
  data: v.any(), // Stripe event data structure varies by event type
});

// Validators for refund operations
export const createRefundValidator = v.object({
  bookingId: v.string(),
  amount: v.optional(v.number()), // Amount in cents (optional = full refund)
  reason: v.union(
    v.literal("requested_by_customer"),
    v.literal("duplicate"),
    v.literal("fraudulent"),
    v.literal("partner_cancelled"),
    v.literal("service_not_provided"),
    v.literal("other")
  ),
  metadata: v.optional(v.object({
    bookingId: v.string(),
    cancelledBy: v.string(), // User ID who cancelled
    cancellationReason: v.string(),
  })),
});

// Validators for updating booking payment status
export const updateBookingPaymentStatusValidator = v.object({
  bookingId: v.string(),
  paymentStatus: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("requires_capture"),
    v.literal("succeeded"),
    v.literal("requires_action"),
    v.literal("canceled"),
    v.literal("failed"),
    v.literal("refunded"),
    v.literal("partially_refunded")
  ),
  paymentIntentId: v.optional(v.string()),
  checkoutSessionId: v.optional(v.string()),
  customerId: v.optional(v.string()),
  receiptUrl: v.optional(v.string()),
});

// Validators for Stripe customer creation
export const createStripeCustomerValidator = v.object({
  userId: v.id("users"),
  email: v.string(),
  name: v.optional(v.string()),
  phone: v.optional(v.string()),
  metadata: v.optional(v.object({
    userId: v.string(),
    source: v.string(),
    userRole: v.string(),
  })),
});

// Common booking update validator for all asset types
export const updateBookingValidator = v.object({
  bookingId: v.string(),
  status: v.optional(v.union(
    v.literal("pending"),
    v.literal("confirmed"),
    v.literal("canceled"),
    v.literal("completed"),
    v.literal("refunded")
  )),
  paymentStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("requires_capture"),
    v.literal("succeeded"),
    v.literal("requires_action"),
    v.literal("canceled"),
    v.literal("failed"),
    v.literal("refunded"),
    v.literal("partially_refunded")
  )),
  partnerNotes: v.optional(v.string()),
});

// Payment link creation validator
export const createPaymentLinkValidator = v.object({
  assetId: v.string(),
  assetType: v.union(
    v.literal("activity"),
    v.literal("event"),
    v.literal("restaurant"), 

    v.literal("vehicle"),
    v.literal("package")
  ),
  stripePriceId: v.optional(v.string()), // Allow passing price ID directly
  afterCompletion: v.optional(v.object({
    type: v.literal("redirect"),
    redirect: v.object({
      url: v.string(),
    }),
  })),
});

// Type definitions for TypeScript
export type StripeAssetType = keyof typeof STRIPE_ASSET_TYPES;
export type StripePaymentStatus = keyof typeof STRIPE_PAYMENT_STATUS;
export type StripeRefundReason = keyof typeof STRIPE_REFUND_REASONS;
export type StripeWebhookEvent = keyof typeof STRIPE_WEBHOOK_EVENTS; 