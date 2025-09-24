/**
 * @deprecated This file contains Stripe admin reservation functionality that is no longer used.
 * The system now uses Mercado Pago for payments. 
 * This file is kept temporarily to avoid breaking the build.
 * TODO: Remove this file after confirming no dependencies exist.
 */

"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

// Stripe removed - system migrated to Mercado Pago

export const createPaymentIntentAndSendLink = internalAction({
  args: {
    reservationId: v.id("adminReservations"),
    assetName: v.string(),
  },
  handler: async (ctx, args) => {
    throw new Error("Stripe admin reservation functionality has been removed. Please use Mercado Pago instead.");
  },
}); 