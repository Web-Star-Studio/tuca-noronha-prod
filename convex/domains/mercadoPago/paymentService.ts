/**
 * Integration with Payment Service
 * This replaces direct MercadoPago API calls with calls to our Payment Service
 */

import { v } from "convex/values";
import { action } from "../../_generated/server";

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001';
const PAYMENT_SERVICE_API_KEY = process.env.PAYMENT_SERVICE_API_KEY || 'tuca-payment-service-key-2024';

/**
 * Create checkout preference via Payment Service
 */
export const createCheckoutPreferenceViaService = action({
  args: v.object({
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle")
    ),
    assetName: v.string(),
    totalPrice: v.number(),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
    metadata: v.optional(v.any()),
  }),
  returns: v.object({
    success: v.boolean(),
    preferenceId: v.optional(v.string()),
    checkoutUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PAYMENT_SERVICE_API_KEY,
        },
        body: JSON.stringify({
          bookingId: args.bookingId,
          assetType: args.assetType,
          items: [{
            title: args.assetName,
            quantity: 1,
            unitPrice: args.totalPrice,
          }],
          payer: args.customerEmail ? {
            email: args.customerEmail,
            name: args.customerName || '',
            phone: args.customerPhone,
          } : undefined,
          backUrls: {
            success: args.successUrl,
            pending: args.successUrl,
            failure: args.cancelUrl,
          },
          metadata: {
            ...args.metadata,
            source: 'convex-action',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Payment service error: ${error}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        preferenceId: result.preferenceId,
        checkoutUrl: result.checkoutUrl || result.sandboxInitPoint,
      };
    } catch (error) {
      console.error('Failed to create preference via Payment Service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Capture payment via Payment Service
 */
export const capturePaymentViaService = action({
  args: v.object({
    paymentId: v.string(),
    amount: v.optional(v.number()),
  }),
  returns: v.object({
    success: v.boolean(),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const response = await fetch(
        `${PAYMENT_SERVICE_URL}/api/payments/payment/${args.paymentId}/capture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': PAYMENT_SERVICE_API_KEY,
          },
          body: JSON.stringify({
            amount: args.amount,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Payment service error: ${error}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        status: result.status,
      };
    } catch (error) {
      console.error('Failed to capture payment via Payment Service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Cancel payment via Payment Service
 */
export const cancelPaymentViaService = action({
  args: v.object({
    paymentId: v.string(),
  }),
  returns: v.object({
    success: v.boolean(),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const response = await fetch(
        `${PAYMENT_SERVICE_URL}/api/payments/payment/${args.paymentId}/cancel`,
        {
          method: 'POST',
          headers: {
            'x-api-key': PAYMENT_SERVICE_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Payment service error: ${error}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        status: result.status,
      };
    } catch (error) {
      console.error('Failed to cancel payment via Payment Service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Refund payment via Payment Service
 */
export const refundPaymentViaService = action({
  args: v.object({
    paymentId: v.string(),
    amount: v.optional(v.number()),
  }),
  returns: v.object({
    success: v.boolean(),
    refundId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const response = await fetch(
        `${PAYMENT_SERVICE_URL}/api/payments/payment/${args.paymentId}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': PAYMENT_SERVICE_API_KEY,
          },
          body: JSON.stringify({
            amount: args.amount,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Payment service error: ${error}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        refundId: result.refundId,
      };
    } catch (error) {
      console.error('Failed to refund payment via Payment Service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
