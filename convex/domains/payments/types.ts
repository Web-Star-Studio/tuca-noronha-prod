import { v } from "convex/values";

// Payment types
export const PaymentStatus = v.union(
  v.literal("pending"),
  v.literal("approved"), 
  v.literal("authorized"),
  v.literal("in_process"),
  v.literal("in_mediation"),
  v.literal("rejected"),
  v.literal("cancelled"),
  v.literal("refunded"),
  v.literal("charged_back")
);

export const CreatePaymentPreferenceArgs = v.object({
  proposalId: v.id("packageProposals"),
  items: v.array(v.object({
    id: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category_id: v.optional(v.string()),
    quantity: v.number(),
    currency_id: v.string(),
    unit_price: v.number(),
  })),
  payer: v.optional(v.object({
    name: v.optional(v.string()),
    surname: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.object({
      area_code: v.string(),
      number: v.string(),
    })),
    identification: v.optional(v.object({
      type: v.string(),
      number: v.string(),
    })),
    address: v.optional(v.object({
      street_name: v.optional(v.string()),
      street_number: v.optional(v.number()),
      zip_code: v.optional(v.string()),
    })),
  })),
  back_urls: v.optional(v.object({
    success: v.string(),
    failure: v.string(),
    pending: v.string(),
  })),
  auto_return: v.optional(v.string()),
  external_reference: v.optional(v.string()),
  notification_url: v.optional(v.string()),
  statement_descriptor: v.optional(v.string()),
});

export const ProcessPaymentWebhookArgs = v.object({
  id: v.union(v.number(), v.string()),
  live_mode: v.boolean(),
  type: v.string(),
  date_created: v.string(),
  application_id: v.optional(v.number()),
  user_id: v.number(),
  version: v.optional(v.number()),
  api_version: v.string(),
  action: v.string(),
  data: v.object({
    id: v.string(),
  }),
});

export const UpdatePaymentStatusArgs = v.object({
  proposalId: v.id("packageProposals"),
  paymentId: v.string(),
  status: PaymentStatus,
  statusDetail: v.optional(v.string()),
  transactionAmount: v.optional(v.number()),
  paymentMethodId: v.optional(v.string()),
  paymentTypeId: v.optional(v.string()),
  dateApproved: v.optional(v.string()),
  dateCreated: v.optional(v.string()),
});
