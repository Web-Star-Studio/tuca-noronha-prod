import { v } from "convex/values";
import { action, internalQuery, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { createPaymentLinkValidator } from "./types";

/**
 * Create payment link for confirmed booking
 * Uses Mercado Pago Checkout Pro with automatic capture
 */
export const createPaymentLink = action({
  args: createPaymentLinkValidator,
  handler: async (ctx, args) => {
    const { bookingId, bookingType } = args;

    // Get the booking from database
    const booking = await ctx.runQuery(internal.domains.bookings.paymentActions.getBookingForPayment, {
      bookingId,
      bookingType,
    });

    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Check if booking is confirmed and awaiting payment
    if (booking.status !== "confirmed" && booking.status !== "awaiting_payment") {
      throw new Error("Reserva deve estar confirmada para gerar link de pagamento");
    }

    // Get asset details to build description
    let assetName = "";
    let assetDescription = "";
    
    try {
      if (bookingType === "activity") {
        const activity = await ctx.runQuery(internal.domains.activities.queries.getById, {
          id: booking.activityId,
        });
        assetName = activity?.title || "Atividade";
        assetDescription = `Reserva de atividade: ${assetName}`;
      } else if (bookingType === "event") {
        const event = await ctx.runQuery(internal.domains.events.queries.getById, {
          id: booking.eventId,
        });
        assetName = event?.title || "Evento";
        assetDescription = `Reserva de evento: ${assetName}`;
      } else if (bookingType === "vehicle") {
        const vehicle = await ctx.runQuery(internal.domains.vehicles.queries.getVehicle, {
          id: booking.vehicleId,
        });
        assetName = vehicle ? `${vehicle.brand} ${vehicle.model}` : "Veículo";
        assetDescription = `Reserva de veículo: ${assetName}`;
      } else if (bookingType === "restaurant") {
        const restaurant = await ctx.runQuery(internal.domains.restaurants.queries.getById, {
          id: booking.restaurantId,
        });
        assetName = restaurant?.name || "Restaurante";
        assetDescription = `Reserva de restaurante: ${assetName}`;
      }
    } catch (error) {
      console.error("Error fetching asset details:", error);
      assetDescription = `Reserva #${booking.confirmationCode}`;
    }

    // Create Checkout Pro preference using existing action
    const preference = await ctx.runAction(internal.domains.mercadoPago.actions.createCheckoutPreferenceForBooking, {
      bookingId: booking._id,
      assetType: bookingType,
      successUrl: `${process.env.SITE_URL || "http://localhost:3000"}/pagamento/sucesso?booking_id=${booking.confirmationCode}`,
      cancelUrl: `${process.env.SITE_URL || "http://localhost:3000"}/pagamento/cancelado?booking_id=${booking.confirmationCode}`,
      pendingUrl: `${process.env.SITE_URL || "http://localhost:3000"}/pagamento/pendente?booking_id=${booking.confirmationCode}`,
      customerEmail: booking.customerInfo?.email || booking.email,
      couponCode: booking.couponCode,
      discountAmount: booking.discountAmount,
      originalAmount: booking.totalPrice,
      finalAmount: booking.finalAmount || booking.totalPrice,
      currency: "BRL",
    });

    if (!preference.success || !preference.preferenceUrl) {
      throw new Error(preference.error || "Erro ao criar link de pagamento");
    }

    // Update booking with payment URL
    await ctx.runMutation(internal.domains.bookings.paymentActions.updateBookingPaymentUrl, {
      bookingId,
      bookingType,
      paymentUrl: preference.preferenceUrl,
      mpPreferenceId: preference.preferenceId,
    });

    return {
      success: true,
      paymentUrl: preference.preferenceUrl,
      preferenceId: preference.preferenceId,
    };
  },
});

/**
 * Internal query to get booking for payment
 */
export const getBookingForPayment = internalQuery({
  args: {
    bookingId: v.union(
      v.id("activityBookings"),
      v.id("eventBookings"),
      v.id("vehicleBookings"),
      v.id("restaurantReservations")
    ),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("vehicle"),
      v.literal("restaurant")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bookingId as any);
  },
});

/**
 * Internal mutation to update booking with payment URL
 */
export const updateBookingPaymentUrl = internalMutation({
  args: {
    bookingId: v.union(
      v.id("activityBookings"),
      v.id("eventBookings"),
      v.id("vehicleBookings"),
      v.id("restaurantReservations")
    ),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("vehicle"),
      v.literal("restaurant")
    ),
    paymentUrl: v.string(),
    mpPreferenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId as any, {
      paymentUrl: args.paymentUrl,
      mpPreferenceId: args.mpPreferenceId,
      status: "awaiting_payment",
      updatedAt: Date.now(),
    });
  },
});
