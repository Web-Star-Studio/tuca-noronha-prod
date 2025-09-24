/**
 * @deprecated This file contains Stripe Connect functionality that is no longer used.
 * The system now uses Mercado Pago for payments. 
 * This file is kept temporarily to avoid breaking the build.
 * TODO: Remove this file after confirming no dependencies exist.
 */

"use node";

import { v } from "convex/values";
import { action, internalAction } from "../../_generated/server";
import { internal, api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

// Stripe removed - system migrated to Mercado Pago

// Deprecated Stripe functions - kept as stubs to avoid breaking the build

export const createStripeConnectedAccount = action({
  args: {
    userId: v.id("users"),
    email: v.string(),
    country: v.string(),
    businessType: v.optional(v.union(v.literal("individual"), v.literal("company"))),
    businessName: v.optional(v.string()),
  },
  returns: v.object({
    stripeAccountId: v.string(),
    onboardingUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    throw new Error("Stripe Connect functionality has been removed. Please use Mercado Pago instead.");
  },
});

export const refreshOnboardingLink = action({
  args: {
    stripeAccountId: v.string(),
  },
  returns: v.object({
    onboardingUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    throw new Error("Stripe Connect functionality has been removed. Please use Mercado Pago instead.");
  },
});

export const calculateApplicationFee = action({
  args: {
    partnerId: v.id("partners"),
    totalAmount: v.number(),
  },
  returns: v.object({
    totalAmount: v.number(),
    feePercentage: v.number(),
    applicationFeeAmount: v.number(),
    partnerAmount: v.number(),
    estimatedStripeFee: v.number(),
  }),
  handler: async (ctx, args) => {
    throw new Error("Stripe Connect functionality has been removed. Please use Mercado Pago instead.");
  },
});

export const processStripeConnectWebhook = internalAction({
  args: {
    event: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("Stripe webhook received but functionality has been removed. Using Mercado Pago instead.");
    return null;
  },
});

export const createDashboardLink = action({
  args: {
    stripeAccountId: v.string(),
  },
  returns: v.object({
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    throw new Error("Stripe Connect functionality has been removed. Please use Mercado Pago instead.");
  },
});

export const syncPartnerStatus = action({
  args: {
    stripeAccountId: v.string(),
  },
  returns: v.object({
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    chargesEnabled: v.boolean(),
    payoutsEnabled: v.boolean(),
    detailsSubmitted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    throw new Error("Stripe Connect functionality has been removed. Please use Mercado Pago instead.");
  },
}); 