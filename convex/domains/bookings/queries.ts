import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { BOOKING_STATUS, PAYMENT_STATUS } from "./types";

/**
 * Get user's activity bookings
 */
export const getUserActivityBookings = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("activityBookings"),
      _creationTime: v.number(),
      activityId: v.id("activities"),
      activityTitle: v.string(),
      activityImageUrl: v.string(),
      date: v.string(),
      time: v.optional(v.string()),
      participants: v.number(),
      totalPrice: v.number(),
      couponCode: v.optional(v.string()),
      discountAmount: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      createdAt: v.number(),
      updatedAt: v.number(),
      userId: v.id("users"),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    let query = ctx.db
      .query("activityBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    if (args.status && typeof args.status === "string") {
      query = ctx.db
        .query("activityBookings")
        .withIndex("by_status", (q) => q.eq("status", args.status as string))
        .filter((q) => q.eq(q.field("userId"), user._id));
    }

    const result = await query.paginate(args.paginationOpts);

    const bookingsWithDetails = await Promise.all(
      result.page.map(async (booking) => {
        const activity = await ctx.db.get(booking.activityId);
        return {
          ...booking,
          createdAt: booking.createdAt ?? booking._creationTime,
          updatedAt: booking.updatedAt ?? booking._creationTime,
          activityTitle: activity?.title || "Atividade não encontrada",
          activityImageUrl: activity?.imageUrl || "",
        };
      })
    );

    return {
      page: bookingsWithDetails,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * Get user's event bookings
 */
export const getUserEventBookings = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("eventBookings"),
      _creationTime: v.number(),
      eventId: v.id("events"),
      eventTitle: v.string(),
      eventImageUrl: v.string(),
      eventDate: v.string(),
      eventTime: v.string(),
      eventLocation: v.string(),
      quantity: v.number(),
      totalPrice: v.number(),
      couponCode: v.optional(v.string()),
      discountAmount: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
      userId: v.id("users"),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    let query = ctx.db
      .query("eventBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    if (args.status && typeof args.status === "string") {
      query = ctx.db
        .query("eventBookings")
        .withIndex("by_status", (q) => q.eq("status", args.status as string))
        .filter((q) => q.eq(q.field("userId"), user._id));
    }

    const result = await query.paginate(args.paginationOpts);

    const bookingsWithDetails = await Promise.all(
      result.page.map(async (booking) => {
        const event = await ctx.db.get(booking.eventId);
        return {
          ...booking,
          createdAt: booking.createdAt ?? booking._creationTime,
          updatedAt: booking.updatedAt ?? booking._creationTime,
          eventTitle: event?.title || "Evento não encontrado",
          eventImageUrl: event?.imageUrl || "",
          eventDate: event?.date || "",
          eventTime: event?.time || "",
          eventLocation: event?.location || "",
        };
      })
    );

    return {
      page: bookingsWithDetails,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * Get user's restaurant reservations
 */
export const getUserRestaurantReservations = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("restaurantReservations"),
      _creationTime: v.number(),
      restaurantId: v.id("restaurants"),
      restaurantName: v.string(),
      restaurantImageUrl: v.string(),
      restaurantAddress: v.string(),
      date: v.string(),
      time: v.string(),
      partySize: v.number(),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      status: v.string(),
      confirmationCode: v.string(),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      // Coupon fields
      couponCode: v.optional(v.string()),
      discountAmount: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
      totalPrice: v.optional(v.number()),
      paymentStatus: v.optional(v.string()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
      userId: v.id("users"),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    let query = ctx.db
      .query("restaurantReservations")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    if (args.status && typeof args.status === "string") {
      query = ctx.db
        .query("restaurantReservations")
        .withIndex("by_status", (q) => q.eq("status", args.status as string))
        .filter((q) => q.eq(q.field("userId"), user._id));
    }

    const result = await query.paginate(args.paginationOpts);

    const reservationsWithDetails = await Promise.all(
      result.page.map(async (reservation) => {
        const restaurant = await ctx.db.get(reservation.restaurantId);
        return {
          ...reservation,
          createdAt: reservation.createdAt ?? reservation._creationTime,
          updatedAt: reservation.updatedAt ?? reservation._creationTime,
          restaurantName: restaurant?.name || "Restaurante não encontrado",
          restaurantImageUrl: restaurant?.mainImage || "",
          restaurantAddress: restaurant?.address ? 
            `${restaurant.address.street}, ${restaurant.address.neighborhood}` : "",
        };
      })
    );

    return {
      page: reservationsWithDetails,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * Get user's vehicle bookings
 */
export const getUserVehicleBookings = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("vehicleBookings"),
      _creationTime: v.number(),
      vehicleId: v.id("vehicles"),
      userId: v.id("users"),
      vehicleName: v.string(),
      vehicleBrand: v.string(),
      vehicleModel: v.string(),
      vehicleImageUrl: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      pickupLocation: v.optional(v.string()),
      returnLocation: v.optional(v.string()),
      notes: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.optional(v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      })),
      additionalDrivers: v.optional(v.number()),
      additionalOptions: v.optional(v.array(v.string())),
      partnerNotes: v.optional(v.string()),
      paymentMethod: v.optional(v.string()),
      // Coupon fields
      couponCode: v.optional(v.string()),
      discountAmount: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      refunds: v.optional(v.array(v.object({
        refundId: v.string(),
        amount: v.number(),
        reason: v.string(),
        status: v.string(),
        createdAt: v.number(),
        processedAt: v.optional(v.number()),
      }))),
      createdAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    let query = ctx.db
      .query("vehicleBookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id));

    if (args.status && typeof args.status === "string") {
      query = ctx.db
        .query("vehicleBookings")
        .withIndex("by_status", (q) => q.eq("status", args.status as string))
        .filter((q) => q.eq(q.field("userId"), user._id));
    }

    const result = await query.paginate(args.paginationOpts);

    const bookingsWithDetails = await Promise.all(
      result.page.map(async (booking) => {
        const vehicle = await ctx.db.get(booking.vehicleId);
        return {
          ...booking,
          createdAt: booking.createdAt ?? booking._creationTime,
          updatedAt: booking.updatedAt ?? booking._creationTime,
          vehicleName: vehicle?.name || "Veículo não encontrado",
          vehicleBrand: vehicle?.brand || "",
          vehicleModel: vehicle?.model || "",
          vehicleImageUrl: vehicle?.imageUrl || undefined,
        };
      })
    );

    return {
      page: bookingsWithDetails,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * Get booking by confirmation code
 */
export const getBookingByConfirmationCode = query({
  args: { 
    confirmationCode: v.string(),
    type: v.union(v.literal("activity"), v.literal("event"), v.literal("restaurant")),
  },
  returns: v.union(
    v.object({
      type: v.literal("activity"),
      booking: v.object({
        _id: v.id("activityBookings"),
        _creationTime: v.number(),
        activityTitle: v.string(),
        date: v.string(),
        time: v.optional(v.string()),
        participants: v.number(),
        totalPrice: v.number(),
        status: v.string(),
        confirmationCode: v.string(),
        customerInfo: v.object({
          name: v.string(),
          email: v.string(),
          phone: v.string(),
        }),
      }),
    }),
    v.object({
      type: v.literal("event"),
      booking: v.object({
        _id: v.id("eventBookings"),
        _creationTime: v.number(),
        eventTitle: v.string(),
        eventDate: v.string(),
        eventTime: v.string(),
        quantity: v.number(),
        totalPrice: v.number(),
        status: v.string(),
        confirmationCode: v.string(),
        customerInfo: v.object({
          name: v.string(),
          email: v.string(),
          phone: v.string(),
        }),
      }),
    }),
    v.object({
      type: v.literal("restaurant"),
      booking: v.object({
        _id: v.id("restaurantReservations"),
        _creationTime: v.number(),
        restaurantName: v.string(),
        date: v.string(),
        time: v.string(),
        partySize: v.number(),
        status: v.string(),
        confirmationCode: v.string(),
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    if (args.type === "activity") {
      const booking = await ctx.db
        .query("activityBookings")
        .withIndex("by_confirmation_code", (q) => q.eq("confirmationCode", args.confirmationCode))
        .unique();

      if (!booking) return null;

      const activity = await ctx.db.get(booking.activityId);
      
      return {
        type: "activity" as const,
        booking: {
          _id: booking._id,
          _creationTime: booking._creationTime,
          activityTitle: activity?.title || "Atividade não encontrada",
          date: booking.date,
          time: booking.time,
          participants: booking.participants,
          totalPrice: booking.totalPrice,
          status: booking.status,
          confirmationCode: booking.confirmationCode,
          customerInfo: booking.customerInfo,
        },
      };
    }

    if (args.type === "event") {
      const booking = await ctx.db
        .query("eventBookings")
        .withIndex("by_confirmation_code", (q) => q.eq("confirmationCode", args.confirmationCode))
        .unique();

      if (!booking) return null;

      const event = await ctx.db.get(booking.eventId);
      
      return {
        type: "event" as const,
        booking: {
          _id: booking._id,
          _creationTime: booking._creationTime,
          eventTitle: event?.title || "Evento não encontrado",
          eventDate: event?.date || "",
          eventTime: event?.time || "",
          quantity: booking.quantity,
          totalPrice: booking.totalPrice,
          status: booking.status,
          confirmationCode: booking.confirmationCode,
          customerInfo: booking.customerInfo,
        },
      };
    }

    if (args.type === "restaurant") {
      const reservation = await ctx.db
        .query("restaurantReservations")
        .filter((q) => q.eq(q.field("confirmationCode"), args.confirmationCode))
        .unique();

      if (!reservation) return null;

      const restaurant = await ctx.db.get(reservation.restaurantId);
      
      return {
        type: "restaurant" as const,
        booking: {
          _id: reservation._id,
          _creationTime: reservation._creationTime,
          restaurantName: restaurant?.name || "Restaurante não encontrado",
          date: reservation.date,
          time: reservation.time,
          partySize: reservation.partySize,
          status: reservation.status,
          confirmationCode: reservation.confirmationCode,
          name: reservation.name,
          email: reservation.email,
          phone: reservation.phone,
        },
      };
    }

    return null;
  },
});

/**
 * Get bookings for partners and employees
 */
export const getPartnerBookings = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    assetType: v.optional(v.union(v.literal("activities"), v.literal("events"), v.literal("restaurants"), v.literal("vehicles"))),
    status: v.optional(v.string()),
  },
  returns: v.object({
    activities: v.array(v.object({
      _id: v.id("activityBookings"),
      activityId: v.id("activities"),
      activityTitle: v.string(),
      date: v.string(),
      time: v.optional(v.string()),
      participants: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      partnerId: v.id("users"),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
    })),
    events: v.array(v.object({
      _id: v.id("eventBookings"),
      eventId: v.id("events"),
      eventTitle: v.string(),
      eventDate: v.string(),
      eventTime: v.string(),
      quantity: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      partnerId: v.id("users"),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
    })),
    restaurants: v.array(v.object({
      _id: v.id("restaurantReservations"),
      restaurantId: v.id("restaurants"),
      restaurantName: v.string(),
      date: v.string(),
      time: v.string(),
      partySize: v.number(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      partnerId: v.id("users"),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
    })),
    vehicles: v.array(v.object({
      _id: v.id("vehicleBookings"),
      vehicleId: v.id("vehicles"),
      vehicleName: v.string(),
      vehicleBrand: v.string(),
      vehicleModel: v.string(),
      startDate: v.number(),
      endDate: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.optional(v.string()),
      pickupLocation: v.optional(v.string()),
      returnLocation: v.optional(v.string()),
      notes: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      userId: v.id("users"),
      partnerId: v.id("users"),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
    })),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || (user.role !== "partner" && user.role !== "employee" && user.role !== "master")) {
      throw new Error("Acesso negado - apenas partners, employees e masters");
    }

    const result = {
      activities: [] as Array<{
        _id: any;
        activityId: any;
        activityTitle: string;
        date: string;
        time?: string;
        participants: number;
        totalPrice: number;
        status: string;
        paymentStatus?: string;
        confirmationCode: string;
        customerInfo: any;
        specialRequests?: string;
        partnerNotes?: string;
        partnerId: any;
        stripeCheckoutSessionId?: string;
        stripePaymentIntentId?: string;
        stripeCustomerId?: string;
        stripePaymentLinkId?: string;
        paymentDetails?: any;
      }>,
      events: [] as Array<{
        _id: any;
        eventId: any;
        eventTitle: string;
        eventDate: string;
        eventTime: string;
        quantity: number;
        totalPrice: number;
        status: string;
        paymentStatus?: string;
        confirmationCode: string;
        customerInfo: any;
        specialRequests?: string;
        partnerNotes?: string;
        partnerId: any;
        stripeCheckoutSessionId?: string;
        stripePaymentIntentId?: string;
        stripeCustomerId?: string;
        stripePaymentLinkId?: string;
        paymentDetails?: any;
      }>,
      restaurants: [] as Array<{
        _id: any;
        restaurantId: any;
        restaurantName: string;
        date: string;
        time: string;
        partySize: number;
        status: string;
        paymentStatus?: string;
        confirmationCode: string;
        name: string;
        email: string;
        phone: string;
        specialRequests?: string;
        partnerNotes?: string;
        partnerId: any;
        couponCode?: string;
        discountAmount?: number;
        finalAmount?: number;
        totalPrice?: number;
        stripeCheckoutSessionId?: string;
        stripePaymentIntentId?: string;
        stripeCustomerId?: string;
        stripePaymentLinkId?: string;
        paymentDetails?: any;
      }>,
      vehicles: [] as Array<{
        _id: any;
        vehicleId: any;
        vehicleName: string;
        vehicleBrand: string;
        vehicleModel: string;
        startDate: number;
        endDate: number;
        totalPrice: number;
        status: string;
        paymentStatus?: string;
        confirmationCode?: string;
        pickupLocation?: string;
        returnLocation?: string;
        notes?: string;
        partnerNotes?: string;
        customerInfo: any;
        userId: any;
        partnerId: any;
        stripeCheckoutSessionId?: string;
        stripePaymentIntentId?: string;
        stripeCustomerId?: string;
        stripePaymentLinkId?: string;
        paymentDetails?: any;
      }>,
    };

    // Get partner's activities bookings
    if (!args.assetType || args.assetType === "activities") {
      let activities;
      
      if (user.role === "master") {
        // Masters see ALL activities in the system
        activities = await ctx.db.query("activities").collect();
      } else if (user.role === "partner") {
        // Partners see only their own activities  
        activities = await ctx.db
          .query("activities")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
      } else if (user.role === "employee") {
        // Employees see activities they have permission to manage
        // (This logic will be more complex and should check assetPermissions)
        activities = []; // TODO: Implement employee permissions
      } else {
        activities = [];
      }

      for (const activity of activities) {
        let query = ctx.db
          .query("activityBookings")
          .withIndex("by_activity", (q) => q.eq("activityId", activity._id));

        if (args.status) {
          query = query.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await query.collect();
        
        result.activities.push(...bookings.map(booking => ({
          _id: booking._id,
          activityId: booking.activityId,
          activityTitle: activity.title,
          date: booking.date,
          time: booking.time,
          participants: booking.participants,
          totalPrice: booking.totalPrice,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          confirmationCode: booking.confirmationCode,
          customerInfo: booking.customerInfo,
          specialRequests: booking.specialRequests,
          partnerNotes: booking.partnerNotes,
          partnerId: activity.partnerId,
          stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          stripeCustomerId: booking.stripeCustomerId,
          stripePaymentLinkId: booking.stripePaymentLinkId,
          paymentDetails: booking.paymentDetails,
        })));
      }
    }

    // Get partner's events bookings
    if (!args.assetType || args.assetType === "events") {
      let events;
      
      if (user.role === "master") {
        // Masters see ALL events in the system
        events = await ctx.db.query("events").collect();
      } else if (user.role === "partner") {
        // Partners see only their own events
        events = await ctx.db
          .query("events")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
      } else if (user.role === "employee") {
        // Employees see events they have permission to manage
        // (This logic will be more complex and should check assetPermissions)
        events = []; // TODO: Implement employee permissions
      } else {
        events = [];
      }

      for (const event of events) {
        let query = ctx.db
          .query("eventBookings")
          .withIndex("by_event", (q) => q.eq("eventId", event._id));

        if (args.status) {
          query = query.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await query.collect();
        
        result.events.push(...bookings.map(booking => ({
          _id: booking._id,
          eventId: booking.eventId,
          eventTitle: event.title,
          eventDate: event.date,
          eventTime: event.time,
          quantity: booking.quantity,
          totalPrice: booking.totalPrice,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          confirmationCode: booking.confirmationCode,
          customerInfo: booking.customerInfo,
          specialRequests: booking.specialRequests,
          partnerNotes: booking.partnerNotes,
          partnerId: event.partnerId,
          stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          stripeCustomerId: booking.stripeCustomerId,
          stripePaymentLinkId: booking.stripePaymentLinkId,
          paymentDetails: booking.paymentDetails,
        })));
      }
    }

    // Get partner's restaurants reservations
    if (!args.assetType || args.assetType === "restaurants") {
      let restaurants;
      
      if (user.role === "master") {
        // Masters see ALL restaurants in the system
        restaurants = await ctx.db.query("restaurants").collect();
      } else if (user.role === "partner") {
        // Partners see only their own restaurants
        restaurants = await ctx.db
          .query("restaurants")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
      } else if (user.role === "employee") {
        // Employees see restaurants they have permission to manage
        // (This logic will be more complex and should check assetPermissions)
        restaurants = []; // TODO: Implement employee permissions
      } else {
        restaurants = [];
      }

      for (const restaurant of restaurants) {
        let query = ctx.db
          .query("restaurantReservations")
          .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id));

        if (args.status) {
          query = query.filter((q) => q.eq(q.field("status"), args.status));
        }

        const reservations = await query.collect();
        
        result.restaurants.push(...reservations.map(reservation => ({
          _id: reservation._id,
          restaurantId: reservation.restaurantId,
          restaurantName: restaurant.name,
          date: reservation.date,
          time: reservation.time,
          partySize: reservation.partySize,
          status: reservation.status,
          paymentStatus: reservation.paymentStatus,
          confirmationCode: reservation.confirmationCode,
          name: reservation.name,
          email: reservation.email,
          phone: reservation.phone,
          specialRequests: reservation.specialRequests,
          partnerNotes: reservation.partnerNotes,
          partnerId: restaurant.partnerId,
          couponCode: reservation.couponCode,
          discountAmount: reservation.discountAmount,
          finalAmount: reservation.finalAmount,
          totalPrice: reservation.totalPrice,
          stripeCheckoutSessionId: reservation.stripeCheckoutSessionId,
          stripePaymentIntentId: reservation.stripePaymentIntentId,
          stripeCustomerId: reservation.stripeCustomerId,
          stripePaymentLinkId: reservation.stripePaymentLinkId,
          paymentDetails: reservation.paymentDetails,
        })));
      }
    }

    // Get partner's vehicles reservations
    if (!args.assetType || args.assetType === "vehicles") {
      let vehicles;
      
      if (user.role === "master") {
        // Masters see ALL vehicles in the system
        vehicles = await ctx.db.query("vehicles").collect();
      } else if (user.role === "partner") {
        // Partners see only their own vehicles
        vehicles = await ctx.db
          .query("vehicles")
          .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
          .collect();
      } else if (user.role === "employee") {
        // Employees see vehicles they have permission to manage
        let accessibleVehicleIds: string[] = [];
        
        // 1. Check direct vehicle permissions
        const assetPermissions = await ctx.db
          .query("assetPermissions")
          .withIndex("by_employee_asset_type", (q) => q.eq("employeeId", user._id).eq("assetType", "vehicles"))
          .collect();
        
        const directVehicleIds = assetPermissions.map(p => p.assetId);
        accessibleVehicleIds.push(...directVehicleIds);
        
        // 2. Check organization permissions and get vehicles from those organizations
        const organizationPermissions = await ctx.db
          .query("organizationPermissions")
          .withIndex("by_employee", (q) => q.eq("employeeId", user._id))
          .collect();
        
                 for (const orgPermission of organizationPermissions) {
           // Check if employee has any meaningful permission for the organization
           const hasAnyPermission = orgPermission.permissions && orgPermission.permissions.length > 0;
           const hasSpecificPermission = orgPermission.permissions.some(p => 
             ["view", "edit", "manage", "full_access"].includes(p)
           );
           
           if (hasAnyPermission && hasSpecificPermission) {
             // Get all vehicles from this organization
             const organizationVehicles = await ctx.db
               .query("partnerAssets")
               .withIndex("by_organization_type", (q) => 
                 q.eq("organizationId", orgPermission.organizationId).eq("assetType", "vehicles")
               )
               .collect();
             
             const orgVehicleIds = organizationVehicles.map(asset => asset.assetId);
             accessibleVehicleIds.push(...orgVehicleIds);
           }
         }
        
        // Remove duplicates
        accessibleVehicleIds = [...new Set(accessibleVehicleIds)];
        
        vehicles = [];
        for (const vehicleId of accessibleVehicleIds) {
          const vehicle = await ctx.db.get(vehicleId as any);
          if (vehicle) {
            vehicles.push(vehicle);
          }
        }
      } else {
        vehicles = [];
      }

      for (const vehicle of vehicles) {
        let query = ctx.db
          .query("vehicleBookings")
          .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicle._id));

        if (args.status) {
          query = query.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await query.collect();
        
        for (const booking of bookings) {
          // Get user information for customerInfo
          const user = await ctx.db.get(booking.userId);
          
          result.vehicles.push({
            _id: booking._id,
            vehicleId: booking.vehicleId,
            vehicleName: vehicle.name,
            vehicleBrand: vehicle.brand,
            vehicleModel: vehicle.model,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalPrice: booking.totalPrice,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            confirmationCode: booking.confirmationCode,
            pickupLocation: booking.pickupLocation,
            returnLocation: booking.returnLocation,
            notes: booking.notes,
            partnerNotes: booking.partnerNotes,
            customerInfo: {
              name: user?.name || "Nome não disponível",
              email: user?.email || "Email não disponível",
              phone: user?.phone || "Telefone não disponível",
            },
            userId: booking.userId,
            partnerId: vehicle.ownerId,
            stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
            stripePaymentIntentId: booking.stripePaymentIntentId,
            stripeCustomerId: booking.stripeCustomerId,
            stripePaymentLinkId: booking.stripePaymentLinkId,
            paymentDetails: booking.paymentDetails,
          });
        }
      }
    }

    return result;
  },
});

/**
 * Get all activity bookings (admin only)
 */
export const getActivityBookings = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    organizationId: v.optional(v.id("partnerOrganizations")),
    activityId: v.optional(v.id("activities")),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("activityBookings"),
      _creationTime: v.number(),
      activityId: v.id("activities"),
      activityTitle: v.string(),
      date: v.string(),
      time: v.optional(v.string()),
      participants: v.number(),
      totalPrice: v.number(),
      couponCode: v.optional(v.string()),
      discountAmount: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      // Mercado Pago fields
      mpPaymentId: v.optional(v.string()),
      mpPreferenceId: v.optional(v.string()),
      mpPaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      createdAt: v.number(),
      updatedAt: v.number(),
      userId: v.id("users"),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || (user.role !== "admin" && user.role !== "partner" && user.role !== "master" && user.role !== "employee")) {
      throw new Error("Acesso negado - apenas admins, masters, partners e employees");
    }

    // Masters see all bookings without restrictions
    if (user.role === "master") {
      // Se activityId específico foi passado, filtra por ele
      if (args.activityId) {
        let activityQuery = ctx.db
          .query("activityBookings")
          .withIndex("by_activity", (q) => q.eq("activityId", args.activityId!));

        if (args.status && typeof args.status === "string") {
          activityQuery = activityQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await activityQuery.collect();
        const activity = await ctx.db.get(args.activityId);
        
        const bookingsWithDetails = await Promise.all(
          bookings.map(async (booking) => {
            return {
              _id: booking._id,
              _creationTime: booking._creationTime,
              activityId: booking.activityId,
              activityTitle: activity?.title || "Atividade não encontrada",
              date: booking.date,
              time: booking.time,
              participants: booking.participants,
              totalPrice: booking.totalPrice,
              couponCode: booking.couponCode,
              discountAmount: booking.discountAmount,
              finalAmount: booking.finalAmount,
              status: booking.status,
              paymentStatus: booking.paymentStatus,
              confirmationCode: booking.confirmationCode,
              customerInfo: booking.customerInfo,
              specialRequests: booking.specialRequests,
              partnerNotes: booking.partnerNotes,
              // Mercado Pago fields
              mpPaymentId: booking.mpPaymentId,
              mpPreferenceId: booking.mpPreferenceId,
              mpPaymentLinkId: booking.mpPaymentLinkId,
              paymentDetails: booking.paymentDetails,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              userId: booking.userId,
            };
          })
        );

        return {
          page: bookingsWithDetails,
          isDone: true,
          continueCursor: "",
        };
      }
      
      // Se organizationId foi passado, pode ser um ID de asset (bug na interface)
      // Vamos verificar se é um asset activity
      if (args.organizationId) {
        try {
          const activity = await ctx.db.get(args.organizationId as any);
          if (activity && 'title' in activity) {
            // É um asset activity, não uma organização
            let activityQuery = ctx.db
              .query("activityBookings")
              .withIndex("by_activity", (q) => q.eq("activityId", args.organizationId as any));

            if (args.status && typeof args.status === "string") {
              activityQuery = activityQuery.filter((q) => q.eq(q.field("status"), args.status));
            }

            const bookings = await activityQuery.collect();
            
            const bookingsWithDetails = await Promise.all(
              bookings.map(async (booking) => {
                return {
                  _id: booking._id,
                  _creationTime: booking._creationTime,
                  activityId: booking.activityId,
                  activityTitle: activity.title || "Atividade não encontrada",
                  date: booking.date,
                  time: booking.time,
                  participants: booking.participants,
                  totalPrice: booking.totalPrice,
                  couponCode: booking.couponCode,
                  discountAmount: booking.discountAmount,
                  finalAmount: booking.finalAmount,
                  status: booking.status,
                  paymentStatus: booking.paymentStatus,
                  confirmationCode: booking.confirmationCode,
                  customerInfo: booking.customerInfo,
                  specialRequests: booking.specialRequests,
                  partnerNotes: booking.partnerNotes,
                  // Mercado Pago fields
                  mpPaymentId: booking.mpPaymentId,
                  mpPreferenceId: booking.mpPreferenceId,
                  mpPaymentLinkId: booking.mpPaymentLinkId,
                  paymentDetails: booking.paymentDetails,
                  createdAt: booking.createdAt ?? booking._creationTime,
                  updatedAt: booking.updatedAt ?? booking._creationTime,
                  userId: booking.userId,
                };
              })
            );

            return {
              page: bookingsWithDetails,
              isDone: true,
              continueCursor: "",
            };
          }
        } catch (error) {
          // Não é um asset válido, continua com a lógica normal
        }
      }
      
      // Masters veem todas as reservas sem filtros
      let query = ctx.db.query("activityBookings").order("desc");

      if (args.status && typeof args.status === "string") {
        query = ctx.db
          .query("activityBookings")
          .withIndex("by_status", (q) => q.eq("status", args.status as string))
          .order("desc");
      }

      const result = await query.paginate(args.paginationOpts);

      const bookingsWithDetails = await Promise.all(
        result.page.map(async (booking) => {
          const activity = await ctx.db.get(booking.activityId) as any;
          return {
            _id: booking._id,
            _creationTime: booking._creationTime,
            activityId: booking.activityId,
            activityTitle: activity?.title || "Atividade não encontrada",
            date: booking.date,
            time: booking.time,
            participants: booking.participants,
            totalPrice: booking.totalPrice,
            couponCode: booking.couponCode,
            discountAmount: booking.discountAmount,
            finalAmount: booking.finalAmount,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            confirmationCode: booking.confirmationCode,
            customerInfo: booking.customerInfo,
            specialRequests: booking.specialRequests,
            partnerNotes: booking.partnerNotes,
            // Mercado Pago fields
            mpPaymentId: booking.mpPaymentId,
            mpPreferenceId: booking.mpPreferenceId,
            mpPaymentLinkId: booking.mpPaymentLinkId,
            paymentDetails: booking.paymentDetails,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            userId: booking.userId,
          };
        })
      );
      
      return {
        page: bookingsWithDetails,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }

    // For partners, only show bookings for their activities
    if (user.role === "partner") {
      // If specific activity is requested, check ownership first
      if (args.activityId) {
        const activity = await ctx.db.get(args.activityId);
        if (!activity || activity.partnerId.toString() !== user._id.toString()) {
          throw new Error("Você não tem permissão para ver as reservas desta atividade");
        }

        let activityQuery = ctx.db
          .query("activityBookings")
          .withIndex("by_activity", (q) => q.eq("activityId", args.activityId!));

        if (args.status && typeof args.status === "string") {
          activityQuery = activityQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await activityQuery.collect();
        const bookingsWithDetails = await Promise.all(
          bookings.map(async (booking) => {
            return {
              _id: booking._id,
              _creationTime: booking._creationTime,
              activityId: booking.activityId,
              activityTitle: activity.title,
              date: booking.date,
              time: booking.time,
              participants: booking.participants,
              totalPrice: booking.totalPrice,
              couponCode: booking.couponCode,
              discountAmount: booking.discountAmount,
              finalAmount: booking.finalAmount,
              status: booking.status,
              paymentStatus: booking.paymentStatus,
              confirmationCode: booking.confirmationCode,
              customerInfo: booking.customerInfo,
              specialRequests: booking.specialRequests,
              partnerNotes: booking.partnerNotes,
              // Mercado Pago fields
              mpPaymentId: booking.mpPaymentId,
              mpPreferenceId: booking.mpPreferenceId,
              mpPaymentLinkId: booking.mpPaymentLinkId,
              paymentDetails: booking.paymentDetails,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              userId: booking.userId,
            };
          })
        );

        return {
          page: bookingsWithDetails,
          isDone: true,
          continueCursor: "",
        };
      }

      // Get partner's activities, filtered by organization if specified
      let partnerActivities;
      
      if (args.organizationId) {
        // Busca assets da organização específica
        const organizationAssets = await ctx.db
          .query("partnerAssets")
          .withIndex("by_organization_type", (q) => 
            q.eq("organizationId", args.organizationId!).eq("assetType", "activities")
          )
          .collect();
        
        const assetIds = organizationAssets.map(asset => asset.assetId);
        
        // Filtra atividades que pertencem à organização
        const allPartnerActivities = await ctx.db
          .query("activities")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
        
        partnerActivities = allPartnerActivities.filter(activity => 
          assetIds.includes(activity._id)
        );
        
        // Se não encontrar atividades na organização, mas a organização existe,
        // mostra todas as atividades do partner (fallback)
        if (partnerActivities.length === 0) {
          const organization = await ctx.db.get(args.organizationId);
          if (organization && organization.partnerId.toString() === user._id.toString()) {
            partnerActivities = await ctx.db
              .query("activities")
              .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
              .collect();
          }
        }
      } else {
        // Sem filtro de organização, busca todas as atividades do partner
        partnerActivities = await ctx.db
          .query("activities")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
      }
      const activityIds = partnerActivities.map(a => a._id);

      let filteredBookings: any[] = [];
      for (const activityId of activityIds) {
        let activityQuery = ctx.db
          .query("activityBookings")
          .withIndex("by_activity", (q) => q.eq("activityId", activityId));

        if (args.status && typeof args.status === "string") {
          activityQuery = activityQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await activityQuery.collect();
        filteredBookings.push(...bookings);
      }

      // Sort by creation time
      filteredBookings.sort((a, b) => b._creationTime - a._creationTime);

      const bookingsWithDetails = await Promise.all(
        filteredBookings.map(async (booking) => {
          const activity = await ctx.db.get(booking.activityId) as any;
          return {
            _id: booking._id,
            _creationTime: booking._creationTime,
            activityId: booking.activityId,
            activityTitle: activity?.title || "Atividade não encontrada",
            date: booking.date,
            time: booking.time,
            participants: booking.participants,
            totalPrice: booking.totalPrice,
            couponCode: booking.couponCode,
            discountAmount: booking.discountAmount,
            finalAmount: booking.finalAmount,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            confirmationCode: booking.confirmationCode,
            customerInfo: booking.customerInfo,
            specialRequests: booking.specialRequests,
            partnerNotes: booking.partnerNotes,
            // Mercado Pago fields
            mpPaymentId: booking.mpPaymentId,
            mpPreferenceId: booking.mpPreferenceId,
            mpPaymentLinkId: booking.mpPaymentLinkId,
            paymentDetails: booking.paymentDetails,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            userId: booking.userId,
          };
        })
      );

      return {
        page: bookingsWithDetails,
        isDone: true,
        continueCursor: "",
      };
    }

    // Admin and master see all bookings, filtered by organization if specified
    if (args.organizationId) {
      // Busca assets da organização específica
      const organizationAssets = await ctx.db
        .query("partnerAssets")
        .withIndex("by_organization_type", (q) => 
          q.eq("organizationId", args.organizationId!).eq("assetType", "activities")
        )
        .collect();
      
      const assetIds = organizationAssets.map(asset => asset.assetId);
      
      if (assetIds.length === 0) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }
      
      let filteredBookings: any[] = [];
      for (const activityId of assetIds) {
        let activityQuery = ctx.db
          .query("activityBookings")
          .withIndex("by_activity", (q) => q.eq("activityId", activityId as any));

        if (args.status && typeof args.status === "string") {
          activityQuery = activityQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await activityQuery.collect();
        filteredBookings.push(...bookings);
      }
      
      // Sort by creation time
      filteredBookings.sort((a, b) => b._creationTime - a._creationTime);

      const bookingsWithDetails = await Promise.all(
        filteredBookings.map(async (booking) => {
          const activity = await ctx.db.get(booking.activityId) as any;
          return {
            _id: booking._id,
            _creationTime: booking._creationTime,
            activityId: booking.activityId,
            activityTitle: activity?.title || "Atividade não encontrada",
            date: booking.date,
            time: booking.time,
            participants: booking.participants,
            totalPrice: booking.totalPrice,
            couponCode: booking.couponCode,
            discountAmount: booking.discountAmount,
            finalAmount: booking.finalAmount,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            confirmationCode: booking.confirmationCode,
            customerInfo: booking.customerInfo,
            specialRequests: booking.specialRequests,
            partnerNotes: booking.partnerNotes,
            // Mercado Pago fields
            mpPaymentId: booking.mpPaymentId,
            mpPreferenceId: booking.mpPreferenceId,
            mpPaymentLinkId: booking.mpPaymentLinkId,
            paymentDetails: booking.paymentDetails,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            userId: booking.userId,
          };
        })
      );

      return {
        page: bookingsWithDetails,
        isDone: true,
        continueCursor: "",
      };
    } else {
      // Sem filtro de organização, busca todas as reservas
      let query = ctx.db.query("activityBookings").order("desc");

      if (args.status && typeof args.status === "string") {
        query = ctx.db
          .query("activityBookings")
          .withIndex("by_status", (q) => q.eq("status", args.status as string))
          .order("desc");
      }

      const result = await query.paginate(args.paginationOpts);

      const bookingsWithDetails = await Promise.all(
        result.page.map(async (booking) => {
          const activity = await ctx.db.get(booking.activityId) as any;
          return {
            _id: booking._id,
            _creationTime: booking._creationTime,
            activityId: booking.activityId,
            activityTitle: activity?.title || "Atividade não encontrada",
            date: booking.date,
            time: booking.time,
            participants: booking.participants,
            totalPrice: booking.totalPrice,
            couponCode: booking.couponCode,
            discountAmount: booking.discountAmount,
            finalAmount: booking.finalAmount,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            confirmationCode: booking.confirmationCode,
            customerInfo: booking.customerInfo,
            specialRequests: booking.specialRequests,
            partnerNotes: booking.partnerNotes,
            // Mercado Pago fields
            mpPaymentId: booking.mpPaymentId,
            mpPreferenceId: booking.mpPreferenceId,
            mpPaymentLinkId: booking.mpPaymentLinkId,
            paymentDetails: booking.paymentDetails,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            userId: booking.userId,
          };
        })
      );
      
      return {
        page: bookingsWithDetails,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }
  },
});

/**
 * Get all event bookings (admin only)
 */
export const getEventBookings = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    organizationId: v.optional(v.id("partnerOrganizations")),
    eventId: v.optional(v.id("events")),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("eventBookings"),
      _creationTime: v.number(),
      eventId: v.id("events"),
      eventTitle: v.string(),
      quantity: v.number(),
      totalPrice: v.number(),
      couponCode: v.optional(v.string()),
      discountAmount: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      createdAt: v.number(),
      updatedAt: v.number(),
      userId: v.id("users"),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || (user.role !== "admin" && user.role !== "partner" && user.role !== "master" && user.role !== "employee")) {
      throw new Error("Acesso negado - apenas admins, masters, partners e employees");
    }

    // Masters see all bookings without restrictions
    if (user.role === "master") {
      // Se eventId específico foi passado, filtra por ele
      if (args.eventId) {
        let eventQuery = ctx.db
          .query("eventBookings")
          .withIndex("by_event", (q) => q.eq("eventId", args.eventId!));

        if (args.status && typeof args.status === "string") {
          eventQuery = eventQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await eventQuery.collect();
        const event = await ctx.db.get(args.eventId);
        
        const bookingsWithDetails = await Promise.all(
          bookings.map(async (booking) => {
            return {
              ...booking,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              eventTitle: event?.title || "Evento não encontrado",
            };
          })
        );

        return {
          page: bookingsWithDetails,
          isDone: true,
          continueCursor: "",
        };
      }
      
      // Se organizationId foi passado, pode ser um ID de asset (bug na interface)
      // Vamos verificar se é um asset event
      if (args.organizationId) {
        try {
          const event = await ctx.db.get(args.organizationId as any);
          if (event && 'title' in event) {
            // É um asset event, não uma organização
            let eventQuery = ctx.db
              .query("eventBookings")
              .withIndex("by_event", (q) => q.eq("eventId", args.organizationId as any));

            if (args.status && typeof args.status === "string") {
              eventQuery = eventQuery.filter((q) => q.eq(q.field("status"), args.status));
            }

            const bookings = await eventQuery.collect();
            
            const bookingsWithDetails = await Promise.all(
              bookings.map(async (booking) => {
                return {
                  ...booking,
                  createdAt: booking.createdAt ?? booking._creationTime,
                  updatedAt: booking.updatedAt ?? booking._creationTime,
                  eventTitle: event.title || "Evento não encontrado",
                };
              })
            );

            return {
              page: bookingsWithDetails,
              isDone: true,
              continueCursor: "",
            };
          }
        } catch (error) {
          // Não é um asset válido, continua com a lógica normal
        }
      }
      
      // Masters veem todas as reservas sem filtros
      let query = ctx.db.query("eventBookings").order("desc");

      if (args.status && typeof args.status === "string") {
        query = ctx.db
          .query("eventBookings")
          .withIndex("by_status", (q) => q.eq("status", args.status as string))
          .order("desc");
      }

      const result = await query.paginate(args.paginationOpts);

      const bookingsWithDetails = await Promise.all(
        result.page.map(async (booking) => {
          const event = await ctx.db.get(booking.eventId);
          return {
            ...booking,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            eventTitle: event?.title || "Evento não encontrado",
          };
        })
      );
      
      return {
        page: bookingsWithDetails,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }

    // For partners, only show bookings for their events
    if (user.role === "partner") {
      // If specific event is requested, check ownership first
      if (args.eventId) {
        const event = await ctx.db.get(args.eventId);
        if (!event || event.partnerId.toString() !== user._id.toString()) {
          throw new Error("Você não tem permissão para ver as reservas deste evento");
        }

        let eventQuery = ctx.db
          .query("eventBookings")
          .withIndex("by_event", (q) => q.eq("eventId", args.eventId!));

        if (args.status && typeof args.status === "string") {
          eventQuery = eventQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await eventQuery.collect();
        const bookingsWithDetails = await Promise.all(
          bookings.map(async (booking) => {
            return {
              ...booking,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              eventTitle: event.title,
            };
          })
        );

        return {
          page: bookingsWithDetails,
          isDone: true,
          continueCursor: "",
        };
      }

      // Get partner's events, filtered by organization if specified
      let partnerEvents;
      
      if (args.organizationId) {
        // Busca assets da organização específica
        const organizationAssets = await ctx.db
          .query("partnerAssets")
          .withIndex("by_organization_type", (q) => 
            q.eq("organizationId", args.organizationId!).eq("assetType", "events")
          )
          .collect();
        
        const assetIds = organizationAssets.map(asset => asset.assetId);
        
        // Filtra eventos que pertencem à organização
        const allPartnerEvents = await ctx.db
          .query("events")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
        
        partnerEvents = allPartnerEvents.filter(event => 
          assetIds.includes(event._id)
        );
        
        // Se não encontrar eventos na organização, mas a organização existe,
        // mostra todos os eventos do partner (fallback)
        if (partnerEvents.length === 0) {
          const organization = await ctx.db.get(args.organizationId);
          if (organization && organization.partnerId.toString() === user._id.toString()) {
            partnerEvents = await ctx.db
              .query("events")
              .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
              .collect();
          }
        }
      } else {
        // Sem filtro de organização, busca todos os eventos do partner
        partnerEvents = await ctx.db
          .query("events")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
      }
      const eventIds = partnerEvents.map(e => e._id);

      let filteredBookings: any[] = [];
      for (const eventId of eventIds) {
        let eventQuery = ctx.db
          .query("eventBookings")
          .withIndex("by_event", (q) => q.eq("eventId", eventId));

        if (args.status && typeof args.status === "string") {
          eventQuery = eventQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await eventQuery.collect();
        filteredBookings.push(...bookings);
      }

      // Sort by creation time
      filteredBookings.sort((a, b) => b._creationTime - a._creationTime);

      const bookingsWithDetails = await Promise.all(
        filteredBookings.map(async (booking) => {
          const event = await ctx.db.get(booking.eventId) as any;
          return {
            ...booking,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            eventTitle: event?.title || "Evento não encontrado",
          };
        })
      );

      return {
        page: bookingsWithDetails,
        isDone: true,
        continueCursor: "",
      };
    }

    // Admin and master see all bookings, filtered by organization if specified
    if (args.organizationId) {
      // Busca assets da organização específica
      const organizationAssets = await ctx.db
        .query("partnerAssets")
        .withIndex("by_organization_type", (q) => 
          q.eq("organizationId", args.organizationId!).eq("assetType", "events")
        )
        .collect();
      
      const assetIds = organizationAssets.map(asset => asset.assetId);
      
      if (assetIds.length === 0) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }
      
      let filteredBookings: any[] = [];
      for (const eventId of assetIds) {
        let eventQuery = ctx.db
          .query("eventBookings")
          .withIndex("by_event", (q) => q.eq("eventId", eventId as any));

        if (args.status && typeof args.status === "string") {
          eventQuery = eventQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await eventQuery.collect();
        filteredBookings.push(...bookings);
      }
      
      // Sort by creation time
      filteredBookings.sort((a, b) => b._creationTime - a._creationTime);

      const bookingsWithDetails = await Promise.all(
        filteredBookings.map(async (booking) => {
          const event = await ctx.db.get(booking.eventId) as any;
          return {
            ...booking,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            eventTitle: event?.title || "Evento não encontrado",
          };
        })
      );

      return {
        page: bookingsWithDetails,
        isDone: true,
        continueCursor: "",
      };
    } else {
      // Sem filtro de organização, busca todas as reservas
      let query = ctx.db.query("eventBookings").order("desc");

      if (args.status && typeof args.status === "string") {
        query = ctx.db
          .query("eventBookings")
          .withIndex("by_status", (q) => q.eq("status", args.status as string))
          .order("desc");
      }

      const result = await query.paginate(args.paginationOpts);

      const bookingsWithDetails = await Promise.all(
        result.page.map(async (booking) => {
          const event = await ctx.db.get(booking.eventId);
          return {
            ...booking,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            eventTitle: event?.title || "Evento não encontrado",
          };
        })
      );
      
      return {
        page: bookingsWithDetails,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }
  },
});

/**
 * Get all restaurant reservations (admin only)
 */
export const getRestaurantReservations = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    organizationId: v.optional(v.id("partnerOrganizations")),
    restaurantId: v.optional(v.id("restaurants")),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("restaurantReservations"),
      _creationTime: v.number(),
      restaurantId: v.id("restaurants"),
      restaurantName: v.string(),
      userId: v.id("users"),
      date: v.string(),
      time: v.string(),
      partySize: v.number(),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      status: v.string(),
      confirmationCode: v.string(),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      tableId: v.optional(v.id("restaurantTables")),
      // Coupon fields
      couponCode: v.optional(v.string()),
      discountAmount: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
      totalPrice: v.optional(v.number()),
      paymentStatus: v.optional(v.string()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      // Timestamp fields
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || (user.role !== "admin" && user.role !== "partner" && user.role !== "master" && user.role !== "employee")) {
      throw new Error("Acesso negado - apenas admins, masters, partners e employees");
    }

    // Masters see all bookings without restrictions
    if (user.role === "master") {
      // Se restaurantId específico foi passado, filtra por ele
      if (args.restaurantId) {
        let restaurantQuery = ctx.db
          .query("restaurantReservations")
          .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId!));

        if (args.status && typeof args.status === "string") {
          restaurantQuery = restaurantQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const reservations = await restaurantQuery.collect();
        const restaurant = await ctx.db.get(args.restaurantId);
        
        const reservationsWithDetails = await Promise.all(
          reservations.map(async (reservation) => {
            return {
              ...reservation,
              createdAt: reservation.createdAt ?? reservation._creationTime,
              updatedAt: reservation.updatedAt ?? reservation._creationTime,
              restaurantName: restaurant?.name || "Restaurante não encontrado",
            };
          })
        );

        return {
          page: reservationsWithDetails,
          isDone: true,
          continueCursor: "",
        };
      }
      
      // Se organizationId foi passado, pode ser um ID de asset (bug na interface)
      // Vamos verificar se é um asset restaurant
      if (args.organizationId) {
        try {
          const restaurant = await ctx.db.get(args.organizationId as any);
          if (restaurant && 'name' in restaurant && 'cuisine' in restaurant) {
            // É um asset restaurant, não uma organização
            let restaurantQuery = ctx.db
              .query("restaurantReservations")
              .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.organizationId as any));

            if (args.status && typeof args.status === "string") {
              restaurantQuery = restaurantQuery.filter((q) => q.eq(q.field("status"), args.status));
            }

            const reservations = await restaurantQuery.collect();
            
            const reservationsWithDetails = await Promise.all(
              reservations.map(async (reservation) => {
                return {
                  ...reservation,
                  createdAt: reservation.createdAt ?? reservation._creationTime,
                  updatedAt: reservation.updatedAt ?? reservation._creationTime,
                  restaurantName: restaurant.name || "Restaurante não encontrado",
                };
              })
            );

            return {
              page: reservationsWithDetails,
              isDone: true,
              continueCursor: "",
            };
          }
        } catch (error) {
          // Não é um asset válido, continua com a lógica normal
        }
      }
      
      // Masters veem todas as reservas sem filtros
      let query = ctx.db.query("restaurantReservations").order("desc");

      if (args.status && typeof args.status === "string") {
        query = ctx.db
          .query("restaurantReservations")
          .withIndex("by_status", (q) => q.eq("status", args.status as string))
          .order("desc");
      }

      const result = await query.paginate(args.paginationOpts);

      const reservationsWithDetails = await Promise.all(
        result.page.map(async (reservation) => {
          const restaurant = await ctx.db.get(reservation.restaurantId);
          return {
            ...reservation,
            createdAt: reservation.createdAt ?? reservation._creationTime,
            updatedAt: reservation.updatedAt ?? reservation._creationTime,
            restaurantName: restaurant?.name || "Restaurante não encontrado",
          };
        })
      );
      
      return {
        page: reservationsWithDetails,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }

    // For partners, only show reservations for their restaurants
    if (user.role === "partner") {
      // If specific restaurant is requested, check ownership first
      if (args.restaurantId) {
        const restaurant = await ctx.db.get(args.restaurantId);
        if (!restaurant || restaurant.partnerId.toString() !== user._id.toString()) {
          throw new Error("Você não tem permissão para ver as reservas deste restaurante");
        }

        let restaurantQuery = ctx.db
          .query("restaurantReservations")
          .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId!));

        if (args.status && typeof args.status === "string") {
          restaurantQuery = restaurantQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const reservations = await restaurantQuery.collect();
        const reservationsWithDetails = await Promise.all(
          reservations.map(async (reservation) => {
            return {
              ...reservation,
              createdAt: reservation.createdAt ?? reservation._creationTime,
              updatedAt: reservation.updatedAt ?? reservation._creationTime,
              restaurantName: restaurant.name,
            };
          })
        );

        return {
          page: reservationsWithDetails,
          isDone: true,
          continueCursor: "",
        };
      }

      // Get partner's restaurants
      let partnerRestaurants;
      
      if (args.organizationId) {
        // Busca assets da organização específica
        const organizationAssets = await ctx.db
          .query("partnerAssets")
          .withIndex("by_organization_type", (q) => 
            q.eq("organizationId", args.organizationId!).eq("assetType", "restaurants")
          )
          .collect();
        
        const assetIds = organizationAssets.map(asset => asset.assetId);
        
        // Filtra restaurantes que pertencem à organização
        const allPartnerRestaurants = await ctx.db
          .query("restaurants")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
        
        partnerRestaurants = allPartnerRestaurants.filter(restaurant => 
          assetIds.includes(restaurant._id)
        );
      } else {
        // Get all partner restaurants if no organizationId is provided
        partnerRestaurants = await ctx.db
          .query("restaurants")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
      }

      const restaurantIds = partnerRestaurants.map(r => r._id);

      if (restaurantIds.length === 0) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }

      let filteredReservations: any[] = [];
      for (const restaurantId of restaurantIds) {
        let restaurantQuery = ctx.db
          .query("restaurantReservations")
          .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId));

        if (args.status && typeof args.status === "string") {
          restaurantQuery = restaurantQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const reservations = await restaurantQuery.collect();
        filteredReservations.push(...reservations);
      }

      // Sort by creation time
      filteredReservations.sort((a, b) => b._creationTime - a._creationTime);

      const reservationsWithDetails = await Promise.all(
        filteredReservations.map(async (reservation) => {
          const restaurant = await ctx.db.get(reservation.restaurantId) as any;
          return {
            ...reservation,
            createdAt: reservation.createdAt ?? reservation._creationTime,
            updatedAt: reservation.updatedAt ?? reservation._creationTime,
            restaurantName: restaurant?.name || "Restaurante não encontrado",
          };
        })
      );

      return {
        page: reservationsWithDetails,
        isDone: true,
        continueCursor: "",
      };
    }

    // Admin and master see all reservations
    let restaurantIds: any[] = [];
    
    // If organizationId is provided, filter by organization
    if (args.organizationId) {
      const organizationAssets = await ctx.db
        .query("partnerAssets")
        .withIndex("by_organization_type", (q) => 
          q.eq("organizationId", args.organizationId!).eq("assetType", "restaurants")
        )
        .collect();
        
      restaurantIds = organizationAssets.map(asset => asset.assetId);
      
      if (restaurantIds.length === 0) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }
    }
    
    let query;
    
    if (args.organizationId && restaurantIds.length > 0) {
      // If filtering by organization, we need to query each restaurant separately
      let filteredReservations: any[] = [];
      
      for (const restaurantId of restaurantIds) {
        let restaurantQuery = ctx.db
          .query("restaurantReservations")
          .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurantId));

        if (args.status && typeof args.status === "string") {
          restaurantQuery = restaurantQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const reservations = await restaurantQuery.collect();
        filteredReservations.push(...reservations);
      }
      
      // Sort by creation time
      filteredReservations.sort((a, b) => b._creationTime - a._creationTime);
      
      // Apply pagination manually
      const startIndex = 0;
      const endIndex = Math.min(startIndex + args.paginationOpts.numItems, filteredReservations.length);
      const paginatedReservations = filteredReservations.slice(startIndex, endIndex);
      
      const reservationsWithDetails = await Promise.all(
        paginatedReservations.map(async (reservation) => {
          const restaurant = await ctx.db.get(reservation.restaurantId) as any;
          return {
            ...reservation,
            createdAt: reservation.createdAt ?? reservation._creationTime,
            updatedAt: reservation.updatedAt ?? reservation._creationTime,
            restaurantName: restaurant?.name || "Restaurante não encontrado",
          };
        })
      );
      
      return {
        page: reservationsWithDetails,
        isDone: endIndex >= filteredReservations.length,
        continueCursor: endIndex >= filteredReservations.length ? "" : endIndex.toString(),
      };
    } else {
      // Use standard query if not filtering by organization
      query = ctx.db.query("restaurantReservations").order("desc");

      if (args.status && typeof args.status === "string") {
        query = ctx.db
          .query("restaurantReservations")
          .withIndex("by_status", (q) => q.eq("status", args.status as string))
          .order("desc");
      }

      const result = await query.paginate(args.paginationOpts);

      const reservationsWithDetails = await Promise.all(
        result.page.map(async (reservation) => {
          const restaurant = await ctx.db.get(reservation.restaurantId) as any;
          return {
            ...reservation,
            createdAt: reservation.createdAt ?? reservation._creationTime,
            updatedAt: reservation.updatedAt ?? reservation._creationTime,
            restaurantName: restaurant?.name || "Restaurante não encontrado",
          };
        })
      );

      return {
        page: reservationsWithDetails,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }
  },
});

