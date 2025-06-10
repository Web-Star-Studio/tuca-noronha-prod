import { v } from "convex/values";
import { query } from "../../_generated/server";
import { paginationOptsValidator } from "convex/server";

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
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
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
      status: v.string(),
      paymentStatus: v.optional(v.string()),
      confirmationCode: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      specialRequests: v.optional(v.string()),
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
 * Get partner's bookings for their assets
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
      activityTitle: v.string(),
      date: v.string(),
      participants: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
    })),
    events: v.array(v.object({
      _id: v.id("eventBookings"),
      eventTitle: v.string(),
      eventDate: v.string(),
      quantity: v.number(),
      totalPrice: v.number(),
      status: v.string(),
      customerInfo: v.object({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
    })),
    restaurants: v.array(v.object({
      _id: v.id("restaurantReservations"),
      restaurantName: v.string(),
      date: v.string(),
      time: v.string(),
      partySize: v.number(),
      status: v.string(),
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    })),
    vehicles: v.array(v.object({
      _id: v.id("vehicleBookings"),
      vehicleName: v.string(),
      startDate: v.number(),
      endDate: v.number(),
      totalPrice: v.number(),
      status: v.string(),
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

    if (!user || user.role !== "partner") {
      throw new Error("Acesso negado - apenas partners");
    }

    const result = {
      activities: [] as Array<{
        _id: any;
        activityTitle: string;
        date: string;
        participants: number;
        totalPrice: number;
        status: string;
        customerInfo: any;
      }>,
      events: [] as Array<{
        _id: any;
        eventTitle: string;
        eventDate: string;
        quantity: number;
        totalPrice: number;
        status: string;
        customerInfo: any;
      }>,
      restaurants: [] as Array<{
        _id: any;
        restaurantName: string;
        date: string;
        time: string;
        partySize: number;
        status: string;
        name: string;
        email: string;
        phone: string;
      }>,
      vehicles: [] as Array<{
        _id: any;
        vehicleName: string;
        startDate: number;
        endDate: number;
        totalPrice: number;
        status: string;
      }>,
    };

    // Get partner's activities bookings
    if (!args.assetType || args.assetType === "activities") {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .collect();

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
          activityTitle: activity.title,
          date: booking.date,
          participants: booking.participants,
          totalPrice: booking.totalPrice,
          status: booking.status,
          customerInfo: booking.customerInfo,
        })));
      }
    }

    // Get partner's events bookings
    if (!args.assetType || args.assetType === "events") {
      const events = await ctx.db
        .query("events")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .collect();

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
          eventTitle: event.title,
          eventDate: event.date,
          quantity: booking.quantity,
          totalPrice: booking.totalPrice,
          status: booking.status,
          customerInfo: booking.customerInfo,
        })));
      }
    }

    // Get partner's restaurants reservations
    if (!args.assetType || args.assetType === "restaurants") {
      const restaurants = await ctx.db
        .query("restaurants")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .collect();

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
          restaurantName: restaurant.name,
          date: reservation.date,
          time: reservation.time,
          partySize: reservation.partySize,
          status: reservation.status,
          name: reservation.name,
          email: reservation.email,
          phone: reservation.phone,
        })));
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

    if (!user || (user.role !== "admin" && user.role !== "partner" && user.role !== "master")) {
      throw new Error("Acesso negado - apenas admins, masters e partners");
    }

    // For partners, only show bookings for their activities
    if (user.role === "partner") {
      // Get partner's activities
      const partnerActivities = await ctx.db
        .query("activities")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .collect();

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
            ...booking,
            activityTitle: activity?.title || "Atividade não encontrada",
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
        const activity = await ctx.db.get(booking.activityId);
        return {
          ...booking,
          activityTitle: activity?.title || "Atividade não encontrada",
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
 * Get all event bookings (admin only)
 */
export const getEventBookings = query({
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

    if (!user || (user.role !== "admin" && user.role !== "partner" && user.role !== "master")) {
      throw new Error("Acesso negado - apenas admins, masters e partners");
    }

    // For partners, only show bookings for their events
    if (user.role === "partner") {
      // Get partner's events
      const partnerEvents = await ctx.db
        .query("events")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .collect();

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

    // Admin and master see all bookings
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
          eventTitle: event?.title || "Evento não encontrado",
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
 * Get all restaurant reservations (admin only)
 */
export const getRestaurantReservations = query({
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

    if (!user || (user.role !== "admin" && user.role !== "partner" && user.role !== "master")) {
      throw new Error("Acesso negado - apenas admins, masters e partners");
    }

    // For partners, only show reservations for their restaurants
    if (user.role === "partner") {
      // Get partner's restaurants
      const partnerRestaurants = await ctx.db
        .query("restaurants")
        .withIndex("by_partner", (q) => q.eq("partnerId", user._id))
        .collect();

      const restaurantIds = partnerRestaurants.map(r => r._id);

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
          restaurantName: restaurant?.name || "Restaurante não encontrado",
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
 * Get all vehicle bookings (admin only)
 */
export const getVehicleBookings = query({
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

    if (!user || (user.role !== "admin" && user.role !== "partner" && user.role !== "master")) {
      throw new Error("Acesso negado - apenas admins, masters e partners");
    }

    // For partners, only show bookings for their vehicles
    if (user.role === "partner") {
      // Get partner's vehicles - use filter until index is available
      const partnerVehicles = await ctx.db
        .query("vehicles")
        .order("desc")
        .filter((q) => q.eq(q.field("ownerId"), user._id))
        .collect();

      const vehicleIds = partnerVehicles.map(v => v._id);

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
          return {
            ...booking,
            vehicleName: vehicle?.name || "Veículo não encontrado",
            vehicleBrand: vehicle?.brand || "",
            vehicleModel: vehicle?.model || "",
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
        return {
          ...booking,
          vehicleName: vehicle?.name || "Veículo não encontrado",
          vehicleBrand: vehicle?.brand || "",
          vehicleModel: vehicle?.model || "",
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    return booking || null;
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    return booking || null;
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
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    return reservation || null;
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    return booking || null;
  },
});

/**
 * Get all user reservations in a unified format for dashboard
 */
export const getUserReservations = query({
  args: {},
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    name: v.string(),
    date: v.optional(v.number()),
    checkIn: v.optional(v.number()),
    checkOut: v.optional(v.number()),
    guests: v.number(),
    status: v.string(),
    location: v.string(),
    imageUrl: v.string(),
    confirmationCode: v.string(),
    createdAt: v.number(),
  })),
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
          id: booking._id.toString(),
          type: 'activity',
          name: activity.title,
          date: new Date(booking.date).getTime(),
          guests: booking.participants,
          status: booking.status,
          location: 'Fernando de Noronha', // Default location
          imageUrl: activity.imageUrl || '/images/activity-default.jpg',
          confirmationCode: booking.confirmationCode,
          createdAt: booking.createdAt,
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
          id: booking._id.toString(),
          type: 'event',
          name: event.title,
          date: new Date(event.date).getTime(),
          guests: booking.quantity,
          status: booking.status,
          location: event.location,
          imageUrl: event.imageUrl || '/images/event-default.jpg',
          confirmationCode: booking.confirmationCode,
          createdAt: booking.createdAt,
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
        const reservationDateTime = new Date(`${reservation.date}T${reservation.time}`);
        reservations.push({
          id: reservation._id.toString(),
          type: 'restaurant',
          name: restaurant.name,
          date: reservationDateTime.getTime(),
          guests: reservation.partySize,
          status: reservation.status,
          location: `${restaurant.address.neighborhood}, ${restaurant.address.city} - ${restaurant.address.state}`,
          imageUrl: restaurant.mainImage || '/images/restaurant-default.jpg',
          confirmationCode: reservation.confirmationCode,
          createdAt: reservation._creationTime,
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
          id: booking._id.toString(),
          type: 'vehicle',
          name: `${vehicle.brand} ${vehicle.model}`,
          checkIn: booking.startDate,
          checkOut: booking.endDate,
          guests: 1, // Vehicle bookings don't have guests, but we need a value
          status: booking.status,
          location: booking.pickupLocation || 'Fernando de Noronha',
          imageUrl: vehicle.imageUrl || '/images/vehicle-default.jpg',
          confirmationCode: booking._id.toString(), // Vehicle bookings might not have confirmation codes
          createdAt: booking.createdAt,
        });
      }
    }

    // Get accommodation bookings
    const accommodationBookings = await ctx.db
      .query("accommodationBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const booking of accommodationBookings) {
      const accommodation = await ctx.db.get(booking.accommodationId);
      if (accommodation) {
        reservations.push({
          id: booking._id.toString(),
          type: 'accommodation',
          name: accommodation.name,
          checkIn: new Date(booking.checkInDate).getTime(),
          checkOut: new Date(booking.checkOutDate).getTime(),
          guests: booking.guests,
          status: booking.status,
          location: `${accommodation.address.neighborhood}, ${accommodation.address.city} - ${accommodation.address.state}`,
          imageUrl: accommodation.mainImage || '/images/accommodation-default.jpg',
          confirmationCode: booking.confirmationCode,
          createdAt: booking.createdAt,
        });
      }
    }

    // Sort by creation date (most recent first)
    reservations.sort((a, b) => b.createdAt - a.createdAt);

    return reservations;
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
      throw new Error("Usuário não autenticado");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Get all user reservations
    const activityBookings = await ctx.db
      .query("activityBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const eventBookings = await ctx.db
      .query("eventBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const restaurantReservations = await ctx.db
      .query("restaurantReservations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const vehicleBookings = await ctx.db
      .query("vehicleBookings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const accommodationBookings = await ctx.db
      .query("accommodationBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Calculate statistics
    const totalReservations = activityBookings.length + eventBookings.length + 
                             restaurantReservations.length + vehicleBookings.length + 
                             accommodationBookings.length;

    const activeReservations = [
      ...activityBookings.filter(b => b.status === 'confirmed' || b.status === 'pending'),
      ...eventBookings.filter(b => b.status === 'confirmed' || b.status === 'pending'),
      ...restaurantReservations.filter(r => r.status === 'confirmed' || r.status === 'pending'),
      ...vehicleBookings.filter(b => b.status === 'confirmed' || b.status === 'pending'),
      ...accommodationBookings.filter(b => b.status === 'confirmed' || b.status === 'pending'),
    ].length;

    const completedTrips = [
      ...activityBookings.filter(b => b.status === 'completed'),
      ...eventBookings.filter(b => b.status === 'completed'),
      ...restaurantReservations.filter(r => r.status === 'completed'),
      ...vehicleBookings.filter(b => b.status === 'completed'),
      ...accommodationBookings.filter(b => b.status === 'completed'),
    ].length;

    // Calculate total spent
    const totalSpent = [
      ...activityBookings.map(b => b.totalPrice),
      ...eventBookings.map(b => b.totalPrice),
      ...vehicleBookings.map(b => b.totalPrice),
      ...accommodationBookings.map(b => b.totalPrice),
    ].reduce((sum, price) => sum + price, 0);

    // Get favorite locations from completed trips
    const favoriteLocations = ["Fernando de Noronha", "Praia do Sancho", "Baía do Sueste"];

    return {
      totalReservations,
      activeReservations,
      totalSpent,
      favoriteLocations,
      completedTrips,
    };
  },
});