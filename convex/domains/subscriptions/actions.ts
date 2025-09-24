/**
 * @deprecated This file contains Stripe subscription functionality that is no longer used.
 * The system now uses Mercado Pago for payments. 
 * This file is kept temporarily to avoid breaking the build.
 * TODO: Remove this file after confirming no dependencies exist.
 */

"use node";

import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

// Stripe removed - system migrated to Mercado Pago
// Deprecated Product and Price IDs
const GUIDE_PRODUCT_ID = "prod_SbhqXdhdUhZF77";
const GUIDE_PRICE_ID = "price_1RgUUlGbTEVfu7BMLwU6TSdF";

export const createCheckoutSession = action({
  args: {
    userId: v.id("users"),
    userEmail: v.string(),
    userName: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
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
      error: "Stripe subscription functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const createPortalSession = action({
  args: {
    userId: v.id("users"),
    returnUrl: v.string(),
  },
  returns: v.object({
    portalUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      portalUrl: "",
      success: false,
      error: "Stripe subscription functionality has been removed. Please use Mercado Pago instead.",
    };
  },
});

export const processSubscriptionWebhook = internalAction({
  args: {
    eventType: v.string(),
    subscription: v.object({
      id: v.string(),
      customer: v.string(),
      status: v.string(),
      current_period_start: v.number(),
      current_period_end: v.number(),
      canceled_at: v.optional(v.number()),
      items: v.object({
        data: v.array(v.object({
          price: v.object({
            id: v.string(),
          }),
        })),
      }),
      metadata: v.object({
        userId: v.optional(v.string()),
      }),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log("Stripe subscription webhook received but functionality has been removed. Using Mercado Pago instead.");
    return { success: true };
  },
});

export const processInvoiceWebhook = internalAction({
  args: {
    eventType: v.string(),
    invoice: v.object({
      id: v.string(),
      customer: v.string(),
      subscription: v.string(),
      amount_paid: v.number(),
      currency: v.string(),
      payment_intent: v.optional(v.string()),
      status: v.string(),
      paid: v.boolean(),
      created: v.number(),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log("Stripe invoice webhook received but functionality has been removed. Using Mercado Pago instead.");
    return { success: true };
  },
}); 