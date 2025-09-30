import { defineTable } from "convex/server";
import { v } from "convex/values";

// Assinaturas do guia
export const guideSubscriptions = defineTable({
  // ID do usuário (Clerk ID)
  userId: v.string(),
  userEmail: v.string(),
  
  // Status da assinatura
  status: v.union(
    v.literal("authorized"),
    v.literal("paused"),
    v.literal("cancelled"),
    v.literal("pending")
  ),
  
  // IDs do Mercado Pago
  mpPreapprovalId: v.string(), // ID da assinatura no MP
  mpPlanId: v.optional(v.string()), // ID do plano (se usar plano)
  
  // Informações da assinatura
  reason: v.string(), // Descrição da assinatura
  externalReference: v.optional(v.string()),
  
  // Configuração de recorrência
  frequency: v.number(), // Frequência (ex: 1 para mensal)
  frequencyType: v.union(
    v.literal("days"),
    v.literal("weeks"),
    v.literal("months"),
    v.literal("years")
  ),
  transactionAmount: v.number(), // Valor em reais
  currencyId: v.string(), // BRL
  
  // Datas importantes
  startDate: v.number(), // Unix timestamp
  endDate: v.optional(v.number()), // Unix timestamp
  nextPaymentDate: v.optional(v.number()),
  lastPaymentDate: v.optional(v.number()),
  cancelledDate: v.optional(v.number()),
  pausedDate: v.optional(v.number()),
  
  // Metadata
  metadata: v.optional(v.object({
    source: v.optional(v.string()),
    referrer: v.optional(v.string()),
  })),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_mp_preapproval", ["mpPreapprovalId"])
  .index("by_status", ["status"])
  .index("by_user_and_status", ["userId", "status"]);

// Histórico de pagamentos
export const subscriptionPayments = defineTable({
  userId: v.string(), // Clerk user ID
  subscriptionId: v.id("guideSubscriptions"),
  
  // Informações do pagamento do Mercado Pago
  mpPaymentId: v.string(),
  mpPreapprovalId: v.string(),
  
  amount: v.number(), // Em reais
  currency: v.string(), // BRL
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
  paymentMethod: v.optional(v.string()),
  paymentTypeId: v.optional(v.string()),
  
  paidAt: v.optional(v.number()),
  failureReason: v.optional(v.string()),
  
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_subscription", ["subscriptionId"])
  .index("by_mp_payment", ["mpPaymentId"]); 