import { v } from "convex/values";

/**
 * Schema extensions for Stripe integration
 * These will be added to the main schema.ts file
 */

// Extensions for existing asset tables (activities, events, restaurants, accommodations, vehicles)
export const assetStripeFields = {
  // Stripe Product Information
  stripeProductId: v.optional(v.string()),      // Stripe Product ID
  stripePriceId: v.optional(v.string()),        // Main Stripe Price ID
  stripePaymentLinkId: v.optional(v.string()),  // Stripe Payment Link ID
  
  // Payment Configuration
  acceptsOnlinePayment: v.optional(v.boolean()), // Whether this asset accepts online payments
  requiresUpfrontPayment: v.optional(v.boolean()), // Whether payment is required before confirmation
  
  // Stripe Metadata
  stripeMetadata: v.optional(v.object({
    productType: v.string(), // "activity", "event", "restaurant", "accommodation", "vehicle"
    partnerId: v.string(),   // Partner ID for reference
    createdAt: v.number(),   // When Stripe product was created
    updatedAt: v.number(),   // Last update
  })),
};

// Extensions for existing booking tables
export const bookingStripeFields = {
  // Payment Information
  stripePaymentIntentId: v.optional(v.string()),    // Stripe Payment Intent ID
  stripeCheckoutSessionId: v.optional(v.string()),  // Stripe Checkout Session ID
  stripeCustomerId: v.optional(v.string()),         // Stripe Customer ID
  
  // Payment Status Enhancement
  paymentStatus: v.union(
    v.literal("pending"),
    v.literal("processing"), 
    v.literal("succeeded"),
    v.literal("requires_action"),
    v.literal("canceled"),
    v.literal("failed"),
    v.literal("refunded"),
    v.literal("partially_refunded")
  ),
  
  // Payment Details
  paymentDetails: v.optional(v.object({
    amountTotal: v.number(),           // Total amount in cents
    amountPaid: v.number(),            // Amount actually paid in cents
    amountRefunded: v.optional(v.number()), // Amount refunded in cents
    currency: v.string(),              // Currency code (e.g., "brl")
    paymentMethodTypes: v.array(v.string()), // Accepted payment methods
    receiptUrl: v.optional(v.string()), // Stripe receipt URL
  })),
  
  // Refund Information
  refunds: v.optional(v.array(v.object({
    refundId: v.string(),              // Stripe Refund ID
    amount: v.number(),                // Refund amount in cents
    reason: v.string(),                // Reason for refund
    status: v.string(),                // Refund status
    createdAt: v.number(),             // When refund was created
    processedAt: v.optional(v.number()), // When refund was processed
  }))),
};

// New table for payment events and webhook processing
export const stripeWebhookEvents = {
  // Webhook Event Information
  stripeEventId: v.string(),           // Stripe Event ID (for idempotency)
  eventType: v.string(),               // Event type (e.g., payment_intent.succeeded)
  livemode: v.boolean(),               // Whether this is a live or test event
  
  // Processing Status
  processed: v.boolean(),              // Whether the event has been processed
  processedAt: v.optional(v.number()), // When it was processed
  
  // Related Entities
  relatedBookingId: v.optional(v.string()), // Related booking ID
  relatedAssetType: v.optional(v.string()),  // Type of asset (activity, event, etc.)
  relatedAssetId: v.optional(v.string()),    // Asset ID
  
  // Event Data
  eventData: v.object({
    amount: v.optional(v.number()),      // Amount involved
    currency: v.optional(v.string()),    // Currency
    paymentIntentId: v.optional(v.string()), // Payment Intent ID
    customerId: v.optional(v.string()),  // Customer ID
  }),
  
  // Error Handling
  processingErrors: v.optional(v.array(v.object({
    error: v.string(),
    timestamp: v.number(),
    retryCount: v.number(),
  }))),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
};

// New table for storing Stripe customer information
export const stripeCustomers = {
  // User Reference
  userId: v.id("users"),
  
  // Stripe Information
  stripeCustomerId: v.string(),        // Stripe Customer ID
  
  // Customer Data
  email: v.string(),
  name: v.optional(v.string()),
  phone: v.optional(v.string()),
  
  // Metadata
  metadata: v.optional(v.object({
    source: v.string(),                // Where customer was created from
    userRole: v.string(),              // User role when created
  })),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
}; 