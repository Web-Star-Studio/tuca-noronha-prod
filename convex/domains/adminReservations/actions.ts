"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil" as any,
});

/**
 * Create a payment intent for an admin reservation and send payment link via email
 */
export const createPaymentIntentAndSendLink = internalAction({
  args: {
    reservationId: v.id("adminReservations"),
    assetName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get reservation details
      const reservation = await ctx.runQuery(internal.domains.adminReservations.queries.getAdminReservationById, {
        id: args.reservationId,
      });

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      // Get or create Stripe customer
      const traveler = await ctx.runQuery(internal.domains.users.queries.getUserById, {
        userId: reservation.travelerId,
      });

      if (!traveler) {
        throw new Error("Traveler not found");
      }

      // Create or retrieve Stripe customer
      let stripeCustomerId = traveler.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: reservation.customerInfo.email,
          name: reservation.customerInfo.name,
          phone: reservation.customerInfo.phone,
          metadata: {
            userId: reservation.travelerId,
            source: "admin_reservation",
          },
        });

        stripeCustomerId = customer.id;

        // Update user with Stripe customer ID
        await ctx.runMutation(internal.domains.users.mutations.updateUserStripeCustomerId, {
          userId: reservation.travelerId,
          stripeCustomerId: customer.id,
        });
      }

      // Create payment intent with manual capture
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(reservation.totalPrice * 100), // Convert to cents
        currency: "brl",
        customer: stripeCustomerId,
        capture_method: "manual",
        metadata: {
          reservationId: reservation._id,
          reservationType: "admin_reservation",
          assetType: reservation.assetType,
          assetId: reservation.assetId,
          assetName: args.assetName,
          customerName: reservation.customerInfo.name,
          confirmationCode: reservation.confirmationCode || "",
        },
        description: `Reserva ${reservation.confirmationCode} - ${args.assetName}`,
        statement_descriptor: "TN Reserva",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create a price for the payment link
      const price = await stripe.prices.create({
        currency: "brl",
        unit_amount: Math.round(reservation.totalPrice * 100),
        product_data: {
          name: `Reserva: ${args.assetName}`,
        },
      });

      // Create payment link
      const paymentLink = await stripe.paymentLinks.create({
        payment_intent_data: {
          capture_method: "manual",
          metadata: {
            reservationId: reservation._id,
            reservationType: "admin_reservation",
            assetType: reservation.assetType,
            assetId: reservation.assetId,
          },
        },
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        after_completion: {
          type: "redirect",
          redirect: {
            url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?booking_id=${reservation._id}&type=admin`,
          },
        },
        metadata: {
          reservationId: reservation._id,
          reservationType: "admin_reservation",
        },
      });

      // Update reservation with payment intent and link information
      await ctx.runMutation(internal.domains.adminReservations.mutations.updatePaymentInfo, {
        reservationId: reservation._id,
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentLinkId: paymentLink.id,
        stripePaymentLinkUrl: paymentLink.url,
        paymentDueDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
      });

      // Send email with payment link
      await ctx.runAction(internal.domains.email.actions.sendAdminReservationPaymentLinkEmail, {
        customerEmail: reservation.customerInfo.email,
        customerName: reservation.customerInfo.name,
        assetName: args.assetName,
        confirmationCode: reservation.confirmationCode || "",
        totalAmount: reservation.totalPrice,
        paymentLinkUrl: paymentLink.url,
        paymentDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        adminName: reservation.adminCreatedBy || "Admin",
      });

      return { success: true, paymentIntentId: paymentIntent.id, paymentLinkUrl: paymentLink.url };
    } catch (error) {
      console.error("Failed to create payment intent:", error);
      throw error;
    }
  },
}); 