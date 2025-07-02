import { defineTable } from "convex/server";
import { v } from "convex/values";

// Assinaturas do guia
export const guideSubscriptions = defineTable({
  // ID do usuário
  userId: v.id("users"),
  
  // Status da assinatura
  status: v.union(
    v.literal("active"),
    v.literal("canceled"),
    v.literal("past_due"),
    v.literal("expired"),
    v.literal("trialing")
  ),
  
  // IDs do Stripe
  stripeCustomerId: v.string(),
  stripeSubscriptionId: v.string(),
  stripePriceId: v.string(),
  
  // Datas importantes
  currentPeriodStart: v.number(), // Unix timestamp
  currentPeriodEnd: v.number(), // Unix timestamp
  canceledAt: v.optional(v.number()),
  
  // Metadata
  metadata: v.optional(v.object({
    source: v.optional(v.string()),
    referrer: v.optional(v.string()),
  })),
})
  .index("by_user", ["userId"])
  .index("by_stripe_subscription", ["stripeSubscriptionId"])
  .index("by_status", ["status"])
  .index("by_user_and_status", ["userId", "status"]);

// Histórico de pagamentos
export const subscriptionPayments = defineTable({
  userId: v.id("users"),
  subscriptionId: v.id("guideSubscriptions"),
  
  // Informações do pagamento
  stripeInvoiceId: v.string(),
  stripePaymentIntentId: v.optional(v.string()),
  
  amount: v.number(), // Em centavos
  currency: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("succeeded"),
    v.literal("failed")
  ),
  
  paidAt: v.optional(v.number()),
  failureReason: v.optional(v.string()),
})
  .index("by_user", ["userId"])
  .index("by_subscription", ["subscriptionId"])
  .index("by_stripe_invoice", ["stripeInvoiceId"]); 