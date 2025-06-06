import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import type { MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { 
  BOOKING_STATUS, 
  PAYMENT_STATUS,
  createActivityBookingValidator,
  createEventBookingValidator,
  createRestaurantReservationValidator,
  createVehicleBookingValidator,
  updateActivityBookingValidator,
  updateEventBookingValidator,
  updateRestaurantReservationValidator,
  updateVehicleBookingValidator,
} from "./types";
import { 
  generateConfirmationCode, 
  calculateActivityBookingPrice,
  calculateEventBookingPrice,
  calculateVehicleBookingPrice,
  hasDateConflict,
  isValidEmail,
  isValidPhone,
} from "./utils";

/**
 * Create activity booking
 */
export const createActivityBooking = mutation({
  args: createActivityBookingValidator,
  returns: v.object({
    bookingId: v.id("activityBookings"),
    confirmationCode: v.string(),
    totalPrice: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Validate customer info
    if (!isValidEmail(args.customerInfo.email)) {
      throw new Error("Email inválido");
    }
    if (!isValidPhone(args.customerInfo.phone)) {
      throw new Error("Telefone inválido");
    }

    // Get activity
    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      throw new Error("Atividade não encontrada");
    }

    // Check if activity is active
    if (!activity.isActive) {
      throw new Error("Atividade não está disponível");
    }

    // Check participant limits
    if (args.participants < activity.minParticipants) {
      throw new Error(`Mínimo de ${activity.minParticipants} participantes`);
    }
    if (args.participants > activity.maxParticipants) {
      throw new Error(`Máximo de ${activity.maxParticipants} participantes`);
    }

    // Calculate price
    let totalPrice = activity.price;
    if (args.ticketId) {
      const ticket = await ctx.db.get(args.ticketId);
      if (!ticket || !ticket.isActive) {
        throw new Error("Tipo de ingresso não disponível");
      }
      totalPrice = ticket.price;
    }

    const finalPrice = calculateActivityBookingPrice(totalPrice, args.participants);
    const confirmationCode = generateConfirmationCode();

    // Create booking
    const bookingId = await ctx.db.insert("activityBookings", {
      activityId: args.activityId,
      userId: user._id,
      ticketId: args.ticketId,
      date: args.date,
      time: args.time,
      participants: args.participants,
      totalPrice: finalPrice,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      confirmationCode,
      customerInfo: args.customerInfo,
      specialRequests: args.specialRequests,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      bookingId,
      confirmationCode,
      totalPrice: finalPrice,
    };
  },
});

/**
 * Create event booking
 */
export const createEventBooking = mutation({
  args: createEventBookingValidator,
  returns: v.object({
    bookingId: v.id("eventBookings"),
    confirmationCode: v.string(),
    totalPrice: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get current user
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

    // Validate customer info
    if (!isValidEmail(args.customerInfo.email)) {
      throw new Error("Email inválido");
    }
    if (!isValidPhone(args.customerInfo.phone)) {
      throw new Error("Telefone inválido");
    }

    // Get event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Evento não encontrado");
    }

    if (!event.isActive) {
      throw new Error("Evento não está disponível");
    }

    // Calculate price
    let totalPrice = event.price;
    if (args.ticketId) {
      const ticket = await ctx.db.get(args.ticketId);
      if (!ticket || !ticket.isActive) {
        throw new Error("Tipo de ingresso não disponível");
      }
      totalPrice = ticket.price;
    }

    const finalPrice = calculateEventBookingPrice(totalPrice, args.quantity);
    const confirmationCode = generateConfirmationCode();

    // Create booking
    const bookingId = await ctx.db.insert("eventBookings", {
      eventId: args.eventId,
      userId: user._id,
      ticketId: args.ticketId,
      quantity: args.quantity,
      totalPrice: finalPrice,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      confirmationCode,
      customerInfo: args.customerInfo,
      specialRequests: args.specialRequests,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      bookingId,
      confirmationCode,
      totalPrice: finalPrice,
    };
  },
});

/**
 * Create restaurant reservation
 */
export const createRestaurantReservation = mutation({
  args: createRestaurantReservationValidator,
  returns: v.object({
    reservationId: v.id("restaurantReservations"),
    confirmationCode: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get current user
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

    // Validate customer info
    if (!isValidEmail(args.customerInfo.email)) {
      throw new Error("Email inválido");
    }
    if (!isValidPhone(args.customerInfo.phone)) {
      throw new Error("Telefone inválido");
    }

    // Get restaurant
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    if (!restaurant.isActive) {
      throw new Error("Restaurante não está disponível");
    }

    if (!restaurant.acceptsReservations) {
      throw new Error("Restaurante não aceita reservas");
    }

    if (args.partySize > restaurant.maximumPartySize) {
      throw new Error(`Máximo de ${restaurant.maximumPartySize} pessoas por reserva`);
    }

    const confirmationCode = generateConfirmationCode();

    // Create reservation
    const reservationId = await ctx.db.insert("restaurantReservations", {
      restaurantId: args.restaurantId,
      userId: user._id,
      date: args.date,
      time: args.time,
      partySize: args.partySize,
      name: args.customerInfo.name,
      email: args.customerInfo.email,
      phone: args.customerInfo.phone,
      specialRequests: args.specialRequests,
      status: BOOKING_STATUS.PENDING,
      confirmationCode,
    });

    return {
      reservationId,
      confirmationCode,
    };
  },
});

/**
 * Create vehicle booking
 */
export const createVehicleBooking = mutation({
  args: createVehicleBookingValidator,
  returns: v.object({
    bookingId: v.id("vehicleBookings"),
    totalPrice: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get current user
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

    // Validate customer info
    if (!isValidEmail(args.customerInfo.email)) {
      throw new Error("Email inválido");
    }
    if (!isValidPhone(args.customerInfo.phone)) {
      throw new Error("Telefone inválido");
    }

    // Get vehicle
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) {
      throw new Error("Veículo não encontrado");
    }

    if (vehicle.status !== "available") {
      throw new Error("Veículo não está disponível");
    }

    // Check for date conflicts
    const existingBookings = await ctx.db
      .query("vehicleBookings")
      .withIndex("by_vehicleId_status", (q) => 
        q.eq("vehicleId", args.vehicleId).eq("status", "confirmed")
      )
      .collect();

    for (const booking of existingBookings) {
      if (hasDateConflict(booking.startDate, booking.endDate, args.startDate, args.endDate)) {
        throw new Error("Veículo não está disponível nas datas selecionadas");
      }
    }

    // Calculate total price
    const totalPrice = calculateVehicleBookingPrice(
      vehicle.pricePerDay,
      args.startDate,
      args.endDate,
      args.additionalDrivers
    );

    // Create booking
    const bookingId = await ctx.db.insert("vehicleBookings", {
      vehicleId: args.vehicleId,
      userId: user._id,
      startDate: args.startDate,
      endDate: args.endDate,
      totalPrice,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      pickupLocation: args.pickupLocation,
      returnLocation: args.returnLocation,
      additionalDrivers: args.additionalDrivers,
      additionalOptions: args.additionalOptions,
      notes: args.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      bookingId,
      totalPrice,
    };
  },
});

/**
 * Update activity booking status
 */
export const updateActivityBooking = mutation({
  args: updateActivityBookingValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    await ctx.db.patch(args.bookingId, {
      ...(args.status && { status: args.status }),
      ...(args.paymentStatus && { paymentStatus: args.paymentStatus }),
      ...(args.paymentMethod && { paymentMethod: args.paymentMethod }),
      ...(args.specialRequests && { specialRequests: args.specialRequests }),
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Cancel activity booking
 */
export const cancelActivityBooking = mutation({
  args: { bookingId: v.id("activityBookings") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Cancel event booking
 */
export const cancelEventBooking = mutation({
  args: { bookingId: v.id("eventBookings") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Cancel restaurant reservation
 */
export const cancelRestaurantReservation = mutation({
  args: { reservationId: v.id("restaurantReservations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      throw new Error("Reserva não encontrada");
    }

    if (reservation.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    await ctx.db.patch(args.reservationId, {
      status: BOOKING_STATUS.CANCELED,
    });

    return null;
  },
});

/**
 * Cancel vehicle booking
 */
export const cancelVehicleBooking = mutation({
  args: { bookingId: v.id("vehicleBookings") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Confirm activity booking (Partner only)
 */
export const confirmActivityBooking = mutation({
  args: { 
    bookingId: v.id("activityBookings"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
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

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Get activity to verify ownership
    const activity = await ctx.db.get(booking.activityId);
    if (!activity) {
      throw new Error("Atividade não encontrada");
    }

    // Check if user has permission to confirm this booking
    const canConfirm = user.role === "master" || 
      (user.role === "partner" && activity.partnerId === user._id) ||
      (user.role === "employee" && await hasEmployeePermission(ctx, user._id, activity._id, "canManageBookings"));

    if (!canConfirm) {
      throw new Error("Sem permissão para confirmar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Reserva já está confirmada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CONFIRMED,
      ...(args.notes && { partnerNotes: args.notes }),
      updatedAt: Date.now(),
    });

    // Schedule notification sending action
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingConfirmationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "activity",
      assetName: activity.title,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      partnerName: user.name,
    });

    return null;
  },
});

/**
 * Confirm event booking (Partner only)
 */
export const confirmEventBooking = mutation({
  args: { 
    bookingId: v.id("eventBookings"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
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

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Get event to verify ownership
    const event = await ctx.db.get(booking.eventId);
    if (!event) {
      throw new Error("Evento não encontrado");
    }

    // Check if user has permission to confirm this booking
    const canConfirm = user.role === "master" || 
      (user.role === "partner" && event.partnerId === user._id) ||
      (user.role === "employee" && await hasEmployeePermission(ctx, user._id, event._id, "canManageBookings"));

    if (!canConfirm) {
      throw new Error("Sem permissão para confirmar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Reserva já está confirmada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CONFIRMED,
      ...(args.notes && { partnerNotes: args.notes }),
      updatedAt: Date.now(),
    });

    // Schedule notification sending action
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingConfirmationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "event",
      assetName: event.title,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      partnerName: user.name,
    });

    return null;
  },
});

/**
 * Confirm restaurant reservation (Partner only)
 */
export const confirmRestaurantReservation = mutation({
  args: { 
    reservationId: v.id("restaurantReservations"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
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

    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      throw new Error("Reserva não encontrada");
    }

    // Get restaurant to verify ownership
    const restaurant = await ctx.db.get(reservation.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    // Check if user has permission to confirm this reservation
    const canConfirm = user.role === "master" || 
      (user.role === "partner" && restaurant.partnerId === user._id) ||
      (user.role === "employee" && await hasEmployeePermission(ctx, user._id, restaurant._id, "canManageBookings"));

    if (!canConfirm) {
      throw new Error("Sem permissão para confirmar esta reserva");
    }

    if (reservation.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Reserva já está confirmada");
    }

    if (reservation.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    await ctx.db.patch(args.reservationId, {
      status: BOOKING_STATUS.CONFIRMED,
      ...(args.notes && { partnerNotes: args.notes }),
    });

    // Schedule notification sending action
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingConfirmationNotification, {
      userId: reservation.userId,
      bookingId: reservation._id,
      bookingType: "restaurant",
      assetName: restaurant.name,
      confirmationCode: reservation.confirmationCode,
      customerEmail: reservation.email,
      customerName: reservation.name,
      partnerName: user.name,
    });

    return null;
  },
});

/**
 * Confirm vehicle booking (Partner only)
 */
export const confirmVehicleBooking = mutation({
  args: { 
    bookingId: v.id("vehicleBookings"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
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

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Get vehicle to verify ownership
    const vehicle = await ctx.db.get(booking.vehicleId);
    if (!vehicle) {
      throw new Error("Veículo não encontrado");
    }

    // Check if user has permission to confirm this booking
    const canConfirm = user.role === "master" || 
      (user.role === "partner" && vehicle.ownerId === user._id) ||
      (user.role === "employee" && await hasEmployeePermission(ctx, user._id, vehicle._id, "canManageBookings"));

    if (!canConfirm) {
      throw new Error("Sem permissão para confirmar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Reserva já está confirmada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CONFIRMED,
      ...(args.notes && { partnerNotes: args.notes }),
      updatedAt: Date.now(),
    });

    // Create basic notification for vehicle bookings since they don't have confirmation codes or customer info fields
    await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
      userId: booking.userId,
      type: "booking_confirmed",
      title: "Reserva de Veículo Confirmada! 🎉",
      message: `Sua reserva para "${vehicle.name}" foi confirmada!`,
      relatedId: booking._id,
      relatedType: "vehicle_booking",
      data: {
        bookingType: "vehicle",
        assetName: vehicle.name,
        partnerName: user.name,
      },
    });

    return null;
  },
});

// Helper function to check employee permissions
async function hasEmployeePermission(
  ctx: MutationCtx, 
  userId: Id<"users">, 
  assetId: Id<"activities"> | Id<"events"> | Id<"restaurants"> | Id<"vehicles">, 
  permission: string
): Promise<boolean> {
  // For now, return false since we don't have the proper asset permissions table
  // This should be implemented when the asset permissions schema is defined
  return false;
}