/**
 * Get all vehicle bookings (admin only)
 */
export const getVehicleBookings = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    organizationId: v.optional(v.id("partnerOrganizations")),
    vehicleId: v.optional(v.id("vehicles")),
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("vehicleBookings"),
      _creationTime: v.number(),
      vehicleId: v.id("vehicles"),
      userId: v.id("users"),
      vehicleName: v.string(),
      vehicleBrand: v.string(),
      vehicleModel: v.string(),
      startDate: v.number(),
      endDate: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      pickupLocation: v.optional(v.string()),
      returnLocation: v.optional(v.string()),
      notes: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      additionalDrivers: v.optional(v.number()),
      additionalOptions: v.optional(v.array(v.string())),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      // Coupon fields
      couponCode: v.optional(v.string()),
      discountAmount: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || (user.role !== "admin" && user.role !== "partner" && user.role !== "master" && user.role !== "employee")) {
      throw new Error("Acesso negado - apenas admins, masters, partners e employees");
    }

    // Masters see all bookings without restrictions
    if (user.role === "master") {
      // Se vehicleId específico foi passado, filtra por ele
      if (args.vehicleId) {
        let vehicleQuery = ctx.db
          .query("vehicleBookings")
          .withIndex("by_vehicleId", (q) => q.eq("vehicleId", args.vehicleId!));

        if (args.status && typeof args.status === "string") {
          vehicleQuery = vehicleQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await vehicleQuery.collect();
        const vehicle = await ctx.db.get(args.vehicleId);
        
        const bookingsWithDetails = await Promise.all(
          bookings.map(async (booking) => {
            const user = await ctx.db.get(booking.userId);
            return {
              ...booking,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : "Veículo não encontrado",
              vehicleBrand: vehicle?.brand || "",
              vehicleModel: vehicle?.model || "",
              customerInfo: {
                name: booking.customerInfo?.name || user?.name || "Nome não disponível",
                email: booking.customerInfo?.email || user?.email || "Email não disponível",
                phone: booking.customerInfo?.phone || user?.phone || "Telefone não disponível",
              },
            };
          })
        );

        return {
          page: bookingsWithDetails,
          isDone: true,
          continueCursor: "",
        };
      }
      
      // Se organizationId foi passado, pode ser um ID de asset (bug na interface)
      // Vamos verificar se é um asset vehicle
      if (args.organizationId) {
        try {
          const vehicle = await ctx.db.get(args.organizationId as any);
          if (vehicle && 'brand' in vehicle && 'model' in vehicle) {
            // É um asset vehicle, não uma organização
            let vehicleQuery = ctx.db
              .query("vehicleBookings")
              .withIndex("by_vehicleId", (q) => q.eq("vehicleId", args.organizationId as any));

            if (args.status && typeof args.status === "string") {
              vehicleQuery = vehicleQuery.filter((q) => q.eq(q.field("status"), args.status));
            }

            const bookings = await vehicleQuery.collect();
            
            const bookingsWithDetails = await Promise.all(
              bookings.map(async (booking) => {
                const user = await ctx.db.get(booking.userId);
                return {
                  ...booking,
                  createdAt: booking.createdAt ?? booking._creationTime,
                  updatedAt: booking.updatedAt ?? booking._creationTime,
                  vehicleName: `${vehicle.brand} ${vehicle.model}` || "Veículo não encontrado",
                  vehicleBrand: vehicle?.brand || "",
                  vehicleModel: vehicle?.model || "",
                  customerInfo: {
                    name: booking.customerInfo?.name || user?.name || "Nome não disponível",
                    email: booking.customerInfo?.email || user?.email || "Email não disponível",
                    phone: booking.customerInfo?.phone || user?.phone || "Telefone não disponível",
                  },
                };
              })
            );

            return {
              page: bookingsWithDetails,
              isDone: true,
              continueCursor: "",
            };
          }
        } catch (error) {
          // Não é um asset válido, continua com a lógica normal
        }
      }
      
      // Masters veem todas as reservas sem filtros
      let query = ctx.db.query("vehicleBookings").order("desc");

      if (args.status && typeof args.status === "string") {
        query = ctx.db
          .query("vehicleBookings")
          .withIndex("by_status", (q) => q.eq("status", args.status as string))
          .order("desc");
      }

      const result = await query.paginate(args.paginationOpts);

      const bookingsWithDetails = await Promise.all(
        result.page.map(async (booking) => {
          const vehicle = await ctx.db.get(booking.vehicleId);
          const user = await ctx.db.get(booking.userId);
          return {
            ...booking,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : "Veículo não encontrado",
            vehicleBrand: vehicle?.brand || "",
            vehicleModel: vehicle?.model || "",
            customerInfo: {
              name: booking.customerInfo?.name || user?.name || "Nome não disponível",
              email: booking.customerInfo?.email || user?.email || "Email não disponível",
              phone: booking.customerInfo?.phone || user?.phone || "Telefone não disponível",
            },
          };
        })
      );
      
      return {
        page: bookingsWithDetails,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }

    // For partners, only show bookings for their vehicles
    if (user.role === "partner") {
      // If specific vehicle is requested, check ownership first
      if (args.vehicleId) {
        const vehicle = await ctx.db.get(args.vehicleId);
        if (!vehicle || !vehicle.ownerId || vehicle.ownerId.toString() !== user._id.toString()) {
          throw new Error("Você não tem permissão para ver as reservas deste veículo");
        }

        let vehicleQuery = ctx.db
          .query("vehicleBookings")
          .withIndex("by_vehicleId", (q) => q.eq("vehicleId", args.vehicleId!));

        if (args.status && typeof args.status === "string") {
          vehicleQuery = vehicleQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await vehicleQuery.collect();
                  const bookingsWithDetails = await Promise.all(
            bookings.map(async (booking) => {
              const user = await ctx.db.get(booking.userId);
              return {
                ...booking,
                createdAt: booking.createdAt ?? booking._creationTime,
                updatedAt: booking.updatedAt ?? booking._creationTime,
                vehicleName: vehicle.name,
                vehicleBrand: vehicle.brand,
                vehicleModel: vehicle.model,
                customerInfo: {
                  name: booking.customerInfo?.name || user?.name || "Nome não disponível",
                  email: booking.customerInfo?.email || user?.email || "Email não disponível", 
                  phone: booking.customerInfo?.phone || user?.phone || "Telefone não disponível",
                },
              };
            })
          );

        return {
          page: bookingsWithDetails,
          isDone: true,
          continueCursor: "",
        };
      }

      // Get partner's vehicles
      let partnerVehicles;
      
      if (args.organizationId) {
        // Busca assets da organização específica
        const organizationAssets = await ctx.db
          .query("partnerAssets")
          .withIndex("by_organization_type", (q) => 
            q.eq("organizationId", args.organizationId!).eq("assetType", "vehicles")
          )
          .collect();
        
        const assetIds = organizationAssets.map(asset => asset.assetId);
        
        // Filtra veículos que pertencem à organização
        const allPartnerVehicles = await ctx.db
          .query("vehicles")
          .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
          .collect();
        
        partnerVehicles = allPartnerVehicles.filter(vehicle => 
          assetIds.includes(vehicle._id)
        );
      } else {
        // Get all partner vehicles if no organizationId is provided
        partnerVehicles = await ctx.db
          .query("vehicles")
          .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
          .collect();
      }

      const vehicleIds = partnerVehicles.map(v => v._id);
      
      if (vehicleIds.length === 0) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }

      let filteredBookings: any[] = [];
      for (const vehicleId of vehicleIds) {
        let vehicleQuery = ctx.db
          .query("vehicleBookings")
          .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicleId));

        if (args.status && typeof args.status === "string") {
          vehicleQuery = vehicleQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await vehicleQuery.collect();
        filteredBookings.push(...bookings);
      }

      // Sort by creation time
      filteredBookings.sort((a, b) => b._creationTime - a._creationTime);

      const bookingsWithDetails = await Promise.all(
        filteredBookings.map(async (booking) => {
          const vehicle = await ctx.db.get(booking.vehicleId) as any;
          const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), booking.userId))
            .unique();
          return {
            ...booking,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            vehicleName: vehicle?.name || "Veículo não encontrado",
            vehicleBrand: vehicle?.brand || "",
            vehicleModel: vehicle?.model || "",
            customerInfo: {
              name: user?.name || "Nome não disponível",
              email: user?.email || "Email não disponível", 
              phone: user?.phone || "Telefone não disponível",
            },
          };
        })
      );

      return {
        page: bookingsWithDetails,
        isDone: true,
        continueCursor: "",
      };
    }

    // For employees, show bookings for vehicles they have permission to access
    if (user.role === "employee") {
      let accessibleVehicleIds: string[] = [];
      
      // 1. Check direct vehicle permissions
      const assetPermissions = await ctx.db
        .query("assetPermissions")
        .withIndex("by_employee_asset_type", (q) => 
          q.eq("employeeId", user._id).eq("assetType", "vehicles")
        )
        .collect();
      
      const directVehicleIds = assetPermissions
        .filter(p => p.permissions.includes("view") || p.permissions.includes("manage"))
        .map(p => p.assetId);
      
      accessibleVehicleIds.push(...directVehicleIds);
      
      // 2. Check organization permissions and get vehicles from those organizations
      const organizationPermissions = await ctx.db
        .query("organizationPermissions")
        .withIndex("by_employee", (q) => q.eq("employeeId", user._id))
        .collect();
      
      for (const orgPermission of organizationPermissions) {
        // Check if employee has any meaningful permission for the organization
        const hasAnyPermission = orgPermission.permissions && orgPermission.permissions.length > 0;
        const hasSpecificPermission = orgPermission.permissions.some(p => 
          ["view", "edit", "manage", "full_access"].includes(p)
        );
        
        if (hasAnyPermission && hasSpecificPermission) {
          // Get all vehicles from this organization
          const organizationVehicles = await ctx.db
            .query("partnerAssets")
            .withIndex("by_organization_type", (q) => 
              q.eq("organizationId", orgPermission.organizationId).eq("assetType", "vehicles")
            )
            .collect();
          
          const orgVehicleIds = organizationVehicles.map(asset => asset.assetId);
          accessibleVehicleIds.push(...orgVehicleIds);
        }
      }
      
      // Remove duplicates
      accessibleVehicleIds = [...new Set(accessibleVehicleIds)];
      
      if (accessibleVehicleIds.length === 0) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }

      let filteredBookings: any[] = [];
      for (const vehicleId of accessibleVehicleIds) {
        let vehicleQuery = ctx.db
          .query("vehicleBookings")
          .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicleId as any));

        if (args.status && typeof args.status === "string") {
          vehicleQuery = vehicleQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await vehicleQuery.collect();
        filteredBookings.push(...bookings);
      }

      // Sort by creation time
      filteredBookings.sort((a, b) => b._creationTime - a._creationTime);

      const bookingsWithDetails = await Promise.all(
        filteredBookings.map(async (booking) => {
          const vehicle = await ctx.db.get(booking.vehicleId) as any;
          const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), booking.userId))
            .unique();
          return {
            ...booking,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            vehicleName: vehicle?.name || "Veículo não encontrado",
            vehicleBrand: vehicle?.brand || "",
            vehicleModel: vehicle?.model || "",
            customerInfo: {
              name: user?.name || "Nome não disponível",
              email: user?.email || "Email não disponível", 
              phone: user?.phone || "Telefone não disponível",
            },
          };
        })
      );

      return {
        page: bookingsWithDetails,
        isDone: true,
        continueCursor: "",
      };
    }

    // Admin and master see all bookings
    let vehicleIds: any[] = [];
    
    // If organizationId is provided, filter by organization
    if (args.organizationId) {
      const organizationAssets = await ctx.db
        .query("partnerAssets")
        .withIndex("by_organization_type", (q) => 
          q.eq("organizationId", args.organizationId!).eq("assetType", "vehicles")
        )
        .collect();
        
      vehicleIds = organizationAssets.map(asset => asset.assetId);
      
      if (vehicleIds.length === 0) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }
    }
    
    let query;
    
    if (args.organizationId && vehicleIds.length > 0) {
      // If filtering by organization, we need to query each vehicle separately
      let filteredBookings: any[] = [];
      
      for (const vehicleId of vehicleIds) {
        let vehicleQuery = ctx.db
          .query("vehicleBookings")
          .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicleId));

        if (args.status && typeof args.status === "string") {
          vehicleQuery = vehicleQuery.filter((q) => q.eq(q.field("status"), args.status));
        }

        const bookings = await vehicleQuery.collect();
        filteredBookings.push(...bookings);
      }
      
      // Sort by creation time
      filteredBookings.sort((a, b) => b._creationTime - a._creationTime);
      
      // Apply pagination manually
      const startIndex = 0;
      const endIndex = Math.min(startIndex + args.paginationOpts.numItems, filteredBookings.length);
      const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
      
      const bookingsWithDetails = await Promise.all(
        paginatedBookings.map(async (booking) => {
          const vehicle = await ctx.db.get(booking.vehicleId) as any;
          const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), booking.userId))
            .unique();
          return {
            ...booking,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            vehicleName: vehicle?.name || "Veículo não encontrado",
            vehicleBrand: vehicle?.brand || "",
            vehicleModel: vehicle?.model || "",
            customerInfo: {
              name: booking.customerInfo?.name || user?.name || "Nome não disponível",
              email: booking.customerInfo?.email || user?.email || "Email não disponível",
              phone: booking.customerInfo?.phone || user?.phone || "Telefone não disponível",
            },
          };
        })
      );
      
      return {
        page: bookingsWithDetails,
        isDone: endIndex >= filteredBookings.length,
        continueCursor: endIndex >= filteredBookings.length ? "" : endIndex.toString(),
      };
    } else {
      // Use standard query if not filtering by organization
      query = ctx.db.query("vehicleBookings").order("desc");

      if (args.status && typeof args.status === "string") {
        query = ctx.db
          .query("vehicleBookings")
          .withIndex("by_status", (q) => q.eq("status", args.status as string))
          .order("desc");
      }

      const result = await query.paginate(args.paginationOpts);

      const bookingsWithDetails = await Promise.all(
        result.page.map(async (booking) => {
          const vehicle = await ctx.db.get(booking.vehicleId) as any;
          const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), booking.userId))
            .unique();
          return {
            ...booking,
            createdAt: booking.createdAt ?? booking._creationTime,
            updatedAt: booking.updatedAt ?? booking._creationTime,
            vehicleName: vehicle?.name || "Veículo não encontrado",
            vehicleBrand: vehicle?.brand || "",
            vehicleModel: vehicle?.model || "",
            customerInfo: {
              name: booking.customerInfo?.name || user?.name || "Nome não disponível",
              email: booking.customerInfo?.email || user?.email || "Email não disponível", 
              phone: booking.customerInfo?.phone || user?.phone || "Telefone não disponível",
            },
          };
        })
      );

      return {
        page: bookingsWithDetails,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }
  },
});

