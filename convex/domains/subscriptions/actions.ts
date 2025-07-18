"use node";

import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { internal } from "../../_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil" as any,
});

// Product and Price IDs from setup script
const GUIDE_PRODUCT_ID = "prod_SbhqXdhdUhZF77";
const GUIDE_PRICE_ID = "price_1RgUUlGbTEVfu7BMLwU6TSdF";

/**
 * Create a Stripe Checkout session for guide subscription
 */
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
    try {
      // Get or create Stripe customer
      const existingCustomer = await ctx.runQuery(internal.domains.stripe.queries.getStripeCustomerByUserId, {
        userId: args.userId,
      });

      let stripeCustomerId: string;
      if (existingCustomer) {
        stripeCustomerId = existingCustomer.stripeCustomerId;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: args.userEmail,
          name: args.userName,
          metadata: {
            userId: args.userId,
            source: "guide_subscription",
          },
        });

        // Store customer in database
        await ctx.runMutation(internal.domains.stripe.mutations.createStripeCustomer, {
          userId: args.userId,
          stripeCustomerId: customer.id,
          email: args.userEmail,
          name: args.userName,
          metadata: {
            source: "guide_subscription",
            userRole: "traveler",
          },
        });

        stripeCustomerId = customer.id;
      }

      // Create checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: GUIDE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        allow_promotion_codes: true,
        metadata: {
          userId: args.userId,
          type: "guide_subscription",
          convexOrigin: "true",
        },
        subscription_data: {
          metadata: {
            userId: args.userId,
            type: "guide_subscription",
          },
        },
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
 * Create a Customer Portal session for managing subscriptions
 */
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
    try {
      // Get Stripe customer
      const customer = await ctx.runQuery(internal.domains.stripe.queries.getStripeCustomerByUserId, {
        userId: args.userId,
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.stripeCustomerId,
        return_url: args.returnUrl,
      });

      return {
        portalUrl: session.url,
        success: true,
      };
    } catch (error) {
      console.error("Failed to create portal session:", error);
      return {
        portalUrl: "",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Process subscription webhook events
 */
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
    try {
      const { eventType, subscription } = args;

      // Get user ID from metadata or customer lookup
      let userId = subscription.metadata.userId;
      if (!userId) {
        const customer = await ctx.runQuery(internal.domains.stripe.queries.getStripeCustomerByStripeId, {
          stripeCustomerId: subscription.customer,
        });
        if (customer) {
          userId = customer.userId;
        }
      }

      if (!userId) {
        throw new Error("User not found for subscription");
      }

      // Map Stripe status to our status
      let status: "active" | "canceled" | "past_due" | "expired" | "trialing";
      switch (subscription.status) {
        case "active":
          status = "active";
          break;
        case "canceled":
          status = "canceled";
          break;
        case "past_due":
          status = "past_due";
          break;
        case "trialing":
          status = "trialing";
          break;
        default:
          status = "expired";
      }

      // Update subscription in database
      await ctx.runMutation(internal.domains.subscriptions.mutations.upsertSubscription, {
        userId: userId as any,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status,
        currentPeriodStart: subscription.current_period_start * 1000, // Convert to milliseconds
        currentPeriodEnd: subscription.current_period_end * 1000,
        canceledAt: subscription.canceled_at ? subscription.canceled_at * 1000 : undefined,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to process subscription webhook:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Process invoice webhook events
 */
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
    try {
      const { eventType, invoice } = args;

      // Get subscription
      const subscription = await ctx.runQuery(internal.domains.subscriptions.queries.getByStripeSubscriptionId, {
        stripeSubscriptionId: invoice.subscription,
      });

      if (!subscription) {
        console.error("Subscription not found for invoice:", invoice.subscription);
        return { success: true }; // Don't fail webhook processing
      }

      // Record payment
      let paymentStatus: "pending" | "succeeded" | "failed";
      if (invoice.paid) {
        paymentStatus = "succeeded";
      } else if (invoice.status === "open") {
        paymentStatus = "pending";
      } else {
        paymentStatus = "failed";
      }

      await ctx.runMutation(internal.domains.subscriptions.mutations.recordPayment, {
        userId: subscription.userId,
        subscriptionId: subscription._id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: paymentStatus,
        paidAt: invoice.paid ? invoice.created * 1000 : undefined,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to process invoice webhook:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
}); 