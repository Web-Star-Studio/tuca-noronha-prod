import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { updateBookingPaymentStatusValidator } from "./types";

/**
 * Store a Mercado Pago webhook event for idempotency
 */
export const storeWebhookEvent = internalMutation({
  args: {
    mpEventId: v.string(),
    type: v.optional(v.string()),
    action: v.optional(v.string()),
    eventData: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mpWebhookEvents")
      .filter((q) => q.eq(q.field("mpEventId"), args.mpEventId))
      .first();

    if (existing) return null;

    await ctx.db.insert("mpWebhookEvents", {
      mpEventId: args.mpEventId,
      type: args.type,
      action: args.action,
      processed: false,
      eventData: {
        id: args.eventData?.id != null ? String(args.eventData.id) : undefined,
        status: args.eventData?.status,
        paymentId: args.eventData?.id?.toString?.(),
        amount: args.eventData?.transaction_amount,
        currency: args.eventData?.currency_id,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Mark MP webhook event as processed
 */
export const markWebhookEventProcessed = internalMutation({
  args: { mpEventId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("mpWebhookEvents")
      .filter((q) => q.eq(q.field("mpEventId"), args.mpEventId))
      .first();

    if (event) {
      await ctx.db.patch(event._id, {
        processed: true,
        processedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Add error to webhook event
 */
export const addWebhookEventError = internalMutation({
  args: {
    mpEventId: v.string(),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("mpWebhookEvents")
      .filter((q) => q.eq(q.field("mpEventId"), args.mpEventId))
      .first();

    if (event) {
      const currentErrors = event.processingErrors || [];
      const newError = { error: args.error, timestamp: Date.now(), retryCount: currentErrors.length };
      await ctx.db.patch(event._id, {
        processingErrors: [...currentErrors, newError],
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Update booking Mercado Pago info and payment status
 */
export const updateBookingMpInfo = internalMutation({
  args: {
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package"),
    ),
    mpPaymentId: v.optional(v.string()),
    mpPreferenceId: v.optional(v.string()),
    mpPaymentLinkId: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: any = { updatedAt: Date.now() };
    if (args.mpPaymentId) updateData.mpPaymentId = args.mpPaymentId;
    if (args.mpPreferenceId) updateData.mpPreferenceId = args.mpPreferenceId;
    if (args.mpPaymentLinkId) updateData.mpPaymentLinkId = args.mpPaymentLinkId;
    if (args.paymentStatus) updateData.paymentStatus = args.paymentStatus;

    const tableMap: Record<string, string> = {
      activity: "activityBookings",
      event: "eventBookings",
      restaurant: "restaurantReservations",
      vehicle: "vehicleBookings",
      package: "packageBookings",
    };

    const table = tableMap[args.assetType];
    const booking = await ctx.db
      .query(table as any)
      .filter((q: any) => q.eq(q.field("_id"), args.bookingId))
      .unique();

    if (booking) {
      await ctx.db.patch(booking._id, updateData);
    }
    return null;
  },
});

/**
 * Update booking payment status specifically for Mercado Pago
 */
export const updateBookingPaymentStatus = internalMutation({
  args: updateBookingPaymentStatusValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    // Map MP status to our generic statuses where applicable
    const statusMap: Record<string, string> = {
      approved: "paid",
      in_process: "processing",
      authorized: "authorized",
      rejected: "failed",
      cancelled: "cancelled",
      refunded: "refunded",
      charged_back: "charged_back",
      pending: "pending",
    };

    const updateData: any = {
      paymentStatus: statusMap[args.paymentStatus] || args.paymentStatus,
      updatedAt: Date.now(),
    };
    if (args.paymentId) updateData.mpPaymentId = args.paymentId;
    if (args.receiptUrl) {
      updateData.paymentDetails = { receiptUrl: args.receiptUrl };
    }

    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations",
      "vehicleBookings",
      "packageBookings",
    ];

    for (const tableName of tables) {
      const booking = await ctx.db
        .query(tableName as any)
        .filter((q: any) => q.eq(q.field("_id"), args.bookingId))
        .unique();
      if (booking) {
        await ctx.db.patch(booking._id, updateData);
        break;
      }
    }
    return null;
  },
});

/**
 * Add refund to booking for Mercado Pago
 */
export const addRefundToBooking = internalMutation({
  args: {
    bookingId: v.string(),
    refundId: v.union(v.string(), v.number()),
    amount: v.number(),
    reason: v.optional(v.string()),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const refundData = {
      refundId: String(args.refundId),
      amount: args.amount,
      reason: args.reason || "mercado_pago",
      status: args.status,
      createdAt: Date.now(),
      processedAt: args.status === "succeeded" || args.status === "approved" ? Date.now() : undefined,
    };

    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations",
      "vehicleBookings",
      "packageBookings",
    ];

    for (const tableName of tables) {
      const booking = await ctx.db
        .query(tableName as any)
        .filter((q: any) => q.eq(q.field("_id"), args.bookingId))
        .unique();
      if (booking) {
        const currentRefunds = booking.refunds || [];
        await ctx.db.patch(booking._id, {
          refunds: [...currentRefunds, refundData],
          paymentStatus: args.status === "approved" ? "refunded" : booking.paymentStatus,
          updatedAt: Date.now(),
        });
        break;
      }
    }
    return null;
  },
});
