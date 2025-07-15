import { query, internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Get webhook event by ID (for idempotency checking)
 */
export const getWebhookEvent = internalQuery({
  args: {
    eventId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("stripeWebhookEvents"),
      _creationTime: v.number(), // Campo automático do Convex
      stripeEventId: v.string(),
      eventType: v.string(),
      processed: v.boolean(),
      processedAt: v.optional(v.number()),
      livemode: v.optional(v.boolean()),
      relatedBookingId: v.optional(v.string()),
      relatedAssetType: v.optional(v.string()),
      relatedAssetId: v.optional(v.string()),
      eventData: v.optional(v.object({
        amount: v.optional(v.number()),
        currency: v.optional(v.string()),
        paymentIntentId: v.optional(v.string()),
        customerId: v.optional(v.string()),
      })),
      processingErrors: v.optional(v.array(v.object({
        error: v.string(),
        timestamp: v.number(),
        retryCount: v.number(),
      }))),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("stripeWebhookEvents")
      .filter((q) => q.eq(q.field("stripeEventId"), args.eventId))
      .first();

    return event || null;
  },
});

/**
 * Get Stripe customer by user ID
 */
export const getStripeCustomerByUserId = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("stripeCustomers"),
      _creationTime: v.number(), // Campo automático do Convex
      userId: v.id("users"),
      stripeCustomerId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      phone: v.optional(v.string()),
      metadata: v.optional(v.object({
        source: v.string(),
        userRole: v.string(),
      })),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("stripeCustomers")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .unique();

    return customer || null;
  },
});

/**
 * Get booking information for checkout session creation
 */
export const getBookingForCheckout = internalQuery({
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
  },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      assetId: v.string(),
      assetName: v.string(),
      assetDescription: v.string(),
      totalPrice: v.number(),
      paymentStatus: v.optional(v.string()),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      asset: v.optional(v.object({
        partnerId: v.optional(v.id("users")),
        ownerId: v.optional(v.id("users")),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    let booking;
    let asset;

    // Get booking based on asset type
    switch (args.assetType) {
      case "activity":
        booking = await ctx.db
          .query("activityBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          asset = await ctx.db.get(booking.activityId);
        }
        break;
      case "event":
        booking = await ctx.db
          .query("eventBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          asset = await ctx.db.get(booking.eventId);
        }
        break;
      case "restaurant":
        booking = await ctx.db
          .query("restaurantReservations")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          asset = await ctx.db.get(booking.restaurantId);
        }
        break;
      case "accommodation":
        booking = await ctx.db
          .query("accommodationBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          asset = await ctx.db.get(booking.accommodationId);
        }
        break;
      case "vehicle":
        booking = await ctx.db
          .query("vehicleBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          asset = await ctx.db.get(booking.vehicleId);
        }
        break;
      case "package":
        booking = await ctx.db
          .query("packageBookings")
          .filter((q) => q.eq(q.field("_id"), args.bookingId))
          .unique();
        if (booking) {
          asset = await ctx.db.get(booking.packageId);
        }
        break;
    }

    if (!booking || !asset) {
      return null;
    }

    return {
      userId: booking.userId,
      assetId: asset._id,
      assetName: (asset as any).name || (asset as any).title || "Unknown Asset",
      assetDescription: (asset as any).description || (asset as any).shortDescription || "",
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
      customerInfo: booking.customerInfo,
      asset: {
        partnerId: (asset as any).partnerId,
        ownerId: (asset as any).ownerId,
      },
    };
  },
});

/**
 * Get asset Stripe information
 */
