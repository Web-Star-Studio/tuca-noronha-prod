/**
 * @deprecated This file contains Stripe functionality that is no longer used.
 * The system now uses Mercado Pago for payments. 
 * This file is kept temporarily to avoid breaking the build.
 * TODO: Remove this file after confirming no dependencies exist.
 */

"use node";

import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

import {
  createStripeProductValidator,
  createCheckoutSessionValidator,
  createRefundValidator,
  processWebhookValidator,
  createStripeCustomerValidator,
  createPaymentLinkValidator,
} from "./types";

// Stripe removed - system migrated to Mercado Pago

export const createStripeProduct = internalAction({
  args: createStripeProductValidator,
  returns: v.object({
    productId: v.string(),
    priceId: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      productId: "",
      priceId: "",
      success: false,
      error: "Stripe functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const createStripePaymentLink = internalAction({
  args: createPaymentLinkValidator,
  returns: v.object({
    paymentLinkId: v.string(),
    paymentLinkUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      paymentLinkId: "",
      paymentLinkUrl: "",
      success: false,
      error: "Stripe functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const createCheckoutSession = action({
  args: createCheckoutSessionValidator,
  returns: v.object({
    sessionId: v.string(),
    sessionUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      sessionId: "",
      sessionUrl: "",
      success: false,
      error: "Stripe functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const getOrCreateStripeCustomer = internalAction({
  args: createStripeCustomerValidator,
  returns: v.object({
    stripeCustomerId: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      stripeCustomerId: "",
      success: false,
      error: "Stripe functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const createRefund = internalAction({
  args: createRefundValidator,
  returns: v.object({
    refundId: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      refundId: "",
      success: false,
      error: "Stripe functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const processWebhookEvent = internalAction({
  args: processWebhookValidator,
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      success: false,
      error: "Stripe functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const capturePaymentIntent = internalAction({
  args: {
    paymentIntentId: v.string(),
    amountToCapture: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      success: false,
      error: "Stripe functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const cancelPaymentIntent = internalAction({
  args: {
    paymentIntentId: v.string(),
    cancellationReason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      success: false,
      error: "Stripe functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const createPaymentLinkForBooking = action({
  args: v.object({
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package")
    ),
  }),
  returns: v.object({
    paymentLinkUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      paymentLinkUrl: "",
      success: false,
      error: "Stripe functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});
