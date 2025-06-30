"use node";

import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { internal } from "../../_generated/api";

import {
  createStripeProductValidator,
  createCheckoutSessionValidator,
  createRefundValidator,
  processWebhookValidator,
  createStripeCustomerValidator,
  createPaymentLinkValidator,
} from "./types";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

/**
 * Create a Stripe product for an asset
 * Called when a new asset is created or when enabling Stripe payments
 */
export const createStripeProduct = internalAction({
  args: createStripeProductValidator,
  returns: v.object({
    productId: v.string(),
    priceId: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Create Stripe product
      const product = await stripe.products.create({
        name: args.name,
        description: args.description,
        images: args.imageUrl ? [args.imageUrl] : undefined,
        metadata: {
          assetId: args.assetId,
          assetType: args.assetType,
          partnerId: args.metadata?.partnerId || "",
          convexOrigin: "true",
        },
      });

      // Create price for the product
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: args.unitAmount,
        currency: args.currency || "brl",
        metadata: {
          assetId: args.assetId,
          assetType: args.assetType,
        },
      });

      return {
        productId: product.id,
        priceId: price.id,
        success: true,
      };
    } catch (error) {
      console.error("Failed to create Stripe product:", error);
      return {
        productId: "",
        priceId: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a Stripe Payment Link for an asset
 */
export const createStripePaymentLink = internalAction({
  args: createPaymentLinkValidator,
  returns: v.object({
    paymentLinkId: v.string(),
    paymentLinkUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      let stripePriceId = args.stripePriceId;
      
      // If no price ID provided, get from asset
      if (!stripePriceId) {
        const asset = await ctx.runQuery(internal.domains.stripe.queries.getAssetStripeInfo, {
          assetId: args.assetId,
          assetType: args.assetType,
        });

        if (!asset?.stripePriceId) {
          throw new Error("Asset does not have a Stripe price configured and no price ID provided");
        }
        
        stripePriceId = asset.stripePriceId;
      }

      // Final check to ensure stripePriceId is not undefined
      if (!stripePriceId) {
        throw new Error("Unable to determine Stripe price ID for payment link creation");
      }

      // Create payment link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        after_completion: args.afterCompletion || {
          type: "redirect",
          redirect: {
            url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
          },
        },
        metadata: {
          assetId: args.assetId,
          assetType: args.assetType,
          convexOrigin: "true",
        },
      });

      return {
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        success: true,
      };
    } catch (error) {
      console.error("Failed to create Stripe payment link:", error);
      return {
        paymentLinkId: "",
        paymentLinkUrl: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a Stripe Checkout Session for a booking
 */
export const createCheckoutSession = action({
  args: createCheckoutSessionValidator,
  returns: v.object({
    sessionId: v.string(),
    sessionUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get booking details to determine pricing
      const booking = await ctx.runQuery(internal.domains.stripe.queries.getBookingForCheckout, {
        bookingId: args.bookingId,
        assetType: args.assetType,
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Get or create Stripe customer
      const customer = await ctx.runAction(internal.domains.stripe.actions.getOrCreateStripeCustomer, {
        userId: booking.userId,
        email: args.customerEmail || booking.customerInfo.email,
        name: booking.customerInfo.name,
      });

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: booking.assetName,
                description: booking.assetDescription,
                metadata: {
                  assetId: booking.assetId,
                  assetType: args.assetType,
                },
              },
              unit_amount: Math.round(booking.totalPrice * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        allow_promotion_codes: args.allowPromotionCodes || false,
        metadata: {
          bookingId: args.bookingId,
          userId: booking.userId,
          assetType: args.assetType,
          assetId: booking.assetId,
          convexOrigin: "true",
        },
        payment_intent_data: {
          metadata: {
            bookingId: args.bookingId,
            assetType: args.assetType,
          },
        },
      });

      // Update booking with checkout session ID
      await ctx.runMutation(internal.domains.stripe.mutations.updateBookingStripeInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        stripeCheckoutSessionId: session.id,
        stripeCustomerId: customer.stripeCustomerId,
        paymentStatus: "processing",
      });

      return {
        sessionId: session.id,
        sessionUrl: session.url || "",
        success: true,
      };
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      return {
        sessionId: "",
        sessionUrl: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Get or create a Stripe customer for a user
 */
export const getOrCreateStripeCustomer = internalAction({
  args: createStripeCustomerValidator,
  returns: v.object({
    stripeCustomerId: v.string(),
    isNew: v.boolean(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Check if customer already exists in our database
      const existingCustomer = await ctx.runQuery(internal.domains.stripe.queries.getStripeCustomerByUserId, {
        userId: args.userId,
      });

      if (existingCustomer) {
        return {
          stripeCustomerId: existingCustomer.stripeCustomerId,
          isNew: false,
          success: true,
        };
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: args.email,
        name: args.name,
        phone: args.phone,
        metadata: {
          userId: args.userId,
          source: args.metadata?.source || "convex_app",
          userRole: args.metadata?.userRole || "traveler",
        },
      });

      // Store customer in our database
      await ctx.runMutation(internal.domains.stripe.mutations.createStripeCustomer, {
        userId: args.userId,
        stripeCustomerId: customer.id,
        email: args.email,
        name: args.name,
        phone: args.phone,
        metadata: args.metadata,
      });

      return {
        stripeCustomerId: customer.id,
        isNew: true,
        success: true,
      };
    } catch (error) {
      console.error("Failed to get or create Stripe customer:", error);
      return {
        stripeCustomerId: "",
        isNew: false,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Create a refund for a booking
 */
export const createRefund = internalAction({
  args: createRefundValidator,
  returns: v.object({
    refundId: v.string(),
    amount: v.number(),
    status: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get booking payment information
      const bookingPayment = await ctx.runQuery(internal.domains.stripe.queries.getBookingPaymentInfo, {
        bookingId: args.bookingId,
      });

      if (!bookingPayment?.stripePaymentIntentId) {
        throw new Error("No payment intent found for this booking");
      }

      // Map reason to valid Stripe reasons
      let stripeReason: "duplicate" | "fraudulent" | "requested_by_customer" | undefined;
      switch (args.reason) {
        case "duplicate":
          stripeReason = "duplicate";
          break;
        case "fraudulent":
          stripeReason = "fraudulent";
          break;
        case "partner_cancelled":
        case "requested_by_customer":
          stripeReason = "requested_by_customer";
          break;
        default:
          stripeReason = undefined; // Let Stripe determine
      }

      // Create refund
      const refund = await stripe.refunds.create({
        payment_intent: bookingPayment.stripePaymentIntentId,
        amount: args.amount, // If undefined, Stripe will refund the full amount
        reason: stripeReason,
        metadata: {
          bookingId: args.bookingId,
          cancelledBy: args.metadata?.cancelledBy || "system",
          cancellationReason: args.metadata?.cancellationReason || args.reason,
        },
      });

      // Update booking with refund information
      await ctx.runMutation(internal.domains.stripe.mutations.addRefundToBooking, {
        bookingId: args.bookingId,
        refundId: refund.id,
        amount: refund.amount,
        reason: args.reason,
        status: refund.status || "pending", // Ensure status is never null
      });

      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status || "pending", // Ensure status is never null
        success: true,
      };
    } catch (error) {
      console.error("Failed to create refund:", error);
      return {
        refundId: "",
        amount: 0,
        status: "failed",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Process Stripe webhook events
 */
export const processWebhookEvent = internalAction({
  args: processWebhookValidator,
  returns: v.object({
    success: v.boolean(),
    processed: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Check if event was already processed (idempotency)
      const existingEvent = await ctx.runQuery(internal.domains.stripe.queries.getWebhookEvent, {
        eventId: args.eventId,
      });

      if (existingEvent && existingEvent.processed) {
        return {
          success: true,
          processed: true,
        };
      }

      // Store webhook event
      await ctx.runMutation(internal.domains.stripe.mutations.storeWebhookEvent, {
        eventId: args.eventId,
        eventType: args.eventType,
        livemode: args.livemode,
        eventData: args.data,
      });

      // Process event based on type
      switch (args.eventType) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(ctx, args.data);
          break;
        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(ctx, args.data);
          break;
        case "payment_intent.payment_failed":
          await handlePaymentIntentFailed(ctx, args.data);
          break;
        case "payment_intent.canceled":
          await handlePaymentIntentCanceled(ctx, args.data);
          break;
        default:
          console.log(`Unhandled webhook event type: ${args.eventType}`);
      }

      // Mark event as processed
      await ctx.runMutation(internal.domains.stripe.mutations.markWebhookEventProcessed, {
        eventId: args.eventId,
      });

      return {
        success: true,
        processed: true,
      };
    } catch (error) {
      console.error("Failed to process webhook event:", error);
      
      // Store error for debugging
      await ctx.runMutation(internal.domains.stripe.mutations.addWebhookEventError, {
        eventId: args.eventId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Helper functions for webhook processing
async function handleCheckoutSessionCompleted(ctx: any, sessionData: any) {
  const { metadata } = sessionData;
  
  if (metadata?.bookingId) {
    await ctx.runMutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: "succeeded",
      stripePaymentIntentId: sessionData.payment_intent,
      receiptUrl: sessionData.receipt_url,
    });

    // Send confirmation notification
    await ctx.runAction(internal.domains.notifications.actions.sendBookingConfirmationNotification, {
      userId: metadata.userId,
      bookingId: metadata.bookingId,
      bookingType: metadata.assetType,
    });
  }
}

async function handlePaymentIntentSucceeded(ctx: any, paymentIntentData: any) {
  const { metadata } = paymentIntentData;
  
  if (metadata?.bookingId) {
    await ctx.runMutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: "succeeded",
      stripePaymentIntentId: paymentIntentData.id,
    });

    // Update booking status to awaiting_confirmation after payment succeeded
    await ctx.runMutation(internal.domains.bookings.mutations.updateBookingPaymentSuccess, {
      stripePaymentIntentId: paymentIntentData.id,
      bookingId: metadata.bookingId,
      bookingType: metadata.assetType,
    });
  }
}

async function handlePaymentIntentFailed(ctx: any, paymentIntentData: any) {
  const { metadata } = paymentIntentData;
  
  if (metadata?.bookingId) {
    await ctx.runMutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: "failed",
      stripePaymentIntentId: paymentIntentData.id,
    });
  }
}

async function handlePaymentIntentCanceled(ctx: any, paymentIntentData: any) {
  const { metadata } = paymentIntentData;
  
  if (metadata?.bookingId) {
    await ctx.runMutation(internal.domains.stripe.mutations.updateBookingPaymentStatus, {
      bookingId: metadata.bookingId,
      paymentStatus: "canceled",
      stripePaymentIntentId: paymentIntentData.id,
    });
  }
}

/**
 * Create a Payment Link for a specific booking
 * Used when customer wants to pay for an existing booking
 */
export const createPaymentLinkForBooking = action({
  args: v.object({
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("accommodation"),
      v.literal("vehicle")
    ),
    assetId: v.string(),
    totalAmount: v.number(),
    currency: v.optional(v.string()),
    successUrl: v.string(),
    cancelUrl: v.string(),
  }),
  returns: v.object({
    paymentLinkId: v.string(),
    paymentLinkUrl: v.string(),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log("🔄 createPaymentLinkForBooking started with args:", args);

      // Get booking details
      const booking = await ctx.runQuery(internal.domains.stripe.queries.getBookingForCheckout, {
        bookingId: args.bookingId,
        assetType: args.assetType,
      });

      console.log("📋 Booking details:", booking);

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.paymentStatus === "succeeded") {
        throw new Error("Booking already paid");
      }

      // Get or create Stripe customer
      console.log("👤 Creating/getting Stripe customer for:", {
        userId: booking.userId,
        email: booking.customerInfo.email,
        name: booking.customerInfo.name,
      });

      const customer = await ctx.runAction(internal.domains.stripe.actions.getOrCreateStripeCustomer, {
        userId: booking.userId,
        email: booking.customerInfo.email,
        name: booking.customerInfo.name,
      });

      console.log("👤 Stripe customer result:", customer);

      // Get asset Stripe information to use existing price ID
      console.log("🏷️ Getting asset Stripe info for:", {
        assetId: args.assetId,
        assetType: args.assetType,
      });

      const assetStripeInfo = await ctx.runQuery(internal.domains.stripe.queries.getAssetStripeInfo, {
        assetId: args.assetId,
        assetType: args.assetType,
      });

      console.log("🏷️ Asset Stripe info result:", assetStripeInfo);

      if (!assetStripeInfo?.stripePriceId) {
        throw new Error("Asset does not have Stripe price configured. Please run the backfill script first.");
      }

      // Calculate quantity based on total amount and asset price
      // For activities, the price per person is stored in the asset
      // The total amount is already calculated based on participants
      let quantity = 1;
      if (args.assetType === "activity") {
        // Get the activity to find base price using a query
        console.log("🎯 Getting activity details for price calculation...");
        const activity = await ctx.runQuery(internal.domains.activities.queries.getById, {
          id: args.assetId,
        });
        
        console.log("🎯 Activity details:", activity);
        
        if (activity && activity.price > 0) {
          quantity = Math.round(args.totalAmount / activity.price);
          console.log("🔢 Calculated quantity:", { totalAmount: args.totalAmount, basePrice: activity.price, quantity });
        }
      }

      console.log("💳 Creating Stripe payment link with:", {
        stripePriceId: assetStripeInfo.stripePriceId,
        quantity: quantity,
        successUrl: args.successUrl,
        cancelUrl: args.cancelUrl,
      });

      // Create payment link using existing price ID
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: assetStripeInfo.stripePriceId,
            quantity: quantity,
          },
        ],
        after_completion: {
          type: "redirect",
          redirect: {
            url: args.successUrl,
          },
        },
        automatic_tax: {
          enabled: false,
        },
        allow_promotion_codes: false,
        metadata: {
          bookingId: args.bookingId,
          userId: booking.userId,
          assetType: args.assetType,
          assetId: args.assetId,
          convexOrigin: "true",
        },
        payment_intent_data: {
          metadata: {
            bookingId: args.bookingId,
            assetType: args.assetType,
            assetId: args.assetId,
          },
        },
      });

      console.log("✅ Payment link created successfully:", {
        id: paymentLink.id,
        url: paymentLink.url,
      });

      // Update booking with payment link info
      console.log("📝 Updating booking with payment link info...");
      await ctx.runMutation(internal.domains.stripe.mutations.updateBookingStripeInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        stripeCustomerId: customer.stripeCustomerId,
        paymentStatus: "pending",
        stripePaymentLinkId: paymentLink.id,
      });

      console.log("🎉 createPaymentLinkForBooking completed successfully");

      return {
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        success: true,
      };
    } catch (error) {
      console.error("💥 ERRO ao criar payment link:", error);
      console.error("💥 Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      console.error("💥 Args que causaram o erro:", args);
      
      return {
        paymentLinkId: "",
        paymentLinkUrl: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
}); 