export const getAssetStripeInfo = internalQuery({
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
  },
  returns: v.union(
    v.object({
      stripeProductId: v.optional(v.string()),
      stripePriceId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      acceptsOnlinePayment: v.optional(v.boolean()),
      requiresUpfrontPayment: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    let asset;

    switch (args.assetType) {
      case "activity":
        asset = await ctx.db
          .query("activities")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        break;
      case "event":
        asset = await ctx.db
          .query("events")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        break;
      case "restaurant":
        asset = await ctx.db
          .query("restaurants")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        break;
      case "accommodation":
        asset = await ctx.db
          .query("accommodations")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        break;
      case "vehicle":
        asset = await ctx.db
          .query("vehicles")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        break;
      case "package":
        asset = await ctx.db
          .query("packages")
          .filter((q) => q.eq(q.field("_id"), args.assetId))
          .unique();
        break;
    }

    if (!asset) {
      return null;
    }

    return {
      stripeProductId: asset.stripeProductId,
      stripePriceId: asset.stripePriceId,
      stripePaymentLinkId: asset.stripePaymentLinkId,
      acceptsOnlinePayment: asset.acceptsOnlinePayment,
      requiresUpfrontPayment: asset.requiresUpfrontPayment,
    };
  },
});

/**
 * Get booking payment information for refunds
 */
export const getBookingPaymentInfo = internalQuery({
  args: {
    bookingId: v.string(),
  },
  returns: v.union(
    v.object({
      stripePaymentIntentId: v.optional(v.string()),
      stripeCheckoutSessionId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      paymentStatus: v.optional(v.string()),
      totalPrice: v.number(),
      refunds: v.optional(v.array(v.object({
        refundId: v.string(),
        amount: v.number(),
        reason: v.string(),
        status: v.string(),
        createdAt: v.number(),
      }))),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Search across all booking tables
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
        return {
          stripePaymentIntentId: booking.stripePaymentIntentId,
          stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
          stripeCustomerId: booking.stripeCustomerId,
          paymentStatus: booking.paymentStatus,
          totalPrice: booking.totalPrice,
          refunds: booking.refunds,
        };
      }
    }

    return null;
  },
});

/**
 * Get booking by confirmation code with payment info
 */
export const getBookingByConfirmationCode = query({
  args: {
    confirmationCode: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.string(),
      assetType: v.string(),
      assetName: v.string(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      totalPrice: v.number(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCheckoutSessionId: v.optional(v.string()),
      receiptUrl: v.optional(v.string()),
      refunds: v.optional(v.array(v.object({
        refundId: v.string(),
        amount: v.number(),
        reason: v.string(),
        status: v.string(),
        createdAt: v.number(),
      }))),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Search across all booking tables
    const bookingTables = [
      { table: "activityBookings", assetTable: "activities", assetType: "activity" },
      { table: "eventBookings", assetTable: "events", assetType: "event" },
      { table: "restaurantReservations", assetTable: "restaurants", assetType: "restaurant" },
      { table: "accommodationBookings", assetTable: "accommodations", assetType: "accommodation" },
      { table: "vehicleBookings", assetTable: "vehicles", assetType: "vehicle" },
      { table: "packageBookings", assetTable: "packages", assetType: "package" },
    ];

    for (const config of bookingTables) {
      const booking = await ctx.db
        .query(config.table as any)
        .filter((q: any) => q.eq(q.field("confirmationCode"), args.confirmationCode))
        .unique();

      if (booking) {
        // Get asset name
        let assetName = "Unknown";
        if (config.assetType === "restaurant") {
          const asset = await ctx.db.get(booking.restaurantId);
          assetName = (asset as any)?.name || "Unknown Restaurant";
        } else if (config.assetType === "activity") {
          const asset = await ctx.db.get(booking.activityId);
          assetName = (asset as any)?.title || "Unknown Activity";
        } else if (config.assetType === "event") {
          const asset = await ctx.db.get(booking.eventId);
          assetName = (asset as any)?.title || "Unknown Event";
        } else if (config.assetType === "accommodation") {
          const asset = await ctx.db.get(booking.accommodationId);
          assetName = (asset as any)?.name || "Unknown Accommodation";
        } else if (config.assetType === "vehicle") {
          const asset = await ctx.db.get(booking.vehicleId);
          assetName = (asset as any)?.name || "Unknown Vehicle";
        } else if (config.assetType === "package") {
          const asset = await ctx.db.get(booking.packageId);
          assetName = (asset as any)?.name || "Unknown Package";
        }

        return {
          _id: booking._id,
          assetType: config.assetType,
          assetName,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalPrice: booking.totalPrice || 0,
          customerInfo: booking.customerInfo,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
          receiptUrl: booking.paymentDetails?.receiptUrl,
          refunded: (booking.refunds?.length || 0) > 0,
          refundAmount: booking.refunds?.reduce((sum: number, refund: any) => 
            refund.status === "succeeded" ? sum + refund.amount : sum, 0) || 0,
          createdAt: booking._creationTime,
        };
      }
    }

    return null;
  },
});

/**
 * Get partner's bookings with payment information
 */
export const getPartnerBookingsWithPayments = query({
  args: {
    partnerId: v.id("users"),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  returns: v.array(v.object({
    _id: v.string(),
    assetType: v.string(),
    assetName: v.string(),
    customerName: v.string(),
    totalPrice: v.number(),
    status: v.string(),
    paymentStatus: v.optional(v.string()),
    confirmationCode: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    refunded: v.boolean(),
    refundAmount: v.optional(v.number()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Verificar a role do usuário atual
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    const results: any[] = [];
    const limit = args.limit || 50;

    // Get all assets based on role
    let activities, events, restaurants, accommodations, vehicles, packages;

    if (currentUser.role === "master") {
      // Masters see ALL assets in the system
      activities = await ctx.db.query("activities").collect();
      events = await ctx.db.query("events").collect();
      restaurants = await ctx.db.query("restaurants").collect();
      accommodations = await ctx.db.query("accommodations").collect();
      vehicles = await ctx.db.query("vehicles").collect();
      packages = await ctx.db.query("packages").collect();
    } else {
      // For non-masters, filter by the provided partnerId
      activities = await ctx.db
        .query("activities")
        .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
        .collect();
      
      events = await ctx.db
        .query("events")
        .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
        .collect();

      restaurants = await ctx.db
        .query("restaurants")
        .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
        .collect();

      accommodations = await ctx.db
        .query("accommodations")
        .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
        .collect();

      vehicles = await ctx.db
        .query("vehicles")
        .filter((q) => q.eq(q.field("ownerId"), args.partnerId))
        .collect();

      packages = await ctx.db
        .query("packages")
        .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId))
        .collect();
    }

    // Get bookings for activities
    for (const activity of activities) {
      const bookings = await ctx.db
        .query("activityBookings")
        .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
        .collect();
      
      for (const booking of bookings) {
        if (args.status && booking.status !== args.status) continue;
        
        results.push({
          _id: booking._id,
          assetType: "activity",
          assetName: activity.title,
          customerName: booking.customerInfo.name,
          totalPrice: booking.totalPrice,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          confirmationCode: booking.confirmationCode,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          receiptUrl: booking.paymentDetails?.receiptUrl,
          refunded: (booking.refunds?.length || 0) > 0,
          refundAmount: booking.refunds?.reduce((sum: number, refund: any) => 
            refund.status === "succeeded" ? sum + refund.amount : sum, 0) || 0,
          createdAt: booking._creationTime,
        });
      }
    }

    // Sort by creation date and limit
    return results
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

/**
 * Get booking details by Stripe checkout session ID (for success page)
 */
export const getBookingBySessionId = query({
  args: {
    sessionId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.string(),
      assetType: v.string(),
      assetName: v.string(),
      assetDescription: v.optional(v.string()),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      totalPrice: v.number(),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      // Booking specific fields
      date: v.optional(v.string()),
      checkIn: v.optional(v.string()),
      checkOut: v.optional(v.string()),
      participants: v.optional(v.number()),
      guests: v.optional(v.number()),
      partySize: v.optional(v.number()),
      quantity: v.optional(v.number()),
      // Payment details
      stripePaymentIntentId: v.optional(v.string()),
      stripeCheckoutSessionId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      refunds: v.optional(v.array(v.object({
        refundId: v.string(),
        amount: v.number(),
        reason: v.string(),
        status: v.string(),
        createdAt: v.number(),
      }))),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Search across all booking tables for the session ID
    const bookingTables = [
      { table: "activityBookings", assetTable: "activities", assetType: "activity", assetIdField: "activityId" },
      { table: "eventBookings", assetTable: "events", assetType: "event", assetIdField: "eventId" },
      { table: "restaurantReservations", assetTable: "restaurants", assetType: "restaurant", assetIdField: "restaurantId" },
      { table: "accommodationBookings", assetTable: "accommodations", assetType: "accommodation", assetIdField: "accommodationId" },
      { table: "vehicleBookings", assetTable: "vehicles", assetType: "vehicle", assetIdField: "vehicleId" },
      { table: "packageBookings", assetTable: "packages", assetType: "package", assetIdField: "packageId" },
    ];

    for (const config of bookingTables) {
      const booking = await ctx.db
        .query(config.table as any)
        .filter((q: any) => q.eq(q.field("stripeCheckoutSessionId"), args.sessionId))
        .unique();

      if (booking) {
        // Get asset details
        let asset;
        const assetId = (booking as any)[config.assetIdField];
        
        if (assetId) {
          asset = await ctx.db.get(assetId);
        }

        const assetName = asset ? 
          ((asset as any).title || (asset as any).name || "Unknown") : 
          "Unknown Asset";
        
        const assetDescription = asset ? 
          ((asset as any).description || (asset as any).shortDescription || "") : 
          "";

        return {
          _id: booking._id,
          assetType: config.assetType,
          assetName,
          assetDescription,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalPrice: booking.totalPrice || 0,
          confirmationCode: booking.confirmationCode,
          customerInfo: booking.customerInfo,
          // Type-specific fields
          date: (booking as any).date,
          checkIn: (booking as any).checkIn,
          checkOut: (booking as any).checkOut,
          participants: (booking as any).participants,
          guests: (booking as any).guests,
          partySize: (booking as any).partySize,
          quantity: (booking as any).quantity,
          // Payment details
          stripePaymentIntentId: booking.stripePaymentIntentId,
          stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
          paymentDetails: booking.paymentDetails,
          refunds: booking.refunds,
          createdAt: booking._creationTime,
        };
      }
    }

    return null;
  },
});