/**
 * Get activity booking by ID
 */
export const getActivityBookingById = query({
  args: {
    bookingId: v.id("activityBookings"),
  },
  returns: v.union(
    v.object({
      _id: v.id("activityBookings"),
      _creationTime: v.number(),
      activityId: v.id("activities"),
      userId: v.id("users"),
      date: v.string(),
      time: v.optional(v.string()),
      participants: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return null;
    }
    return {
      ...booking,
      createdAt: booking.createdAt ?? booking._creationTime,
      updatedAt: booking.updatedAt ?? booking._creationTime,
    };
  },
});

/**
 * Get event booking by ID
 */
export const getEventBookingById = query({
  args: {
    bookingId: v.id("eventBookings"),
  },
  returns: v.union(
    v.object({
      _id: v.id("eventBookings"),
      _creationTime: v.number(),
      eventId: v.id("events"),
      userId: v.id("users"),
      quantity: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return null;
    }
    return {
      ...booking,
      createdAt: booking.createdAt ?? booking._creationTime,
      updatedAt: booking.updatedAt ?? booking._creationTime,
    };
  },
});

/**
 * Get restaurant reservation by ID
 */
export const getRestaurantReservationById = query({
  args: {
    reservationId: v.id("restaurantReservations"),
  },
  returns: v.union(
    v.object({
      _id: v.id("restaurantReservations"),
      _creationTime: v.number(),
      restaurantId: v.id("restaurants"),
      userId: v.id("users"),
      date: v.string(),
      time: v.string(),
      partySize: v.number(),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      status: v.string(),
      confirmationCode: v.string(),
      specialRequests: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      tableId: v.optional(v.id("restaurantTables")),
      // Coupon fields
      couponCode: v.optional(v.string()),
      discountAmount: v.optional(v.number()),
      finalAmount: v.optional(v.number()),
      totalPrice: v.optional(v.number()),
      paymentStatus: v.optional(v.string()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      paymentDetails: v.optional(v.object({
        receiptUrl: v.optional(v.string()),
      })),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      return null;
    }
    return {
      ...reservation,
      createdAt: reservation.createdAt ?? reservation._creationTime,
      updatedAt: reservation.updatedAt ?? reservation._creationTime,
    };
  },
});

/**
 * Get vehicle booking by ID
 */
export const getVehicleBookingById = query({
  args: {
    bookingId: v.id("vehicleBookings"),
  },
  returns: v.union(
    v.object({
      _id: v.id("vehicleBookings"),
      _creationTime: v.number(),
      vehicleId: v.id("vehicles"),
      userId: v.id("users"),
      startDate: v.number(),
      endDate: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      pickupLocation: v.optional(v.string()),
      returnLocation: v.optional(v.string()),
      additionalDrivers: v.optional(v.number()),
      additionalOptions: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      partnerNotes: v.optional(v.string()),
      // Stripe integration fields
      stripeCheckoutSessionId: v.optional(v.string()),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCustomerId: v.optional(v.string()),
      stripePaymentLinkId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return null;
    }
    return {
      ...booking,
      createdAt: booking.createdAt ?? booking._creationTime,
      updatedAt: booking.updatedAt ?? booking._creationTime,
    };
  },
});

/**
 * Get bookings with RBAC filtering
 * - Traveler: Only their own bookings
 * - Partner: Only bookings for their own assets
 * - Employee: Only bookings for assets they're assigned to
 * - Master: All bookings
 */
export const getBookingsWithRBAC = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    bookingType: v.optional(v.union(
      v.literal("activity"), 
      v.literal("event"), 
      v.literal("restaurant"), 
      v.literal("vehicle")
    )),
  },
  returns: v.object({
    bookings: v.array(v.object({
      _id: v.string(),
      _creationTime: v.number(),
      type: v.string(),
      assetId: v.string(),
      assetName: v.string(),
      customerName: v.string(),
      customerEmail: v.string(),
      totalPrice: v.number(),
      status: v.string(),
      confirmationCode: v.string(),
      date: v.optional(v.string()),
      time: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
      canManage: v.boolean(), // Whether current user can manage this booking
      // Additional fields for different booking types
      participants: v.optional(v.number()),
      quantity: v.optional(v.number()),
      partySize: v.optional(v.number()),
      guests: v.optional(v.number()),
      seats: v.optional(v.number()),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      checkInDate: v.optional(v.string()),
      checkOutDate: v.optional(v.string()),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
    totalCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const allBookings: any[] = [];
    let totalCount = 0;

    // Helper function to check if user can manage a booking based on asset ownership
    const canUserManageAsset = async (assetId: string, assetType: string): Promise<boolean> => {
      if (user.role === "master") return true;
      
      let asset;
      switch (assetType) {
        case "activity":
          asset = await ctx.db.get(assetId as any);
          return user.role === "partner" && asset?.partnerId === user._id;
        case "event":
          asset = await ctx.db.get(assetId as any);
          return user.role === "partner" && asset?.partnerId === user._id;
        case "restaurant":
          asset = await ctx.db.get(assetId as any);
          return user.role === "partner" && asset?.partnerId === user._id;
        case "vehicle":
          asset = await ctx.db.get(assetId as any);
          return user.role === "partner" && asset?.ownerId === user._id;
        default:
          return false;
      }
    };

    // Fetch activity bookings based on role
    if (!args.bookingType || args.bookingType === "activity") {
      // Apply role-based filtering
      if (user.role === "traveler") {
        const activityBookings = await ctx.db
          .query("activityBookings")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        
        for (const booking of activityBookings) {
          const activity = await ctx.db.get(booking.activityId);
          if (activity) {
            allBookings.push({
              _id: booking._id,
              _creationTime: booking._creationTime,
              type: "activity",
              assetId: booking.activityId,
              assetName: activity.title,
              customerName: booking.customerInfo.name,
              customerEmail: booking.customerInfo.email,
              totalPrice: booking.totalPrice,
              status: booking.status,
              confirmationCode: booking.confirmationCode,
              date: booking.date,
              time: booking.time,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              canManage: false,
              participants: booking.participants,
            });
          }
        }
      } else if (user.role === "partner") {
        // Get activities owned by partner
        const ownedActivities = await ctx.db
          .query("activities")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
        
        for (const activity of ownedActivities) {
          const bookings = await ctx.db
            .query("activityBookings")
            .withIndex("by_activity", (q) => q.eq("activityId", activity._id))
            .collect();
          
          for (const booking of bookings) {
            allBookings.push({
              _id: booking._id,
              _creationTime: booking._creationTime,
              type: "activity",
              assetId: booking.activityId,
              assetName: activity.title,
              customerName: booking.customerInfo.name,
              customerEmail: booking.customerInfo.email,
              totalPrice: booking.totalPrice,
              status: booking.status,
              confirmationCode: booking.confirmationCode,
              date: booking.date,
              time: booking.time,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              canManage: true,
              participants: booking.participants,
            });
          }
        }
      } else if (user.role === "master") {
        const masterBookings = await ctx.db.query("activityBookings").collect();
        for (const booking of masterBookings) {
          const activity = await ctx.db.get(booking.activityId);
          if (activity) {
            allBookings.push({
              _id: booking._id,
              _creationTime: booking._creationTime,
              type: "activity",
              assetId: booking.activityId,
              assetName: activity.title,
              customerName: booking.customerInfo.name,
              customerEmail: booking.customerInfo.email,
              totalPrice: booking.totalPrice,
              status: booking.status,
              confirmationCode: booking.confirmationCode,
              date: booking.date,
              time: booking.time,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              canManage: true,
              participants: booking.participants,
            });
          }
        }
      }
    }

    // Fetch event bookings based on role
    if (!args.bookingType || args.bookingType === "event") {
      // Apply role-based filtering
      if (user.role === "traveler") {
        const eventBookings = await ctx.db
          .query("eventBookings")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        
        for (const booking of eventBookings) {
          const event = await ctx.db.get(booking.eventId);
          if (event) {
            allBookings.push({
              _id: booking._id,
              _creationTime: booking._creationTime,
              type: "event",
              assetId: booking.eventId,
              assetName: event.title,
              customerName: booking.customerInfo.name,
              customerEmail: booking.customerInfo.email,
              totalPrice: booking.totalPrice,
              status: booking.status,
              confirmationCode: booking.confirmationCode,
              date: event.date,
              time: event.time,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              canManage: false,
              quantity: booking.quantity,
            });
          }
        }
      } else if (user.role === "partner") {
        // Get events owned by partner
        const ownedEvents = await ctx.db
          .query("events")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
        
        for (const event of ownedEvents) {
          const bookings = await ctx.db
            .query("eventBookings")
            .withIndex("by_event", (q) => q.eq("eventId", event._id))
            .collect();
          
          for (const booking of bookings) {
            allBookings.push({
              _id: booking._id,
              _creationTime: booking._creationTime,
              type: "event",
              assetId: booking.eventId,
              assetName: event.title,
              customerName: booking.customerInfo.name,
              customerEmail: booking.customerInfo.email,
              totalPrice: booking.totalPrice,
              status: booking.status,
              confirmationCode: booking.confirmationCode,
              date: event.date,
              time: event.time,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              canManage: true,
              quantity: booking.quantity,
            });
          }
        }
      } else if (user.role === "master") {
        const masterBookings = await ctx.db.query("eventBookings").collect();
        for (const booking of masterBookings) {
          const event = await ctx.db.get(booking.eventId);
          if (event) {
            allBookings.push({
              _id: booking._id,
              _creationTime: booking._creationTime,
              type: "event",
              assetId: booking.eventId,
              assetName: event.title,
              customerName: booking.customerInfo.name,
              customerEmail: booking.customerInfo.email,
              totalPrice: booking.totalPrice,
              status: booking.status,
              confirmationCode: booking.confirmationCode,
              date: event.date,
              time: event.time,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              canManage: true,
              quantity: booking.quantity,
            });
          }
        }
      }
    }

    // Fetch restaurant reservations based on role
    if (!args.bookingType || args.bookingType === "restaurant") {
      // Apply role-based filtering
      if (user.role === "traveler") {
        const restaurantReservations = await ctx.db
          .query("restaurantReservations")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        
        for (const reservation of restaurantReservations) {
          const restaurant = await ctx.db.get(reservation.restaurantId);
          if (restaurant) {
            allBookings.push({
              _id: reservation._id,
              _creationTime: reservation._creationTime,
              type: "restaurant",
              assetId: reservation.restaurantId,
              assetName: restaurant.name,
              customerName: reservation.name,
              customerEmail: reservation.email,
              totalPrice: 0, // Restaurant reservations don't have totalPrice
              status: reservation.status,
              confirmationCode: reservation.confirmationCode,
              date: reservation.date,
              time: reservation.time,
              createdAt: reservation.createdAt ?? reservation._creationTime,
              updatedAt: reservation.updatedAt ?? reservation._creationTime,
              canManage: false,
              partySize: reservation.partySize,
            });
          }
        }
      } else if (user.role === "partner") {
        // Get restaurants owned by partner
        const ownedRestaurants = await ctx.db
          .query("restaurants")
          .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
          .collect();
        
        for (const restaurant of ownedRestaurants) {
          const reservations = await ctx.db
            .query("restaurantReservations")
            .withIndex("by_restaurant", (q) => q.eq("restaurantId", restaurant._id))
            .collect();
          
          for (const reservation of reservations) {
            allBookings.push({
              _id: reservation._id,
              _creationTime: reservation._creationTime,
              type: "restaurant",
              assetId: reservation.restaurantId,
              assetName: restaurant.name,
              customerName: reservation.name,
              customerEmail: reservation.email,
              totalPrice: 0, // Restaurant reservations don't have totalPrice
              status: reservation.status,
              confirmationCode: reservation.confirmationCode,
              date: reservation.date,
              time: reservation.time,
              createdAt: reservation.createdAt ?? reservation._creationTime,
              updatedAt: reservation.updatedAt ?? reservation._creationTime,
              canManage: true,
              partySize: reservation.partySize,
            });
          }
        }
      } else if (user.role === "master") {
        const masterReservations = await ctx.db.query("restaurantReservations").collect();
        for (const reservation of masterReservations) {
          const restaurant = await ctx.db.get(reservation.restaurantId);
          if (restaurant) {
            allBookings.push({
              _id: reservation._id,
              _creationTime: reservation._creationTime,
              type: "restaurant",
              assetId: reservation.restaurantId,
              assetName: restaurant.name,
              customerName: reservation.name,
              customerEmail: reservation.email,
              totalPrice: 0, // Restaurant reservations don't have totalPrice
              status: reservation.status,
              confirmationCode: reservation.confirmationCode,
              date: reservation.date,
              time: reservation.time,
              createdAt: reservation.createdAt ?? reservation._creationTime,
              updatedAt: reservation.updatedAt ?? reservation._creationTime,
              canManage: true,
              partySize: reservation.partySize,
            });
          }
        }
      }
    }

    // Fetch vehicle bookings based on role
    if (!args.bookingType || args.bookingType === "vehicle") {
      // Apply role-based filtering
      if (user.role === "traveler") {
        const vehicleBookings = await ctx.db
          .query("vehicleBookings")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .collect();
        
        for (const booking of vehicleBookings) {
          const vehicle = await ctx.db.get(booking.vehicleId);
          if (vehicle) {
            allBookings.push({
              _id: booking._id,
              _creationTime: booking._creationTime,
              type: "vehicle",
              assetId: booking.vehicleId,
              assetName: vehicle.name,
              customerName: user.name ?? "N/A",
              customerEmail: user.email ?? "N/A",
              totalPrice: booking.totalPrice,
              status: booking.status,
              confirmationCode: booking.confirmationCode || "N/A",
              date: new Date(booking.startDate).toLocaleDateString(),
              time: "",
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              canManage: false,
              startDate: new Date(booking.startDate).toISOString(),
              endDate: new Date(booking.endDate).toISOString(),
              seats: vehicle.seats,
            });
          }
        }
      } else if (user.role === "partner") {
        // Get vehicles owned by partner
        const ownedVehicles = await ctx.db
          .query("vehicles")
          .withIndex("by_ownerId", (q) => q.eq("ownerId", user._id))
          .collect();
        
        for (const vehicle of ownedVehicles) {
          const bookings = await ctx.db
            .query("vehicleBookings")
            .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicle._id))
            .collect();
          
          for (const booking of bookings) {
            allBookings.push({
              _id: booking._id,
              _creationTime: booking._creationTime,
              type: "vehicle",
              assetId: booking.vehicleId,
              assetName: vehicle.name,
              customerName: booking.customerInfo?.name || "Cliente", 
              customerEmail: booking.customerInfo?.email || "cliente@email.com",
              totalPrice: booking.totalPrice,
              status: booking.status,
              confirmationCode: booking.confirmationCode || booking._id.toString(),
              date: new Date(booking.startDate).toISOString().split('T')[0],
              time: undefined,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              canManage: true,
              startDate: new Date(booking.startDate).toISOString(),
              endDate: new Date(booking.endDate).toISOString(),
              seats: vehicle.seats,
            });
          }
        }
      } else if (user.role === "master") {
        const masterBookings = await ctx.db.query("vehicleBookings").collect();
        for (const booking of masterBookings) {
          const vehicle = await ctx.db.get(booking.vehicleId);
          if (vehicle) {
            allBookings.push({
              _id: booking._id,
              _creationTime: booking._creationTime,
              type: "vehicle",
              assetId: booking.vehicleId,
              assetName: vehicle.name,
              customerName: booking.customerInfo?.name || "Cliente", 
              customerEmail: booking.customerInfo?.email || "cliente@email.com",
              totalPrice: booking.totalPrice,
              status: booking.status,
              confirmationCode: booking.confirmationCode || booking._id.toString(),
              date: new Date(booking.startDate).toISOString().split('T')[0],
              time: undefined,
              createdAt: booking.createdAt ?? booking._creationTime,
              updatedAt: booking.updatedAt ?? booking._creationTime,
              canManage: true,
              startDate: new Date(booking.startDate).toISOString(),
              endDate: new Date(booking.endDate).toISOString(),
              seats: vehicle.seats,
            });
          }
        }
      }
    }

    // Apply status filter if provided
    const filteredBookings = args.status 
      ? allBookings.filter(booking => booking.status === args.status)
      : allBookings;

    // Sort by creation time (newest first)
    filteredBookings.sort((a, b) => b.createdAt - a.createdAt);
    
    totalCount = filteredBookings.length;

    // Apply pagination
    const startIndex = args.paginationOpts.cursor ? 
      parseInt(args.paginationOpts.cursor) : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
    const isDone = endIndex >= filteredBookings.length;
    const continueCursor = isDone ? "" : endIndex.toString();

    return {
      bookings: paginatedBookings,
      isDone,
      continueCursor,
      totalCount,
    };
  },
});

/**
 * Get user's own reservations (for traveler dashboard)
 */
export const getUserReservations = query({
  args: {},
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    name: v.string(),
    date: v.optional(v.string()),
    checkIn: v.optional(v.string()),
    checkOut: v.optional(v.string()),
    guests: v.optional(v.number()),
    status: v.string(),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    confirmationCode: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const reservations: any[] = [];

    // Get activity bookings
    const activityBookings = await ctx.db
      .query("activityBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const booking of activityBookings) {
      const activity = await ctx.db.get(booking.activityId);
      if (activity) {
        reservations.push({
          id: booking._id,
          type: "activity",
          name: activity.title,
          date: booking.date,
          guests: booking.participants,
          status: booking.status,
          location: "Fernando de Noronha",
          imageUrl: activity.imageUrl,
          confirmationCode: booking.confirmationCode,
        });
      }
    }

    // Get event bookings
    const eventBookings = await ctx.db
      .query("eventBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const booking of eventBookings) {
      const event = await ctx.db.get(booking.eventId);
      if (event) {
        reservations.push({
          id: booking._id,
          type: "event",
          name: event.title,
          date: event.date,
          guests: booking.quantity,
          status: booking.status,
          location: event.location,
          imageUrl: event.imageUrl,
          confirmationCode: booking.confirmationCode,
        });
      }
    }

    // Get restaurant reservations
    const restaurantReservations = await ctx.db
      .query("restaurantReservations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const reservation of restaurantReservations) {
      const restaurant = await ctx.db.get(reservation.restaurantId);
      if (restaurant) {
        reservations.push({
          id: reservation._id,
          type: "restaurant",
          name: restaurant.name,
          date: reservation.date,
          guests: reservation.partySize,
          status: reservation.status,
          location: restaurant.address?.city || "Fernando de Noronha",
          imageUrl: restaurant.mainImage,
          confirmationCode: reservation.confirmationCode,
        });
      }
    }

    // Get vehicle bookings
    const vehicleBookings = await ctx.db
      .query("vehicleBookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const booking of vehicleBookings) {
      const vehicle = await ctx.db.get(booking.vehicleId);
      if (vehicle) {
        reservations.push({
          id: booking._id,
          type: "vehicle",
          name: `${vehicle.brand} ${vehicle.model}`,
          checkIn: new Date(booking.startDate).toISOString(),
          checkOut: new Date(booking.endDate).toISOString(),
          status: booking.status,
          location: "Fernando de Noronha",
          imageUrl: vehicle.imageUrl,
          confirmationCode: booking._id, // Use booking ID as fallback for vehicles
        });
      }
    }

    // Sort by creation time (newest first)
    return reservations.sort((a, b) => new Date(b.date || b.checkIn || 0).getTime() - new Date(a.date || a.checkIn || 0).getTime());
  },
});

/**
 * Get user statistics for dashboard
 */
export const getUserStats = query({
  args: {},
  returns: v.object({
    totalReservations: v.number(),
    activeReservations: v.number(),
    totalSpent: v.number(),
    favoriteLocations: v.array(v.string()),
    completedTrips: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        totalReservations: 0,
        activeReservations: 0,
        totalSpent: 0,
        favoriteLocations: [],
        completedTrips: 0,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return {
        totalReservations: 0,
        activeReservations: 0,
        totalSpent: 0,
        favoriteLocations: [],
        completedTrips: 0,
      };
    }

    // Count all reservations for the user
    const [activityBookings, eventBookings, restaurantReservations, vehicleBookings] = await Promise.all([
      ctx.db.query("activityBookings").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("eventBookings").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("restaurantReservations").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("vehicleBookings").withIndex("by_userId", (q) => q.eq("userId", user._id)).collect(),
    ]);

    const totalReservations = activityBookings.length + eventBookings.length + restaurantReservations.length + vehicleBookings.length;
    
    const activeReservations = [
      ...activityBookings.filter(b => 
        b.status === "confirmed" || 
        b.status === "pending" || 
        b.status === "awaiting_confirmation" || 
        b.status === "payment_pending" ||
        b.status === "in_progress"
      ),
      ...eventBookings.filter(b => 
        b.status === "confirmed" || 
        b.status === "pending" || 
        b.status === "awaiting_confirmation" || 
        b.status === "payment_pending" ||
        b.status === "in_progress"
      ),
      ...restaurantReservations.filter(b => 
        b.status === "confirmed" || 
        b.status === "pending" || 
        b.status === "awaiting_confirmation" || 
        b.status === "payment_pending" ||
        b.status === "in_progress"
      ),
      ...vehicleBookings.filter(b => 
        b.status === "confirmed" || 
        b.status === "pending" || 
        b.status === "awaiting_confirmation" || 
        b.status === "payment_pending" ||
        b.status === "in_progress"
      ),
    ].length;

    const totalSpent = [
      ...activityBookings.filter(b => b.status === "confirmed"),
      ...eventBookings.filter(b => b.status === "confirmed"),
    ].reduce((sum, booking) => sum + booking.totalPrice, 0);

    const completedTrips = [
      ...activityBookings.filter(b => b.status === "completed"),
      ...eventBookings.filter(b => b.status === "completed"),
      ...restaurantReservations.filter(b => b.status === "completed"),
      ...vehicleBookings.filter(b => b.status === "completed"),
    ].length;

    return {
      totalReservations,
      activeReservations,
      totalSpent,
      favoriteLocations: ["Fernando de Noronha", "Vila dos Remédios"],
      completedTrips,
    };
  },
});

/**
 * Get reservation details with partner information (for contact feature)
 */
export const getReservationWithPartnerDetails = query({
  args: {
    reservationId: v.string(),
    reservationType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("accommodation")
    ),
  },
  returns: v.union(
    v.object({
      _id: v.string(),
      _creationTime: v.number(),
      type: v.string(),
      assetId: v.string(),
      assetName: v.string(),
      userId: v.id("users"),
      status: v.string(),
      confirmationCode: v.string(),
      // Partner information
      partnerId: v.id("users"),
      partnerName: v.optional(v.string()),
      partnerEmail: v.optional(v.string()),
      // Asset information for context
      assetType: v.string(),
      // Customer info (for verification)
      customerName: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    let reservation: any = null;
    let asset: any = null;
    let partner: any = null;

    // Get reservation based on type
    switch (args.reservationType) {
      case "activity":
        reservation = await ctx.db.get(args.reservationId as Id<"activityBookings">);
        if (reservation) {
          asset = await ctx.db.get(reservation.activityId);
          if (asset) {
            partner = await ctx.db.get(asset.partnerId);
          }
        }
        break;

      case "event":
        reservation = await ctx.db.get(args.reservationId as Id<"eventBookings">);
        if (reservation) {
          asset = await ctx.db.get(reservation.eventId);
          if (asset) {
            partner = await ctx.db.get(asset.partnerId);
          }
        }
        break;

      case "restaurant":
        reservation = await ctx.db.get(args.reservationId as Id<"restaurantReservations">);
        if (reservation) {
          asset = await ctx.db.get(reservation.restaurantId);
          if (asset) {
            partner = await ctx.db.get(asset.partnerId);
          }
        }
        break;

      case "vehicle":
        reservation = await ctx.db.get(args.reservationId as Id<"vehicleBookings">);
        if (reservation) {
          asset = await ctx.db.get(reservation.vehicleId);
          if (asset) {
            partner = await ctx.db.get(asset.ownerId);
          }
        }
        break;


      default:
        return null;
    }

    if (!reservation || !asset || !partner) {
      return null;
    }

    // Verify that the current user owns this reservation
    if (reservation.userId !== user._id) {
      throw new Error("Você não tem permissão para ver esta reserva");
    }

    // Get asset name based on type
    const assetName = asset.name || asset.title || `${asset.brand} ${asset.model}` || "Asset";
    
    // Get customer name based on reservation type
    const customerName = reservation.customerInfo?.name || reservation.name || "Cliente";

    // Get confirmation code - use reservation ID as fallback for vehicle bookings
    const confirmationCode = reservation.confirmationCode || reservation._id;

    return {
      _id: reservation._id,
      _creationTime: reservation._creationTime,
      type: args.reservationType,
      assetId: asset._id,
      assetName,
      userId: reservation.userId,
      status: reservation.status,
      confirmationCode,
      partnerId: partner._id,
      partnerName: partner.name,
      partnerEmail: partner.email,
      assetType: args.reservationType === "vehicle" ? "vehicles" : 
                 `${args.reservationType}s`,
      customerName,
    };
  },
});

/**
 * Get bookings by semantic status groups for admin dashboard
 */
export const getBookingsByStatusGroup = query({
  args: v.object({
    statusGroup: v.union(
      v.literal("awaiting_payment"),     // DRAFT, PAYMENT_PENDING
      v.literal("awaiting_confirmation"), // AWAITING_CONFIRMATION (paid or not requiring upfront payment)
      v.literal("active"),               // CONFIRMED, IN_PROGRESS
      v.literal("completed"),            // COMPLETED
      v.literal("problematic"),          // CANCELED, EXPIRED, NO_SHOW, payment FAILED
      v.literal("all")
    ),
    assetType: v.optional(v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("accommodation"),
      v.literal("vehicle"),
      v.literal("restaurant")
    )),
    partnerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  }),
  returns: v.array(v.object({
    _id: v.string(),
    type: v.string(),
    assetName: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    bookingDate: v.string(),
    totalPrice: v.optional(v.number()),
    status: v.string(),
    paymentStatus: v.optional(v.string()),
    confirmationCode: v.string(),
    createdAt: v.number(),
    urgencyLevel: v.string(), // "high", "medium", "low"
    actionRequired: v.boolean(),
    actionMessage: v.string(), // Changed from v.optional(v.string())
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const results: Array<{
      _id: string;
      type: string;
      assetName: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      bookingDate: string;
      totalPrice: number | undefined;
      status: string;
      paymentStatus: string | undefined;
      confirmationCode: string;
      createdAt: number;
      urgencyLevel: string;
      actionRequired: boolean;
      actionMessage: string; // Removed undefined
    }> = [];

    // Define status groups
    const statusGroups = {
      awaiting_payment: [BOOKING_STATUS.DRAFT, BOOKING_STATUS.PAYMENT_PENDING],
      awaiting_confirmation: [BOOKING_STATUS.AWAITING_CONFIRMATION],
      active: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS],
      completed: [BOOKING_STATUS.COMPLETED],
      problematic: [BOOKING_STATUS.CANCELED, BOOKING_STATUS.EXPIRED, BOOKING_STATUS.NO_SHOW],
    };

    const targetStatuses = args.statusGroup === "all" 
      ? Object.values(BOOKING_STATUS) 
      : statusGroups[args.statusGroup as keyof typeof statusGroups];

    // Query activity bookings
    if (!args.assetType || args.assetType === "activity") {
      const activities = await ctx.db.query("activityBookings").take(limit);
      
      for (const booking of activities) {
        if (!targetStatuses.includes(booking.status as any)) continue;
        
        const activity = await ctx.db.get(booking.activityId);
        if (!activity) continue;
        
        if (args.partnerId && activity.partnerId !== args.partnerId) continue;

        // Determine urgency and action required
        let urgencyLevel = "low";
        let actionRequired = false;
        let actionMessage = ""; // Initialize with empty string instead of undefined

        // High urgency scenarios
        if (booking.status === BOOKING_STATUS.DRAFT && 
            Date.now() - booking.createdAt > 15 * 60 * 1000) { // 15 minutes
          urgencyLevel = "high";
          actionRequired = true;
          actionMessage = "Pagamento pendente há mais de 15 minutos";
        } else if (booking.status === BOOKING_STATUS.AWAITING_CONFIRMATION &&
                   booking.paymentStatus === PAYMENT_STATUS.PAID) {
          urgencyLevel = "high";
          actionRequired = true;
          actionMessage = "Pagamento confirmado - aguardando confirmação";
        } else if (booking.status === BOOKING_STATUS.PAYMENT_PENDING) {
          urgencyLevel = "medium";
          actionMessage = "Cliente está no checkout";
        }

        results.push({
          _id: booking._id,
          type: "activity",
          assetName: activity.title,
          customerName: booking.customerInfo.name,
          customerEmail: booking.customerInfo.email,
          customerPhone: booking.customerInfo.phone,
          bookingDate: booking.date + (booking.time ? ` ${booking.time}` : ""),
          totalPrice: booking.totalPrice,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          confirmationCode: booking.confirmationCode,
          createdAt: booking.createdAt,
          urgencyLevel,
          actionRequired,
          actionMessage,
        });
      }
    }

    // Similar logic for other booking types...
    // (events, vehicles, restaurants)

    // Sort by urgency and creation date
    return results.sort((a, b) => {
      // First by urgency (high > medium > low)
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      const urgencyDiff = urgencyOrder[a.urgencyLevel as keyof typeof urgencyOrder] - 
                          urgencyOrder[b.urgencyLevel as keyof typeof urgencyOrder];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Then by creation date (newest first)
      return b.createdAt - a.createdAt;
    });
  },
});

/**
 * Get booking statistics by status for dashboard
 */
export const getBookingStatusStatistics = query({
  args: v.object({
    partnerId: v.optional(v.id("users")),
    dateRange: v.optional(v.object({
      startDate: v.string(),
      endDate: v.string(),
    })),
  }),
  returns: v.object({
    total: v.number(),
    byStatus: v.object({
      draft: v.number(),
      paymentPending: v.number(),
      awaitingConfirmation: v.number(),
      confirmed: v.number(),
      inProgress: v.number(),
      completed: v.number(),
      canceled: v.number(),
      expired: v.number(),
      noShow: v.number(),
    }),
    byPaymentStatus: v.object({
      notRequired: v.number(),
      pending: v.number(),
      processing: v.number(),
      paid: v.number(),
      failed: v.number(),
      refunded: v.number(),
    }),
    requiresAction: v.number(),
    recentActivity: v.array(v.object({
      message: v.string(),
      timestamp: v.number(),
      type: v.string(), // "booking_created", "payment_completed", etc.
    })),
  }),
  handler: async (ctx, args) => {
    // Implementation to calculate statistics
    // This would aggregate data from all booking tables
    
    const stats = {
      total: 0,
      byStatus: {
        draft: 0,
        paymentPending: 0,
        awaitingConfirmation: 0,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        canceled: 0,
        expired: 0,
        noShow: 0,
      },
      byPaymentStatus: {
        notRequired: 0,
        pending: 0,
        processing: 0,
        paid: 0,
        failed: 0,
        refunded: 0,
      },
      requiresAction: 0,
      recentActivity: [] as any[],
    };

    // Query and aggregate from all booking tables
    // Implementation details...

    return stats;
  },
});

/**
 * Internal query to get booking by ID from any table
 */
export const getBookingByIdInternal = internalQuery({
  args: {
    bookingId: v.string(),
    tableName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const booking = await ctx.db.get(args.bookingId as any);
      return booking;
    } catch {
      return null;
    }
  },
});

