import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Guide Purchases Schema
 * Stores one-time purchases of the guide (not subscriptions)
 */
export const guidePurchases = defineTable({
  // User info
  userId: v.string(), // Clerk user ID
  userEmail: v.string(),
  userName: v.optional(v.string()),
  
  // Payment info
  mpPaymentId: v.string(), // Mercado Pago payment ID
  mpPreferenceId: v.optional(v.string()), // Preference used for checkout
  amount: v.number(), // R$ 99.90
  currency: v.string(), // BRL
  
  // Payment status
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("authorized"),
    v.literal("in_process"),
    v.literal("in_mediation"),
    v.literal("rejected"),
    v.literal("cancelled"),
    v.literal("refunded"),
    v.literal("charged_back")
  ),
  statusDetail: v.optional(v.string()),
  
  // Payment method
  paymentMethod: v.optional(v.string()), // visa, mastercard, pix, etc
  paymentTypeId: v.optional(v.string()), // credit_card, debit_card, bank_transfer
  
  // Dates
  purchasedAt: v.number(), // When payment was created
  approvedAt: v.optional(v.number()), // When payment was approved
  
  // Metadata
  externalReference: v.optional(v.string()), // guide_${userId}
  metadata: v.optional(v.any()),
})
  .index("by_userId", ["userId"])
  .index("by_mpPaymentId", ["mpPaymentId"])
  .index("by_user_and_status", ["userId", "status"])
  .index("by_status", ["status"]);
