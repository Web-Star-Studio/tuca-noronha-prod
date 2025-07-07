"use node";

import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";

/**
 * Approve a booking and capture payment
 * Public action that can be called by partners/employees
 */
export const approveBookingAndCapturePayment = action({
  args: {
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("accommodation"),
      v.literal("vehicle"),
      v.literal("package")
    ),
    partnerNotes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // First, get the booking to find the payment intent
    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations",
      "accommodationBookings",
      "vehicleBookings",
      "packageBookings"
    ];

    let booking;
    for (const tableName of tables) {
      booking = await ctx.runQuery(internal["domains/stripe/bookingQueries"].getBookingById, {
        bookingId: args.bookingId,
        tableName: tableName,
      });

      if (booking) break;
    }

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (!booking.stripePaymentIntentId) {
      return { success: false, error: "No payment intent found for this booking" };
    }

    try {
      // Capture the payment intent
      const captureResult = await ctx.runAction(internal["domains/stripe/actions"].capturePaymentIntent, {
        paymentIntentId: booking.stripePaymentIntentId,
      });

      if (!captureResult.success) {
        return { success: false, error: captureResult.error };
      }

      // Update booking status to confirmed and payment status to succeeded
      await ctx.runMutation(internal["domains/stripe/mutations"].updateBookingStripeInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        paymentStatus: "succeeded",
      });

      // Update booking status via the general booking update
      await ctx.runMutation(internal["domains/stripe/mutations"].updateBookingStatus, {
        bookingId: args.bookingId,
        status: "confirmed",
        partnerNotes: args.partnerNotes,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to approve booking and capture payment:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});

/**
 * Reject a booking and cancel payment
 * Public action that can be called by partners/employees
 */
export const rejectBookingAndCancelPayment = action({
  args: {
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("accommodation"),
      v.literal("vehicle"),
      v.literal("package")
    ),
    partnerNotes: v.optional(v.string()),
    cancellationReason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // First, get the booking to find the payment intent
    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations",
      "accommodationBookings",
      "vehicleBookings",
      "packageBookings"
    ];

    let booking;
    for (const tableName of tables) {
      booking = await ctx.runQuery(internal["domains/stripe/bookingQueries"].getBookingById, {
        bookingId: args.bookingId,
        tableName: tableName,
      });

      if (booking) break;
    }

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (!booking.stripePaymentIntentId) {
      return { success: false, error: "No payment intent found for this booking" };
    }

    try {
      // Cancel the payment intent
      const cancelResult = await ctx.runAction(internal["domains/stripe/actions"].cancelPaymentIntent, {
        paymentIntentId: booking.stripePaymentIntentId,
        cancellationReason: 'requested_by_customer',
      });

      if (!cancelResult.success) {
        return { success: false, error: cancelResult.error };
      }

      // Update booking status to canceled and payment status to canceled
      await ctx.runMutation(internal["domains/stripe/mutations"].updateBookingStripeInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        paymentStatus: "canceled",
      });

      // Update booking status via the general booking update
      await ctx.runMutation(internal["domains/stripe/mutations"].updateBookingStatus, {
        bookingId: args.bookingId,
        status: "canceled",
        partnerNotes: args.partnerNotes,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to reject booking and cancel payment:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});