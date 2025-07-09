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

      // Generate voucher for confirmed booking
      try {
        // Get partner ID from booking's associated asset
        let partnerId: string | undefined;
        let customerId: string = booking.userId || booking.customerId;
        
        // Get partner ID from booking's associated asset using internal queries
        switch (args.assetType) {
          case "activity":
            if (booking.activityId) {
              const activity = await ctx.runQuery(internal.domains.activities.queries.getById, {
                id: booking.activityId,
              });
              partnerId = activity?.partnerId;
            }
            break;
          case "event":
            if (booking.eventId) {
              const event = await ctx.runQuery(internal.domains.events.queries.getById, {
                id: booking.eventId,
              });
              partnerId = event?.partnerId;
            }
            break;
          case "accommodation":
            if (booking.accommodationId) {
              const accommodation = await ctx.runQuery(internal.domains.accommodations.queries.getById, {
                id: booking.accommodationId,
              });
              partnerId = accommodation?.partnerId;
            }
            break;
          case "vehicle":
            if (booking.vehicleId) {
              const vehicle = await ctx.runQuery(internal.domains.vehicles.queries.getById, {
                id: booking.vehicleId,
              });
              partnerId = vehicle?.partnerId;
            }
            break;
          case "restaurant":
            if (booking.restaurantId) {
              const restaurant = await ctx.runQuery(internal.domains.restaurants.queries.getById, {
                id: booking.restaurantId,
              });
              partnerId = restaurant?.partnerId;
            }
            break;
          default:
            throw new Error(`Tipo de reserva não suportado: ${args.assetType}`);
        }
        
        if (!partnerId) {
          throw new Error("Partner ID não encontrado para esta reserva");
        }
        
        const voucher = await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucher, {
          bookingId: args.bookingId,
          bookingType: args.assetType,
          partnerId,
          customerId,
        });
        
        console.log(`✅ Voucher generated for ${args.assetType} booking: ${voucher.voucherNumber}`);
        
        // Send voucher email based on booking type
        const customerEmail = booking.customerInfo?.email || booking.email || booking.customerEmail;
        const customerName = booking.customerInfo?.name || booking.name || booking.customerName;
        
        // Get asset name for email (reuse already fetched assets from above)
        let assetName = "Serviço";
        switch (args.assetType) {
          case "activity":
            if (booking.activityId) {
              const activity = await ctx.runQuery(internal.domains.activities.queries.getById, {
                id: booking.activityId,
              });
              assetName = activity?.name || "Atividade";
            }
            break;
          case "event":
            if (booking.eventId) {
              const event = await ctx.runQuery(internal.domains.events.queries.getById, {
                id: booking.eventId,
              });
              assetName = event?.name || "Evento";
            }
            break;
          case "accommodation":
            if (booking.accommodationId) {
              const accommodation = await ctx.runQuery(internal.domains.accommodations.queries.getById, {
                id: booking.accommodationId,
              });
              assetName = accommodation?.name || "Hospedagem";
            }
            break;
          case "vehicle":
            if (booking.vehicleId) {
              const vehicle = await ctx.runQuery(internal.domains.vehicles.queries.getById, {
                id: booking.vehicleId,
              });
              assetName = vehicle?.name || "Veículo";
            }
            break;
          case "restaurant":
            if (booking.restaurantId) {
              const restaurant = await ctx.runQuery(internal.domains.restaurants.queries.getById, {
                id: booking.restaurantId,
              });
              assetName = restaurant?.name || "Restaurante";
            }
            break;
        }
        
        await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendVoucherEmail, {
          voucherNumber: voucher.voucherNumber,
          customerEmail: customerEmail,
          customerName: customerName,
          assetName: assetName,
          bookingType: args.assetType,
          confirmationCode: booking.confirmationCode,
          bookingDetails: {},
        });
        
        console.log(`✅ Voucher email sent for: ${voucher.voucherNumber}`);
        
      } catch (voucherError) {
        console.error("Error generating voucher:", voucherError);
        console.error("Booking data:", JSON.stringify(booking, null, 2));
        console.error("Booking ID:", args.bookingId);
        console.error("Asset type:", args.assetType);
        // Don't throw - voucher generation failure shouldn't fail the booking approval
      }

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