import { internalMutation, mutation } from "../../_generated/server";
import { v } from "convex/values";
import { 
  updateBookingPaymentStatusValidator,
  createRefundValidator,
  updateBookingValidator,
} from "./types";

/**
 * Store a webhook event for processing and idempotency
 */
export const storeWebhookEvent = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    livemode: v.boolean(),
    eventData: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("stripeWebhookEvents", {
      stripeEventId: args.eventId,
      eventType: args.eventType,
      livemode: args.livemode,
      processed: false,
      eventData: {
        amount: args.eventData.amount || 0,
        currency: args.eventData.currency || "brl",
        paymentIntentId: args.eventData.payment_intent || undefined,
        customerId: args.eventData.customer || undefined,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Mark a webhook event as processed
 */
export const markWebhookEventProcessed = internalMutation({
  args: {
    eventId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("stripeWebhookEvents")
      .filter((q) => q.eq(q.field("stripeEventId"), args.eventId))
      .unique();

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
 * Add error to webhook event for debugging
 */
export const addWebhookEventError = internalMutation({
  args: {
    eventId: v.string(),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("stripeWebhookEvents")
      .filter((q) => q.eq(q.field("stripeEventId"), args.eventId))
      .unique();

    if (event) {
      const currentErrors = event.processingErrors || [];
      const newError = {
        error: args.error,
        timestamp: Date.now(),
        retryCount: currentErrors.length,
      };

      await ctx.db.patch(event._id, {
        processingErrors: [...currentErrors, newError],
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

/**
 * Create a Stripe customer record in our database
 */
export const createStripeCustomer = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    metadata: v.optional(v.object({
      source: v.string(),
      userRole: v.string(),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("stripeCustomers", {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      email: args.email,
      name: args.name,
      phone: args.phone,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Update booking Stripe information (checkout session, customer, payment status)
 */
export const updateBookingStripeInfo = internalMutation({
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
    stripeCheckoutSessionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update the appropriate booking table based on asset type
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.stripeCheckoutSessionId) {
      updateData.stripeCheckoutSessionId = args.stripeCheckoutSessionId;
    }
    if (args.stripeCustomerId) {
      updateData.stripeCustomerId = args.stripeCustomerId;
    }
    if (args.stripePaymentLinkId) {
      updateData.stripePaymentLinkId = args.stripePaymentLinkId;
    }
    if (args.paymentStatus) {
      updateData.paymentStatus = args.paymentStatus;
    }

    // Get the booking based on asset type
    let booking;
    switch (args.assetType) {
      case "activity":
        booking = await ctx.db
          .query("activityBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          await ctx.db.patch(booking._id, updateData);
        }
        break;
      case "event":
        booking = await ctx.db
          .query("eventBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          await ctx.db.patch(booking._id, updateData);
        }
        break;
      case "restaurant":
        booking = await ctx.db
          .query("restaurantReservations")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          await ctx.db.patch(booking._id, updateData);
        }
        break;
      case "accommodation":
        booking = await ctx.db
          .query("accommodationBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          await ctx.db.patch(booking._id, updateData);
        }
        break;
      case "vehicle":
        booking = await ctx.db
          .query("vehicleBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          await ctx.db.patch(booking._id, updateData);
        }
        break;
      case "package":
        booking = await ctx.db
          .query("packageBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          await ctx.db.patch(booking._id, updateData);
        }
        break;
    }
    return null;
  },
});

/**
 * Update booking payment status specifically
 */
export const updateBookingPaymentStatus = internalMutation({
  args: {
    bookingId: v.string(),
    paymentStatus: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: any = {
      paymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    };

    if (args.stripePaymentIntentId) {
      updateData.stripePaymentIntentId = args.stripePaymentIntentId;
    }

    // Update payment details if provided
    if (args.receiptUrl || args.stripePaymentIntentId) {
      updateData.paymentDetails = {
        receiptUrl: args.receiptUrl,
      };
    }

    // Find the booking across all booking tables
    const tables = [
      "activityBookings",
      "eventBookings", 
      "restaurantReservations",
      "accommodationBookings",
      "vehicleBookings",
      "packageBookings"
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
 * Add refund information to a booking
 */
export const addRefundToBooking = internalMutation({
  args: {
    bookingId: v.string(),
    refundId: v.string(),
    amount: v.number(),
    reason: v.string(),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const refundData = {
      refundId: args.refundId,
      amount: args.amount,
      reason: args.reason,
      status: args.status,
      createdAt: Date.now(),
      processedAt: args.status === "succeeded" ? Date.now() : undefined,
    };

    // Find the booking across all booking tables
    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations", 
      "accommodationBookings",
      "vehicleBookings",
      "packageBookings"
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
          paymentStatus: args.status === "succeeded" ? "refunded" : booking.paymentStatus,
          status: args.status === "succeeded" ? "refunded" : booking.status,
          updatedAt: Date.now(),
        });
        break;
      }
    }
    return null;
  },
});

/**
 * Update asset with Stripe product information
 */
export const updateAssetStripeInfo = internalMutation({
  args: {
    assetId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("accommodation"),
      v.literal("vehicle"),
      v.literal("package")
    ),
    stripeProductId: v.string(),
    stripePriceId: v.string(),
    stripePaymentLinkId: v.optional(v.string()),
    acceptsOnlinePayment: v.optional(v.boolean()),
    requiresUpfrontPayment: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updateData: any = {
      stripeProductId: args.stripeProductId,
      stripePriceId: args.stripePriceId,
      stripeMetadata: {
        productType: args.assetType,
        partnerId: "", // Will be filled by the calling function
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      updatedAt: Date.now(), // This will be removed for tables that don't have this field
    };

    if (args.stripePaymentLinkId) {
      updateData.stripePaymentLinkId = args.stripePaymentLinkId;
    }
    if (args.acceptsOnlinePayment !== undefined) {
      updateData.acceptsOnlinePayment = args.acceptsOnlinePayment;
    }
    if (args.requiresUpfrontPayment !== undefined) {
      updateData.requiresUpfrontPayment = args.requiresUpfrontPayment;
    }

    // Update the appropriate asset table
    let asset;
    switch (args.assetType) {
      case "activity":
        asset = await ctx.db
          .query("activities")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        if (asset) {
          // activities table doesn't have updatedAt field, so we create a separate updateData
          const activityUpdateData = { ...updateData };
          delete activityUpdateData.updatedAt;
          await ctx.db.patch(asset._id, activityUpdateData);
        }
        break;
      case "event":
        asset = await ctx.db
          .query("events")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        if (asset) {
          // events table doesn't have updatedAt field, so we create a separate updateData
          const eventUpdateData = { ...updateData };
          delete eventUpdateData.updatedAt;
          await ctx.db.patch(asset._id, eventUpdateData);
        }
        break;
      case "restaurant":
        asset = await ctx.db
          .query("restaurants")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        if (asset) {
          // restaurants table doesn't have updatedAt field, so we create a separate updateData
          const restaurantUpdateData = { ...updateData };
          delete restaurantUpdateData.updatedAt;
          await ctx.db.patch(asset._id, restaurantUpdateData);
        }
        break;
      case "accommodation":
        asset = await ctx.db
          .query("accommodations")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        if (asset) {
          // accommodations table doesn't have updatedAt field, so we create a separate updateData
          const accommodationUpdateData = { ...updateData };
          delete accommodationUpdateData.updatedAt;
          await ctx.db.patch(asset._id, accommodationUpdateData);
        }
        break;
      case "vehicle":
        asset = await ctx.db
          .query("vehicles")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        if (asset) {
          // vehicles table HAS updatedAt field, so we can use updateData as is
          await ctx.db.patch(asset._id, updateData);
        }
        break;
      case "package":
        asset = await ctx.db
          .query("packages")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        if (asset) {
          // packages table HAS updatedAt field, so we can use updateData as is
          await ctx.db.patch(asset._id, updateData);
        }
        break;
    }
    return null;
  },
});

/**
 * Update booking status (public mutation for partners/employees)
 */
export const updateBookingStatus = mutation({
  args: updateBookingValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify user has permission to update this booking
    // This would typically include checking if the user is the partner/employee
    // responsible for the asset that was booked
    
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.status) {
      updateData.status = args.status;
    }
    if (args.paymentStatus) {
      updateData.paymentStatus = args.paymentStatus;
    }
    if (args.partnerNotes) {
      updateData.partnerNotes = args.partnerNotes;
    }

    // Find and update the booking
    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations",
      "accommodationBookings", 
      "vehicleBookings",
      "packageBookings"
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
