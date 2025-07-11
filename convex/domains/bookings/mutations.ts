import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { BOOKING_STATUS, PAYMENT_STATUS } from "./types";
import { 
  generateConfirmationCode,
  calculateActivityBookingPrice,
  calculateEventBookingPrice,
  calculateVehicleBookingPrice,
  hasDateConflict,
  isValidEmail,
  isValidPhone
} from "./utils";
import { checkRateLimit, recordRateLimitAttempt } from "../../shared/rateLimiting";
import {
  createActivityBookingValidator,
  createEventBookingValidator,
  createRestaurantReservationValidator,
  createVehicleBookingValidator,
  createAccommodationBookingValidator,
  updateActivityBookingValidator,
  updateEventBookingValidator,
  updateRestaurantReservationValidator,
  updateVehicleBookingValidator,
  updateAccommodationBookingValidator
} from "./types";

const assetInfoValidator = v.object({
  name: v.string(),
  address: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  description: v.optional(v.string()),
});

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

    // Check rate limit for booking creation
    const rateLimitCheck = await checkRateLimit(ctx, user._id, "CREATE_BOOKING");
    if (!rateLimitCheck.allowed) {
      throw new Error(
        "Limite de reservas excedido. " + rateLimitCheck.remainingAttempts + " tentativas restantes. " +
        "Limite será resetado em " + new Date(rateLimitCheck.resetTime).toLocaleString()
      );
    }

    // Definir informações do cliente usando dados do usuário caso não fornecidas
    const customerInfo = args.customerInfo ?? {
      name: user.name || identity.name || "",
      email: user.email || identity.email || "",
      phone: user.phoneNumber || "",
    };

    // Validar informações do cliente
    if (!isValidEmail(customerInfo.email)) {
      throw new Error("Email inválido");
    }
    if (!isValidPhone(customerInfo.phone)) {
      throw new Error("Telefone inválido");
    }

    // Substituir args.customerInfo
    args.customerInfo = customerInfo as any;

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
      throw new Error("Mínimo de " + activity.minParticipants + " participantes");
    }
    if (args.participants > activity.maxParticipants) {
      throw new Error("Máximo de " + activity.maxParticipants + " participantes");
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

    const calculatedPrice = calculateActivityBookingPrice(totalPrice, args.participants);
    // Use finalAmount if coupon is applied, otherwise use calculated price
    const finalPrice = args.finalAmount ?? calculatedPrice;
    const confirmationCode = generateConfirmationCode(args.date, customerInfo.name);

    // Determine initial booking status based on payment requirement
    let initialStatus: string = BOOKING_STATUS.DRAFT;
    let initialPaymentStatus: string = PAYMENT_STATUS.PENDING;
    
    // Se a atividade não requer pagamento ou é gratuita
    if (finalPrice === 0) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.NOT_REQUIRED;
    }
    // Se requer pagamento online
    else if (activity.acceptsOnlinePayment && activity.requiresUpfrontPayment) {
      initialStatus = BOOKING_STATUS.DRAFT;
      initialPaymentStatus = PAYMENT_STATUS.PENDING;
    }
    // Se aceita pagamento no local
    else if (!activity.requiresUpfrontPayment) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.PENDING;
    }

    // Create booking
    const bookingId = await ctx.db.insert("activityBookings", {
      activityId: args.activityId,
      userId: user._id,
      ticketId: args.ticketId,
      date: args.date,
      time: args.time,
      participants: args.participants,
      totalPrice: finalPrice,
      status: initialStatus,
      paymentStatus: initialPaymentStatus,
      confirmationCode,
      customerInfo,
      specialRequests: args.specialRequests,
      couponCode: args.couponCode,
      discountAmount: args.discountAmount,
      finalAmount: args.finalAmount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Record successful booking attempt for rate limiting
    await recordRateLimitAttempt(ctx, user._id, "CREATE_BOOKING");

    // Only send confirmation emails if payment is not required or not upfront
    if (initialPaymentStatus === PAYMENT_STATUS.NOT_REQUIRED || !activity.requiresUpfrontPayment) {
      // Send email confirmation to customer
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingConfirmationEmail, {
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        assetName: activity.title,
        bookingType: "activity",
        confirmationCode,
        bookingDate: args.date,
        totalPrice: finalPrice,
        bookingDetails: {
          activityId: activity._id,
          participants: args.participants,
          date: args.date,
          specialRequests: args.specialRequests,
        },
      });

      // Send notification to partner about new booking
      const partner = await ctx.db.get(activity.partnerId);
      if (partner && partner.email) {
        await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendPartnerNewBookingEmail, {
          partnerEmail: partner.email,
          partnerName: partner.name || "Parceiro",
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          assetName: activity.title,
          bookingType: "activity",
          confirmationCode,
          bookingDate: args.date,
          totalPrice: finalPrice,
          bookingDetails: {
            activityId: activity._id,
            participants: args.participants,
            date: args.date,
            specialRequests: args.specialRequests,
          },
        });
      }
    }

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

    // Definir informações do cliente usando dados do usuário caso não fornecidas
    const customerInfo = args.customerInfo ?? {
      name: user.name || identity.name || "",
      email: user.email || identity.email || "",
      phone: user.phoneNumber || "",
    };

    // Validar informações do cliente
    if (!isValidEmail(customerInfo.email)) {
      throw new Error("Email inválido");
    }
    if (!isValidPhone(customerInfo.phone)) {
      throw new Error("Telefone inválido");
    }

    // Substituir args.customerInfo por customerInfo consolidado
    args.customerInfo = customerInfo as any;

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

    const calculatedPrice = calculateEventBookingPrice(totalPrice, args.quantity);
    // Use finalAmount if coupon is applied, otherwise use calculated price
    const finalPrice = args.finalAmount ?? calculatedPrice;
    const confirmationCode = generateConfirmationCode(event.date, customerInfo.name);

    // Determine initial booking status based on payment requirement
    let initialStatus: string = BOOKING_STATUS.DRAFT;
    let initialPaymentStatus: string = PAYMENT_STATUS.PENDING;
    
    // Se o evento não requer pagamento ou é gratuito
    if (finalPrice === 0) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.NOT_REQUIRED;
    }
    // Se requer pagamento online
    else if (event.acceptsOnlinePayment && event.requiresUpfrontPayment) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.PENDING;
    }
    // Se aceita pagamento no local
    else if (!event.requiresUpfrontPayment) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.PENDING;
    }

    // Create booking
    const bookingId = await ctx.db.insert("eventBookings", {
      eventId: args.eventId,
      userId: user._id,
      ticketId: args.ticketId,
      quantity: args.quantity,
      totalPrice: finalPrice,
      status: initialStatus,
      paymentStatus: initialPaymentStatus,
      confirmationCode,
      customerInfo,
      specialRequests: args.specialRequests,
      couponCode: args.couponCode,
      discountAmount: args.discountAmount,
      finalAmount: args.finalAmount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Only send confirmation emails if payment is not required or not upfront
    if (initialPaymentStatus === PAYMENT_STATUS.NOT_REQUIRED || !event.requiresUpfrontPayment) {
      // Send email confirmation to customer
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingConfirmationEmail, {
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        assetName: event.title,
        bookingType: "event",
        confirmationCode,
        bookingDate: event.date + " às " + event.time,
        totalPrice: finalPrice,
        bookingDetails: {
          eventId: event._id,
          quantity: args.quantity,
          ticketId: args.ticketId,
          location: event.location,
          specialRequests: args.specialRequests,
        },
      });

      // Send notification to partner about new booking
      const partner = await ctx.db.get(event.partnerId);
      if (partner && partner.email) {
        await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendPartnerNewBookingEmail, {
          partnerEmail: partner.email,
          partnerName: partner.name || "Parceiro",
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          assetName: event.title,
          bookingType: "event",
          confirmationCode,
          bookingDate: event.date + " às " + event.time,
          totalPrice: finalPrice,
          bookingDetails: {
            eventId: event._id,
            quantity: args.quantity,
            ticketId: args.ticketId,
            location: event.location,
            specialRequests: args.specialRequests,
          },
        });
      }
    }

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

    // Definir informações do cliente usando dados do usuário caso não fornecidas
    const customerInfo = args.customerInfo ?? {
      name: user.name || identity.name || "",
      email: user.email || identity.email || "",
      phone: user.phoneNumber || "",
    };

    // Validar informações do cliente
    if (!isValidEmail(customerInfo.email)) {
      throw new Error("Email inválido");
    }
    if (!isValidPhone(customerInfo.phone)) {
      throw new Error("Telefone inválido");
    }

    // Substituir args.customerInfo por customerInfo consolidado
    args.customerInfo = customerInfo as any;

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
      throw new Error("Máximo de " + restaurant.maximumPartySize + " pessoas por reserva");
    }

    const confirmationCode = generateConfirmationCode(args.date, customerInfo.name);

    // Create reservation
    const reservationId = await ctx.db.insert("restaurantReservations", {
      restaurantId: args.restaurantId,
      userId: user._id,
      date: args.date,
      time: args.time,
      partySize: args.partySize,
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      specialRequests: args.specialRequests,
      status: BOOKING_STATUS.AWAITING_CONFIRMATION,
      confirmationCode,
      couponCode: args.couponCode,
      discountAmount: args.discountAmount,
      finalAmount: args.finalAmount,
    });

    // Send email confirmation to customer
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingConfirmationEmail, {
      customerEmail: customerInfo.email,
      customerName: customerInfo.name,
      assetName: restaurant.name,
      bookingType: "restaurant",
      confirmationCode,
      bookingDate: args.date + " às " + args.time,
      bookingDetails: {
        restaurantId: restaurant._id,
        partySize: args.partySize,
        date: args.date,
        time: args.time,
        specialRequests: args.specialRequests,
      },
    });

    // Send notification to partner about new booking
    const partner = await ctx.db.get(restaurant.partnerId);
    if (partner && partner.email) {
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendPartnerNewBookingEmail, {
        partnerEmail: partner.email,
        partnerName: partner.name || "Parceiro",
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        assetName: restaurant.name,
        bookingType: "restaurant",
        confirmationCode,
        bookingDate: args.date + " às " + args.time,
        bookingDetails: {
          restaurantId: restaurant._id,
          partySize: args.partySize,
          date: args.date,
          time: args.time,
          specialRequests: args.specialRequests,
        },
      });
    }

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

    // Definir informações do cliente usando dados do usuário caso não fornecidas
    const customerInfo = args.customerInfo ?? {
      name: user.name || identity.name || "",
      email: user.email || identity.email || "",
      phone: user.phoneNumber || "",
    };

    // Validar informações do cliente
    if (!isValidEmail(customerInfo.email)) {
      throw new Error("Email inválido");
    }
    if (!isValidPhone(customerInfo.phone)) {
      throw new Error("Telefone inválido");
    }

    // Substituir args.customerInfo por customerInfo consolidado
    args.customerInfo = customerInfo as any;

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
    const calculatedPrice = calculateVehicleBookingPrice(
      vehicle.pricePerDay,
      args.startDate,
      args.endDate,
      args.additionalDrivers
    );
    // Use finalAmount if coupon is applied, otherwise use calculated price
    const totalPrice = args.finalAmount ?? calculatedPrice;

    // Generate confirmation code
    const confirmationCode = generateConfirmationCode(args.startDate.toString(), customerInfo.name);

    // Determine initial booking status based on payment requirement
    let initialStatus: string = BOOKING_STATUS.DRAFT;
    let initialPaymentStatus: string = PAYMENT_STATUS.PENDING;
    
    // Se o veículo não requer pagamento ou é gratuito
    if (totalPrice === 0) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.NOT_REQUIRED;
    }
    // Se requer pagamento online
    else if (vehicle.acceptsOnlinePayment && vehicle.requiresUpfrontPayment) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.PENDING;
    }
    // Se aceita pagamento no local
    else if (!vehicle.requiresUpfrontPayment) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.PENDING;
    }

    // Create booking
    const bookingId = await ctx.db.insert("vehicleBookings", {
      vehicleId: args.vehicleId,
      userId: user._id,
      startDate: args.startDate,
      endDate: args.endDate,
      totalPrice,
      status: initialStatus,
      paymentStatus: initialPaymentStatus,
      confirmationCode,
      customerInfo,
      pickupLocation: args.pickupLocation,
      returnLocation: args.returnLocation,
      additionalDrivers: args.additionalDrivers,
      additionalOptions: args.additionalOptions,
      notes: args.notes,
      couponCode: args.couponCode,
      discountAmount: args.discountAmount,
      finalAmount: args.finalAmount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      bookingId,
      confirmationCode,
      totalPrice,
    };
  },
});

/**
 * Create accommodation booking
 */
export const createAccommodationBooking = mutation({
  args: createAccommodationBookingValidator,
  returns: v.object({
    bookingId: v.id("accommodationBookings"),
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

    // Definir informações do cliente usando dados do usuário caso não fornecidas
    const customerInfo = args.customerInfo ?? {
      name: user.name || identity.name || "",
      email: user.email || identity.email || "",
      phone: user.phoneNumber || "",
    };

    // Validar informações do cliente
    if (!isValidEmail(customerInfo.email)) {
      throw new Error("Email inválido");
    }
    if (!isValidPhone(customerInfo.phone)) {
      throw new Error("Telefone inválido");
    }

    // Substituir args.customerInfo por customerInfo consolidado
    args.customerInfo = customerInfo as any;

    // Get accommodation
    const accommodation = await ctx.db.get(args.accommodationId);
    if (!accommodation) {
      throw new Error("Hospedagem não encontrada");
    }

    if (!accommodation.isActive) {
      throw new Error("Hospedagem não está disponível");
    }

    // Check guest limits
    if (args.guestCount > accommodation.maxGuests) {
      throw new Error("Máximo de " + accommodation.maxGuests + " hóspedes");
    }

    // Calculate total price (simplified - in real implementation, consider nights, season, etc.)
    const calculatedPrice = accommodation.pricePerNight * calculateNights(args.checkInDate, args.checkOutDate);
    // Use finalAmount if coupon is applied, otherwise use calculated price
    const totalPrice = args.finalAmount ?? calculatedPrice;

    // Generate confirmation code
    const confirmationCode = generateConfirmationCode(args.checkInDate, customerInfo.name);

    // Determine initial booking status
    let initialStatus: string = BOOKING_STATUS.DRAFT;
    let initialPaymentStatus: string = PAYMENT_STATUS.PENDING;
    
    if (totalPrice === 0) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.NOT_REQUIRED;
    } else if (accommodation.acceptsOnlinePayment && accommodation.requiresUpfrontPayment) {
      initialStatus = BOOKING_STATUS.DRAFT;
      initialPaymentStatus = PAYMENT_STATUS.PENDING;
    } else if (!accommodation.requiresUpfrontPayment) {
      initialStatus = BOOKING_STATUS.AWAITING_CONFIRMATION;
      initialPaymentStatus = PAYMENT_STATUS.PENDING;
    }

    // Create booking
    const bookingId = await ctx.db.insert("accommodationBookings", {
      accommodationId: args.accommodationId,
      userId: user._id,
      checkInDate: args.checkInDate,
      checkOutDate: args.checkOutDate,
      guests: BigInt(args.guestCount),
      totalPrice,
      status: initialStatus,
      paymentStatus: initialPaymentStatus,
      confirmationCode,
      customerInfo,
      specialRequests: args.specialRequests,
      couponCode: args.couponCode,
      discountAmount: args.discountAmount,
      finalAmount: args.finalAmount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      bookingId,
      confirmationCode,
      totalPrice,
    };
  },
});

// Helper function to calculate nights between dates
function calculateNights(checkInDate: string, checkOutDate: string): number {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const timeDiff = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(1, nights); // Minimum 1 night
}

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
  args: { 
    bookingId: v.id("activityBookings"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    const activity = await ctx.db.get(booking.activityId);
    if (!activity) {
      throw new Error("Atividade não encontrada");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    // Schedule cancellation notification
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingCancellationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "activity",
      assetName: activity.title,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      reason: args.reason,
    });

    // Send cancellation email to customer
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingCancelledEmail, {
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      assetName: activity.title,
      bookingType: "activity",
      confirmationCode: booking.confirmationCode,
      reason: args.reason,
    });

    return null;
  },
});

/**
 * Cancel event booking
 */
export const cancelEventBooking = mutation({
  args: { 
    bookingId: v.id("eventBookings"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    const event = await ctx.db.get(booking.eventId);
    if (!event) {
      throw new Error("Evento não encontrado");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    // Schedule cancellation notification
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingCancellationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "event",
      assetName: event.title,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      reason: args.reason,
    });

    // Send cancellation email to customer
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingCancelledEmail, {
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      assetName: event.title,
      bookingType: "event",
      confirmationCode: booking.confirmationCode,
      reason: args.reason,
    });

    return null;
  },
});

/**
 * Cancel restaurant reservation
 */
export const cancelRestaurantReservation = mutation({
  args: { 
    reservationId: v.id("restaurantReservations"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      throw new Error("Reserva não encontrada");
    }

    if (reservation.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    const restaurant = await ctx.db.get(reservation.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    await ctx.db.patch(args.reservationId, {
      status: BOOKING_STATUS.CANCELED,
    });

    // Schedule cancellation notification
    await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
      userId: reservation.userId,
      type: "booking_canceled",
      title: "Reserva de Restaurante Cancelada",
      message: "Sua reserva no \"" + restaurant.name + "\" foi cancelada." + (args.reason ? " Motivo: " + args.reason : ""),
      relatedId: reservation._id,
      relatedType: "restaurant_booking",
      data: {
        confirmationCode: reservation.confirmationCode,
        bookingType: "restaurant",
        assetName: restaurant.name,
      },
    });

    return null;
  },
});

/**
 * Cancel vehicle booking
 */
export const cancelVehicleBooking = mutation({
  args: { 
    bookingId: v.id("vehicleBookings"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    const vehicle = await ctx.db.get(booking.vehicleId);
    if (!vehicle) {
      throw new Error("Veículo não encontrado");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    // Schedule cancellation notification
    await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
      userId: booking.userId,
      type: "booking_canceled",
      title: "Reserva de Veículo Cancelada",
      message: "Sua reserva para \"" + vehicle.name + "\" foi cancelada." + (args.reason ? " Motivo: " + args.reason : ""),
      relatedId: booking._id,
      relatedType: "vehicle_booking",
      data: {
        bookingType: "vehicle",
        assetName: vehicle.name,
      },
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
    partnerNotes: v.optional(v.string()),
    assetInfo: assetInfoValidator, // Adicionado
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

    const activity = await ctx.db.get(booking.activityId);
    if (!activity) {
      throw new Error("Atividade não encontrada");
    }

    // Authorization check
    const isMaster = user.role === "master";
    const isPartner = user._id === activity.partnerId;

    if (!isMaster && !isPartner) {
      throw new Error("Não autorizado a confirmar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Reserva já está confirmada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    // Update booking status
    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CONFIRMED,
      ...(args.partnerNotes && { partnerNotes: args.partnerNotes }),
      updatedAt: Date.now(),
    });

    // Create voucher for confirmed booking
    const voucherId = await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucher, {
      bookingId: booking._id,
      bookingType: "activity",
      partnerId: user._id,
      customerId: booking.userId,
      expiresAt: booking.date,
    });

    // Schedule notification for the user
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingConfirmationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "activity",
      assetName: activity.title,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      partnerName: user.name ?? "Equipe de Reservas",
    });

    // Get voucher details for email
    const voucher: any = await ctx.db.get(voucherId);
    if (voucher) {
      // Send voucher email with PDF attachment
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendVoucherEmail, {
        customerEmail: booking.customerInfo.email,
        customerName: booking.customerInfo.name,
        assetName: activity.title,
        bookingType: "activity",
        confirmationCode: booking.confirmationCode,
        voucherNumber: voucher.voucherNumber,
        bookingDate: booking.date,
        totalPrice: booking.totalPrice,
        partnerName: user.name,
        attachPDF: true,
        bookingDetails: {
          date: booking.date,
          time: booking.time,
          participants: booking.participants,
        },
      });
    }

    return null;
  },
});

/**
 * Confirm event booking (Partner only)
 */
export const confirmEventBooking = mutation({
  args: {
    bookingId: v.id("eventBookings"),
    partnerNotes: v.optional(v.string()),
    assetInfo: assetInfoValidator,
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

    // Authorization check
    const isMaster = user.role === "master";
    const isPartner = user._id === event.partnerId;

    if (!isMaster && !isPartner) {
      throw new Error("Não autorizado a confirmar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Reserva já está confirmada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    // Update booking status
    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CONFIRMED,
      ...(args.partnerNotes && { partnerNotes: args.partnerNotes }),
      updatedAt: Date.now(),
    });

    // Create voucher for confirmed booking
    const voucherId = await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucher, {
      bookingId: booking._id,
      bookingType: "event",
      partnerId: user._id,
      customerId: booking.userId,
      expiresAt: event.date,
    });

    // Schedule notification sending action
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingConfirmationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "event",
      assetName: event.title,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo?.email || "",
      customerName: booking.customerInfo?.name || "",
      partnerName: user.name,
    });

    // Get voucher details for email
    const voucher: any = await ctx.db.get(voucherId);
    if (voucher) {
      // Send voucher email with PDF attachment
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendVoucherEmail, {
        customerEmail: booking.customerInfo.email,
        customerName: booking.customerInfo.name,
        assetName: event.title,
        bookingType: "event",
        confirmationCode: booking.confirmationCode,
        voucherNumber: voucher.voucherNumber,
        bookingDate: event.date,
        totalPrice: booking.totalPrice,
        partnerName: user.name,
        attachPDF: true,
        bookingDetails: {
          quantity: booking.quantity,
          time: event.time,
          location: event.location,
          // duration: event.duration, // Property doesn't exist in schema
        },
      });
    }

    return null;
  },
});

/**
 * Confirm restaurant reservation (Partner only)
 */
export const confirmRestaurantReservation = mutation({
  args: {
    bookingId: v.id("restaurantReservations"),
    partnerNotes: v.optional(v.string()),
    assetInfo: assetInfoValidator,
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

    // Get restaurant to verify ownership
    const restaurant = await ctx.db.get(booking.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    // Authorization check
    const isMaster = user.role === "master";
    const isPartner = user._id === restaurant.partnerId;

    if (!isMaster && !isPartner) {
      throw new Error("Não autorizado a confirmar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Reserva já está confirmada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    // Update booking status
    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CONFIRMED,
      ...(args.partnerNotes && { partnerNotes: args.partnerNotes }),
      updatedAt: Date.now(),
    });

    // Create voucher for confirmed booking
    const voucherId = await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucher, {
      bookingId: booking._id,
      bookingType: "restaurant",
      partnerId: user._id,
      customerId: booking.userId,
      expiresAt: booking.date,
    });

    // Schedule notification sending action
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingConfirmationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "restaurant",
      assetName: restaurant.name,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.email,
      customerName: booking.name,
      partnerName: user.name,
    });

    // Get voucher details for email
    const voucher: any = await ctx.db.get(voucherId);
    if (voucher) {
      // Send voucher email with PDF attachment
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendVoucherEmail, {
        customerEmail: booking.email,
        customerName: booking.name,
        assetName: restaurant.name,
        bookingType: "restaurant",
        confirmationCode: booking.confirmationCode,
        voucherNumber: voucher.voucherNumber,
        bookingDate: booking.date + " " + booking.time,
        partnerName: user.name,
        attachPDF: true,
        bookingDetails: {
          partySize: booking.partySize,
          time: booking.time,
          date: booking.date,
        },
      });
    }

    return null;
  },
});

/**
 * Confirm vehicle booking (Partner only)
 */
export const confirmVehicleBooking = mutation({
  args: {
    bookingId: v.id("vehicleBookings"),
    partnerNotes: v.optional(v.string()),
    assetInfo: assetInfoValidator,
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

    // Authorization check
    const isMaster = user.role === "master";
    const isPartner = user._id === vehicle.ownerId;

    if (!isMaster && !isPartner) {
      throw new Error("Não autorizado a confirmar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Reserva já está confirmada");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    // Update booking status
    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CONFIRMED,
      ...(args.partnerNotes && { partnerNotes: args.partnerNotes }),
      updatedAt: Date.now(),
    });

    // Create voucher for confirmed booking
    const voucherId = await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucher, {
      bookingId: booking._id,
      bookingType: "vehicle",
      partnerId: user._id,
      customerId: booking.userId,
      expiresAt: booking.endDate,
    });

    // Schedule notification sending action
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingConfirmationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "vehicle",
      assetName: vehicle.name,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo?.email || "",
      customerName: booking.customerInfo?.name || "",
      partnerName: user.name,
    });

    // Get voucher details for email
    const voucher: any = await ctx.db.get(voucherId);
    if (voucher) {
      // Send voucher email with PDF attachment
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendVoucherEmail, {
        customerEmail: booking.customerInfo?.email || "",
        customerName: booking.customerInfo?.name || "",
        assetName: vehicle.name,
        bookingType: "vehicle",
        confirmationCode: booking.confirmationCode,
        voucherNumber: voucher.voucherNumber,
        bookingDate: booking.startDate,
        totalPrice: booking.totalPrice,
        partnerName: user.name,
        attachPDF: true,
        bookingDetails: {
          vehicleModel: vehicle.model,
          pickupLocation: booking.pickupLocation,
          returnLocation: booking.returnLocation,
          startDate: booking.startDate,
          endDate: booking.endDate,
          additionalDrivers: booking.additionalDrivers,
        },
      });
    }

    return null;
  },
});

/**
 * Confirm accommodation booking (Partner only)
 */
export const confirmAccommodationBooking = mutation({
  args: {
    bookingId: v.id("accommodationBookings"),
    partnerNotes: v.optional(v.string()),
    assetInfo: assetInfoValidator,
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

    // Get accommodation to verify ownership
    const accommodation = await ctx.db.get(booking.accommodationId);
    if (!accommodation) {
      throw new Error("Hospedagem não encontrada");
    }

    // Authorization check
    const isMaster = user.role === "master";
    const isPartner = user._id === accommodation.partnerId;

    if (!isMaster && !isPartner) {
      throw new Error("Não autorizado a confirmar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      throw new Error("Reserva já está confirmada");
    }

    // Update booking status
    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CONFIRMED,
      partnerNotes: args.partnerNotes,
      updatedAt: Date.now(),
    });

    // Generate voucher
    const voucherId = await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucher, {
      bookingId: args.bookingId,
      bookingType: "accommodation",
      partnerId: accommodation.partnerId,
      customerId: booking.userId,
    });

    // Send booking confirmation email
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingConfirmationEmail, {
      bookingId: args.bookingId,
      bookingType: "accommodation",
      assetName: accommodation.name,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      partnerName: user.name,
    });

    // Get voucher details for email
    const voucher: any = await ctx.db.get(voucherId);
    if (voucher) {
      // Send voucher email with PDF attachment
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendVoucherEmail, {
        customerEmail: booking.customerInfo.email,
        customerName: booking.customerInfo.name,
        assetName: accommodation.name,
        bookingType: "accommodation",
        confirmationCode: booking.confirmationCode,
        voucherNumber: voucher.voucherNumber,
        bookingDate: booking.checkInDate + " - " + booking.checkOutDate,
        partnerName: user.name,
        attachPDF: true,
        bookingDetails: {
          checkIn: booking.checkInDate,
          checkOut: booking.checkOutDate,
          guests: booking.guests,
          totalPrice: booking.totalPrice,
        },
      });
    }

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
  // Check if the user is an employee
  const employee = await ctx.db.get(userId);
  if (!employee || employee.role !== "employee") {
    return false;
  }
  
  // Determine asset type based on the asset ID structure
  let assetType: string;
  const assetIdStr = assetId.toString();
  if (assetIdStr.includes("activities")) {
    assetType = "activities";
  } else if (assetIdStr.includes("events")) {
    assetType = "events";
  } else if (assetIdStr.includes("restaurants")) {
    assetType = "restaurants";
  } else if (assetIdStr.includes("vehicles")) {
    assetType = "vehicles";
  } else {
    return false;
  }
  
  // Check if employee has explicit permission for this asset
  const assetPermissions = await ctx.db
    .query("assetPermissions")
    .withIndex("by_employee_asset_type", (q) => 
      q.eq("employeeId", userId).eq("assetType", assetType)
    )
    .filter((q) => q.eq(q.field("assetId"), assetIdStr))
    .collect();
  
  // If no permissions found, employee doesn't have access
  if (assetPermissions.length === 0) {
    return false;
  }
  
  // If no specific permission required, having any permission is enough
  if (!permission) {
    return true;
  }
  
  // Check if employee has the specific permission
  return assetPermissions.some(p => p.permissions.includes(permission));
}

/**
 * Seed test data for traveler user - only for development/testing
 */
export const seedTestReservations = mutation({
  args: {
    travelerEmail: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    reservationsCreated: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "master") {
      throw new Error("Apenas usuários master podem executar esta operação");
    }

    // Find traveler user by email
    const travelerUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.travelerEmail))
      .unique();

    if (!travelerUser) {
      throw new Error("Usuário traveler não encontrado");
    }

    const now = Date.now();
    const tomorrow = now + 24 * 60 * 60 * 1000; // Tomorrow
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000; // Next week
    const nextMonth = now + 30 * 24 * 60 * 60 * 1000; // Next month

    let reservationsCreated = 0;

    try {
      // Create test activity booking
      const activityId = await ctx.db.insert("activities", {
        title: "Passeio de Barco - Baía dos Golfinhos",
        description: "Explore a vida marinha em um dos melhores pontos de Fernando de Noronha",
        shortDescription: "Tour pela famosa Baía dos Golfinhos",
        price: 150.0,
        category: "adventure",
        duration: "4 horas",
        maxParticipants: BigInt(10),
        minParticipants: BigInt(2),
        difficulty: "easy",
        rating: 4.8,
        imageUrl: "/images/activity-dolphins.jpg",
        galleryImages: ["/images/activity-dolphins-1.jpg", "/images/activity-dolphins-2.jpg"],
        highlights: ["Observação de golfinhos", "Mergulho livre", "Lanche incluído"],
        includes: ["Equipamento de mergulho", "Guia especializado", "Seguro"],
        itineraries: ["9:00 - Embarque", "10:00 - Chegada na Baía", "12:00 - Retorno"],
        excludes: ["Transporte terrestre"],
        additionalInfo: ["Necessário saber nadar"],
        cancelationPolicy: ["Cancelamento gratuito até 24h antes"],
        isFeatured: true,
        isActive: true,
        hasMultipleTickets: false,
        partnerId: currentUser._id,
      });

      await ctx.db.insert("activityBookings", {
        activityId,
        userId: travelerUser._id,
        date: new Date(nextWeek).toISOString().split('T')[0],
        participants: 2,
        totalPrice: 300.0,
        status: "confirmed",
        confirmationCode: "ACT001",
        customerInfo: {
          name: travelerUser.name || "Usuário",
          email: travelerUser.email || args.travelerEmail,
          phone: travelerUser.phoneNumber || "+55 00 00000-0000",
        },
        createdAt: now,
        updatedAt: now,
      });
      reservationsCreated++;

      // Create test restaurant reservation
      const restaurantId = await ctx.db.insert("restaurants", {
        name: "Sol & Mar Noronha",
        slug: "sol-e-mar-noronha",
        description: "Restaurante de frutos do mar com vista panorâmica para o oceano",
        description_long: "Localizado na Vila dos Remédios, oferece pratos da culinária regional com ingredientes frescos locais",
        address: {
          street: "Vila dos Remédios, s/n",
          city: "Fernando de Noronha",
          state: "PE",
          zipCode: "53990-000",
          neighborhood: "Vila dos Remédios",
          coordinates: { latitude: -3.8536, longitude: -32.4297 },
        },
        phone: "+55 81 3619-1234",
        cuisine: ["frutos do mar", "regional"],
        priceRange: "moderate",
        diningStyle: "Casual",
        hours: {
          Monday: ["11:30-15:00", "18:00-22:00"],
          Tuesday: ["11:30-15:00", "18:00-22:00"],
          Wednesday: ["11:30-15:00", "18:00-22:00"],
          Thursday: ["11:30-15:00", "18:00-22:00"],
          Friday: ["11:30-15:00", "18:00-23:00"],
          Saturday: ["11:30-15:00", "18:00-23:00"],
          Sunday: ["11:30-15:00", "18:00-22:00"],
        },
        paymentOptions: ["dinheiro", "cartao", "pix"],
        acceptsReservations: true,
        maximumPartySize: BigInt(8),
        mainImage: "/images/restaurant-sol-mar.jpg",
        galleryImages: ["/images/restaurant-sol-mar-1.jpg"],
        rating: {
          overall: 4.7,
          food: 4.8,
          service: 4.6,
          ambience: 4.7,
          value: 4.5,
          noiseLevel: "moderate",
          totalReviews: BigInt(156),
        },
        features: ["vista-mar", "ar-condicionado", "wifi"],
        isFeatured: true,
        isActive: true,
        tags: ["frutos-do-mar", "vista-mar", "romantico"],
        partnerId: currentUser._id,
      });

      await ctx.db.insert("restaurantReservations", {
        restaurantId,
        userId: travelerUser._id,
        date: new Date(tomorrow).toISOString().split('T')[0],
        time: "19:30",
        partySize: 2,
        name: travelerUser.name || "Usuário",
        email: travelerUser.email || args.travelerEmail,
        phone: travelerUser.phoneNumber || "+55 00 00000-0000",
        status: BOOKING_STATUS.AWAITING_CONFIRMATION,
        confirmationCode: "REST001",
      });
      reservationsCreated++;

      // Create test accommodation booking
      const accommodationId = await ctx.db.insert("accommodations", {
        name: "Pousada Mar Azul",
        slug: "pousada-mar-azul",
        description: "Pousada aconchegante com vista para o mar",
        description_long: "Localizada na Praia do Sueste, oferece quartos confortáveis com vista panorâmica para o oceano",
        address: {
          street: "Estrada da Praia do Sueste, 100",
          city: "Fernando de Noronha",
          state: "PE",
          zipCode: "53990-000",
          neighborhood: "Praia do Sueste",
          coordinates: { latitude: -3.8536, longitude: -32.4297 },
        },
        phone: "+55 81 3619-5678",
        type: "pousada",
        checkInTime: "14:00",
        checkOutTime: "12:00",
        pricePerNight: 320.0,
        currency: "BRL",
        totalRooms: BigInt(12),
        maxGuests: BigInt(4),
        bedrooms: BigInt(2),
        bathrooms: BigInt(1),
        beds: { single: BigInt(0), double: BigInt(2), queen: BigInt(0), king: BigInt(0) },
        area: 45,
        amenities: ["wifi", "ar-condicionado", "cafe-da-manha", "vista-mar"],
        houseRules: ["Não permitido fumar", "Não permitido festas"],
        cancellationPolicy: "Cancelamento gratuito até 24h antes",
        petsAllowed: false,
        smokingAllowed: false,
        eventsAllowed: false,
        minimumStay: BigInt(2),
        mainImage: "/images/pousada-mar-azul.jpg",
        galleryImages: ["/images/pousada-mar-azul-1.jpg"],
        rating: {
          overall: 4.6,
          cleanliness: 4.7,
          location: 4.8,
          checkin: 4.5,
          value: 4.4,
          accuracy: 4.6,
          communication: 4.5,
          totalReviews: BigInt(89),
        },
        tags: ["vista-mar", "aconchegante", "cafe-da-manha"],
        isActive: true,
        isFeatured: true,
        partnerId: currentUser._id,
      });

      const checkInDate = new Date(nextMonth);
      const checkOutDate = new Date(nextMonth + 3 * 24 * 60 * 60 * 1000); // 3 days later

      await ctx.db.insert("accommodationBookings", {
        accommodationId,
        userId: travelerUser._id,
        checkInDate: checkInDate.toISOString().split('T')[0],
        checkOutDate: checkOutDate.toISOString().split('T')[0],
        guests: BigInt(2),
        totalPrice: 960.0, // 3 nights * 320
        status: "confirmed",
        confirmationCode: "HOTEL001",
        customerInfo: {
          name: travelerUser.name || "Usuário",
          email: travelerUser.email || args.travelerEmail,
          phone: travelerUser.phoneNumber || "+55 00 00000-0000",
        },
        createdAt: now,
        updatedAt: now,
      });
      reservationsCreated++;

      return {
        success: true,
        message: reservationsCreated + " reservas de teste criadas com sucesso para " + args.travelerEmail,
        reservationsCreated,
      };

    } catch (error) {
      console.error("Erro ao criar dados de teste:", error);
      return {
        success: false,
        message: "Erro ao criar dados de teste: " + error,
        reservationsCreated,
      };
    }
  },
});

/**
 * Generic booking cancellation function for travelers
 * Determines the type of booking and calls the appropriate specific cancel function
 */
export const cancelBooking = mutation({
  args: {
    reservationId: v.string(),
    reservationType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("accommodation")
    ),
    reason: v.optional(v.string()),
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

    // Check if user is a traveler (only travelers can cancel their own bookings through this function)
    if (user.role !== "traveler") {
      throw new Error("Apenas viajantes podem cancelar suas próprias reservas através desta função");
    }

    try {
      // Call the appropriate specific cancel function based on reservation type
      switch (args.reservationType) {
        case "activity":
          await ctx.runMutation(internal.domains.bookings.mutations.cancelActivityBookingInternal, {
            bookingId: args.reservationId as Id<"activityBookings">,
            userId: user._id,
            reason: args.reason,
          });
          break;

        case "event":
          await ctx.runMutation(internal.domains.bookings.mutations.cancelEventBookingInternal, {
            bookingId: args.reservationId as Id<"eventBookings">,
            userId: user._id,
            reason: args.reason,
          });
          break;

        case "restaurant":
          await ctx.runMutation(internal.domains.bookings.mutations.cancelRestaurantReservationInternal, {
            reservationId: args.reservationId as Id<"restaurantReservations">,
            userId: user._id,
            reason: args.reason,
          });
          break;

        case "vehicle":
          await ctx.runMutation(internal.domains.bookings.mutations.cancelVehicleBookingInternal, {
            bookingId: args.reservationId as Id<"vehicleBookings">,
            userId: user._id,
            reason: args.reason,
          });
          break;

        case "accommodation":
          await ctx.runMutation(internal.domains.bookings.mutations.cancelAccommodationBookingInternal, {
            bookingId: args.reservationId as Id<"accommodationBookings">,
            userId: user._id,
            reason: args.reason,
          });
          break;

        default:
          throw new Error("Tipo de reserva não reconhecido");
      }
    } catch (error) {
      throw new Error("Erro ao cancelar reserva: " + error);
    }

    return null;
  },
});

/**
 * Internal function to cancel activity booking with user permission validation
 */
export const cancelActivityBookingInternal = mutation({
  args: {
    bookingId: v.id("activityBookings"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Verify that the user owns this booking
    if (booking.userId !== args.userId) {
      throw new Error("Você não tem permissão para cancelar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    const activity = await ctx.db.get(booking.activityId);
    if (!activity) {
      throw new Error("Atividade não encontrada");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    // Schedule cancellation notification
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingCancellationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "activity",
      assetName: activity.title,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      reason: args.reason,
    });

    // Send cancellation email to customer
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingCancelledEmail, {
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      assetName: activity.title,
      bookingType: "activity",
      confirmationCode: booking.confirmationCode,
      reason: args.reason,
    });

    return null;
  },
});

/**
 * Internal function to cancel event booking with user permission validation
 */
export const cancelEventBookingInternal = mutation({
  args: {
    bookingId: v.id("eventBookings"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Verify that the user owns this booking
    if (booking.userId !== args.userId) {
      throw new Error("Você não tem permissão para cancelar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    const event = await ctx.db.get(booking.eventId);
    if (!event) {
      throw new Error("Evento não encontrado");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    // Schedule cancellation notification
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingCancellationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "event",
      assetName: event.title,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      reason: args.reason,
    });

    // Send cancellation email to customer
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingCancelledEmail, {
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      assetName: event.title,
      bookingType: "event",
      confirmationCode: booking.confirmationCode,
      reason: args.reason,
    });

    return null;
  },
});

/**
 * Internal function to cancel restaurant reservation with user permission validation
 */
export const cancelRestaurantReservationInternal = mutation({
  args: {
    reservationId: v.id("restaurantReservations"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) {
      throw new Error("Reserva não encontrada");
    }

    // Verify that the user owns this reservation
    if (reservation.userId !== args.userId) {
      throw new Error("Você não tem permissão para cancelar esta reserva");
    }

    if (reservation.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    const restaurant = await ctx.db.get(reservation.restaurantId);
    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    await ctx.db.patch(args.reservationId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    // Schedule cancellation notification
    await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
      userId: reservation.userId,
      type: "booking_canceled",
      title: "Reserva de Restaurante Cancelada",
      message: "Sua reserva no \"" + restaurant.name + "\" foi cancelada." + (args.reason ? " Motivo: " + args.reason : ""),
      relatedId: reservation._id,
      relatedType: "restaurant_booking",
      data: {
        confirmationCode: reservation.confirmationCode,
        bookingType: "restaurant",
        assetName: restaurant.name,
      },
    });

    return null;
  },
});

/**
 * Internal function to cancel vehicle booking with user permission validation
 */
export const cancelVehicleBookingInternal = mutation({
  args: {
    bookingId: v.id("vehicleBookings"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Verify that the user owns this booking
    if (booking.userId !== args.userId) {
      throw new Error("Você não tem permissão para cancelar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    const vehicle = await ctx.db.get(booking.vehicleId);
    if (!vehicle) {
      throw new Error("Veículo não encontrado");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    // Schedule cancellation notification
    await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
      userId: booking.userId,
      type: "booking_canceled",
      title: "Reserva de Veículo Cancelada",
      message: "Sua reserva para \"" + vehicle.name + "\" foi cancelada." + (args.reason ? " Motivo: " + args.reason : ""),
      relatedId: booking._id,
      relatedType: "vehicle_booking",
      data: {
        bookingType: "vehicle",
        assetName: vehicle.name,
      },
    });

    return null;
  },
});

/**
 * Internal function to cancel accommodation booking with user permission validation
 */
export const cancelAccommodationBookingInternal = mutation({
  args: {
    bookingId: v.id("accommodationBookings"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Verify that the user owns this booking
    if (booking.userId !== args.userId) {
      throw new Error("Você não tem permissão para cancelar esta reserva");
    }

    if (booking.status === BOOKING_STATUS.CANCELED) {
      throw new Error("Reserva já foi cancelada");
    }

    const accommodation = await ctx.db.get(booking.accommodationId);
    if (!accommodation) {
      throw new Error("Hospedagem não encontrada");
    }

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      updatedAt: Date.now(),
    });

    // Schedule cancellation notification
    await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendBookingCancellationNotification, {
      userId: booking.userId,
      bookingId: booking._id,
      bookingType: "accommodation",
      assetName: accommodation.name,
      confirmationCode: booking.confirmationCode,
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      reason: args.reason,
    });

    // Send cancellation email to customer
    await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingCancelledEmail, {
      customerEmail: booking.customerInfo.email,
      customerName: booking.customerInfo.name,
      assetName: accommodation.name,
      bookingType: "accommodation",
      confirmationCode: booking.confirmationCode,
      reason: args.reason,
    });

    return null;
  },
});

/**
 * Update booking status after payment initiation
 * Called when user is redirected to Stripe Checkout
 */
export const updateBookingPaymentInitiated = mutation({
  args: v.object({
    bookingId: v.string(),
    bookingType: v.union(v.literal("activity"), v.literal("event"), v.literal("accommodation"), v.literal("vehicle"), v.literal("restaurant")),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get the appropriate booking based on type
    let booking;
    let tableName;
    
    switch (args.bookingType) {
      case "activity":
        booking = await ctx.db.get(args.bookingId as Id<"activityBookings">);
        tableName = "activityBookings";
        break;
      case "event":
        booking = await ctx.db.get(args.bookingId as Id<"eventBookings">);
        tableName = "eventBookings";
        break;
      case "accommodation":
        booking = await ctx.db.get(args.bookingId as Id<"accommodationBookings">);
        tableName = "accommodationBookings";
        break;
      case "vehicle":
        booking = await ctx.db.get(args.bookingId as Id<"vehicleBookings">);
        tableName = "vehicleBookings";
        break;
      case "restaurant":
        booking = await ctx.db.get(args.bookingId as Id<"restaurantReservations">);
        tableName = "restaurantReservations";
        break;
    }

    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Update booking with payment session info and status
    await ctx.db.patch(booking._id, {
      status: BOOKING_STATUS.PAYMENT_PENDING,
      paymentStatus: PAYMENT_STATUS.PROCESSING,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      stripePaymentLinkId: args.stripePaymentLinkId,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update booking status (for payment processing)
 * Called when payment is authorized but not captured yet
 */
export const updateBookingStatus = mutation({
  args: v.object({
    bookingId: v.string(),
    bookingType: v.union(v.literal("activity"), v.literal("event"), v.literal("accommodation"), v.literal("vehicle"), v.literal("restaurant")),
    status: v.string(),
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log("[DEBUG] Updating booking status for " + args.bookingType + ":", {
      bookingId: args.bookingId,
      bookingType: args.bookingType,
      status: args.status,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      stripePaymentIntentId: args.stripePaymentIntentId
    });
    
    let booking;
    
    // Find booking by ID and type
    switch (args.bookingType) {
      case "activity":
        booking = await ctx.db.get(args.bookingId as Id<"activityBookings">);
        break;
      case "event":
        booking = await ctx.db.get(args.bookingId as Id<"eventBookings">);
        break;
      case "accommodation":
        booking = await ctx.db.get(args.bookingId as Id<"accommodationBookings">);
        break;
      case "vehicle":
        booking = await ctx.db.get(args.bookingId as Id<"vehicleBookings">);
        break;
      case "restaurant":
        booking = await ctx.db.get(args.bookingId as Id<"restaurantReservations">);
        break;
    }

    if (!booking) {
      console.error("[ERROR] Booking not found for " + args.bookingType + ":", args.bookingId);
      throw new Error("Reserva não encontrada");
    }

    console.log("[DEBUG] Current booking status for " + args.bookingType + ":", {
      currentStatus: booking.status,
      currentPaymentStatus: booking.paymentStatus,
      bookingId: booking._id
    });

    // Update booking status and stripe information
    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.stripeCheckoutSessionId) {
      updateData.stripeCheckoutSessionId = args.stripeCheckoutSessionId;
    }

    if (args.stripePaymentIntentId) {
      updateData.stripePaymentIntentId = args.stripePaymentIntentId;
    }

    await ctx.db.patch(booking._id, updateData);
    
    console.log("[SUCCESS] Successfully updated " + args.bookingType + " booking status:", {
      bookingId: booking._id,
      newStatus: args.status,
      updateData
    });
  },
});

/**
 * Update booking after successful payment
 * Called by Stripe webhook or after checkout completion
 */
export const updateBookingPaymentSuccess = mutation({
  args: v.object({
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    bookingId: v.optional(v.string()),
    bookingType: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let booking;
    
    // Find booking by Stripe session ID if provided
    if (args.stripeCheckoutSessionId) {
      // Search across all booking tables
      const activityBooking = await ctx.db
        .query("activityBookings")
        .filter(q => q.eq(q.field("stripeCheckoutSessionId"), args.stripeCheckoutSessionId))
        .first();
        
      const eventBooking = await ctx.db
        .query("eventBookings")
        .filter(q => q.eq(q.field("stripeCheckoutSessionId"), args.stripeCheckoutSessionId))
        .first();
        
      const accommodationBooking = await ctx.db
        .query("accommodationBookings")
        .filter(q => q.eq(q.field("stripeCheckoutSessionId"), args.stripeCheckoutSessionId))
        .first();
        
      const vehicleBooking = await ctx.db
        .query("vehicleBookings")
        .filter(q => q.eq(q.field("stripeCheckoutSessionId"), args.stripeCheckoutSessionId))
        .first();
        
      booking = activityBooking || eventBooking || accommodationBooking || vehicleBooking;
    }
    // Or find by booking ID if provided
    else if (args.bookingId && args.bookingType) {
      switch (args.bookingType) {
        case "activity":
          booking = await ctx.db.get(args.bookingId as Id<"activityBookings">);
          break;
        case "event":
          booking = await ctx.db.get(args.bookingId as Id<"eventBookings">);
          break;
        case "accommodation":
          booking = await ctx.db.get(args.bookingId as Id<"accommodationBookings">);
          break;
        case "vehicle":
          booking = await ctx.db.get(args.bookingId as Id<"vehicleBookings">);
          break;
      }
    }

    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Update booking status
    await ctx.db.patch(booking._id, {
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: PAYMENT_STATUS.PAID,
      stripePaymentIntentId: args.stripePaymentIntentId,
      updatedAt: Date.now(),
    });

    // Get the booking type
    const bookingType = args.bookingType || 
      (booking._id.startsWith("activityBookings") ? "activity" :
       booking._id.startsWith("eventBookings") ? "event" :
       booking._id.startsWith("accommodationBookings") ? "accommodation" :
       booking._id.startsWith("vehicleBookings") ? "vehicle" : "unknown");

    // Generate voucher for confirmed booking
    try {
      // Get partner ID from booking's associated asset
      let partnerId: string;
      let customerId: string = booking.userId;
      
      switch (bookingType) {
        case "activity":
          const activity = await ctx.db.get(booking.activityId);
          partnerId = (activity as any)?.partnerId;
          break;
        case "event":
          const event = await ctx.db.get(booking.eventId);
          partnerId = (event as any)?.partnerId;
          break;
        case "accommodation":
          const accommodation = await ctx.db.get(booking.accommodationId);
          partnerId = (accommodation as any)?.partnerId;
          break;
        case "vehicle":
          const vehicle = await ctx.db.get(booking.vehicleId);
          partnerId = (vehicle as any)?.partnerId;
          break;
        case "restaurant":
          const restaurant = await ctx.db.get(booking.restaurantId);
          partnerId = (restaurant as any)?.partnerId;
          break;
        default:
          throw new Error("Tipo de reserva não suportado: " + bookingType);
      }
      
      if (!partnerId) {
        throw new Error("Partner ID não encontrado para esta reserva");
      }
      
      const voucher = await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucher, {
        bookingId: booking._id,
        bookingType,
        partnerId,
        customerId,
      });
      
      console.log("[SUCCESS] Voucher generated for " + bookingType + " booking: " + voucher.voucherNumber);
      
      // Send voucher email based on booking type
      const customerEmail = booking.customerInfo?.email || booking.email || booking.customerEmail;
      const customerName = booking.customerInfo?.name || booking.name || booking.customerName;
      
      // Get asset name for email
      let assetName = "Serviço";
      switch (bookingType) {
        case "activity":
          const activity = await ctx.db.get(booking.activityId);
          assetName = (activity as any)?.name || "Atividade";
          break;
        case "event":
          const event = await ctx.db.get(booking.eventId);
          assetName = (event as any)?.name || "Evento";
          break;
        case "accommodation":
          const accommodation = await ctx.db.get(booking.accommodationId);
          assetName = (accommodation as any)?.name || "Hospedagem";
          break;
        case "vehicle":
          const vehicle = await ctx.db.get(booking.vehicleId);
          assetName = (vehicle as any)?.name || "Veículo";
          break;
        case "restaurant":
          const restaurant = await ctx.db.get(booking.restaurantId);
          assetName = (restaurant as any)?.name || "Restaurante";
          break;
      }
      
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendVoucherEmail, {
        voucherNumber: voucher.voucherNumber,
        customerEmail: customerEmail,
        customerName: customerName,
        assetName: assetName,
        bookingType: bookingType,
        confirmationCode: booking.confirmationCode,
        bookingDetails: {},
      });
      
      console.log("[SUCCESS] Voucher email sent for: " + voucher.voucherNumber);
      
    } catch (voucherError) {
      console.error("Error generating voucher:", voucherError);
      // Don't throw - voucher generation failure shouldn't fail the payment update
    }

    // Send confirmation emails
    await sendBookingPaymentConfirmationEmails(ctx, booking);
  },
});

/**
 * Update booking after payment failure
 */
export const updateBookingPaymentFailed = mutation({
  args: v.object({
    stripeCheckoutSessionId: v.optional(v.string()),
    bookingId: v.optional(v.string()),
    bookingType: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let booking;
    
    // Find booking (similar logic to updateBookingPaymentSuccess)
    if (args.stripeCheckoutSessionId) {
      // Search logic here...
    } else if (args.bookingId && args.bookingType) {
      // Direct lookup logic here...
    }

    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Update booking status
    await ctx.db.patch(booking._id, {
      status: BOOKING_STATUS.DRAFT,
      paymentStatus: PAYMENT_STATUS.FAILED,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Expire bookings with incomplete payments
 * Should be called by a cron job
 */
export const expireIncompletedBookings = mutation({
  args: v.object({}),
  handler: async (ctx) => {
    const expirationTime = Date.now() - (30 * 60 * 1000); // 30 minutes
    
    // Find all draft bookings older than expiration time
    const draftActivityBookings = await ctx.db
      .query("activityBookings")
      .filter(q => 
        q.and(
          q.eq(q.field("status"), BOOKING_STATUS.DRAFT),
          q.lt(q.field("createdAt"), expirationTime)
        )
      )
      .collect();
      
    // Update each to expired
    for (const booking of draftActivityBookings) {
      await ctx.db.patch(booking._id, {
        status: BOOKING_STATUS.EXPIRED,
        paymentStatus: PAYMENT_STATUS.CANCELED,
        updatedAt: Date.now(),
      });
    }
    
    // Repeat for other booking types...
  },
});

// Helper function to send payment confirmation emails
async function sendBookingPaymentConfirmationEmails(ctx: MutationCtx, booking: any) {
  // Implementation to send emails after successful payment
  // This would include logic to identify booking type and send appropriate emails
}

/**
 * Update booking statuses based on activity dates
 * Called by cron job hourly
 */
export const updateBookingStatusesByDate = mutation({
  args: v.object({}),
  handler: async (ctx) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Update activity bookings
    const confirmedActivityBookings = await ctx.db
      .query("activityBookings")
      .filter(q => q.eq(q.field("status"), BOOKING_STATUS.CONFIRMED))
      .collect();

    for (const booking of confirmedActivityBookings) {
      // Check if activity date/time has started
      if (booking.date < todayStr || 
          (booking.date === todayStr && booking.time && booking.time <= currentTime)) {
        await ctx.db.patch(booking._id, {
          status: BOOKING_STATUS.IN_PROGRESS,
          updatedAt: Date.now(),
        });
      }
    }

    // Update in-progress bookings that should be completed
    const inProgressActivityBookings = await ctx.db
      .query("activityBookings")
      .filter(q => q.eq(q.field("status"), BOOKING_STATUS.IN_PROGRESS))
      .collect();

    for (const booking of inProgressActivityBookings) {
      // If the activity date has passed, mark as completed
      if (booking.date < todayStr) {
        await ctx.db.patch(booking._id, {
          status: BOOKING_STATUS.COMPLETED,
          updatedAt: Date.now(),
        });
      }
    }

    // Similar logic for other booking types...
    // Events - check date and time
    const confirmedEventBookings = await ctx.db
      .query("eventBookings")
      .filter(q => q.eq(q.field("status"), BOOKING_STATUS.CONFIRMED))
      .collect();

    for (const booking of confirmedEventBookings) {
      const event = await ctx.db.get(booking.eventId);
      if (event && (event.date < todayStr || 
          (event.date === todayStr && event.time <= currentTime))) {
        await ctx.db.patch(booking._id, {
          status: BOOKING_STATUS.IN_PROGRESS,
          updatedAt: Date.now(),
        });
      }
    }

    // Accommodations - check check-in date
    const confirmedAccommodationBookings = await ctx.db
      .query("accommodationBookings")
      .filter(q => q.eq(q.field("status"), BOOKING_STATUS.CONFIRMED))
      .collect();

    for (const booking of confirmedAccommodationBookings) {
      if (booking.checkInDate <= todayStr && booking.checkOutDate > todayStr) {
        await ctx.db.patch(booking._id, {
          status: BOOKING_STATUS.IN_PROGRESS,
          updatedAt: Date.now(),
        });
      } else if (booking.checkOutDate <= todayStr) {
        await ctx.db.patch(booking._id, {
          status: BOOKING_STATUS.COMPLETED,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

/**
 * Mark no-show bookings
 * Called daily to identify confirmed bookings where customers didn't show up
 */
export const markNoShowBookings = mutation({
  args: v.object({}),
  handler: async (ctx) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Find confirmed bookings from yesterday that weren't marked as in-progress or completed
    
    // Activity bookings
    const missedActivityBookings = await ctx.db
      .query("activityBookings")
      .filter(q => 
        q.and(
          q.eq(q.field("status"), BOOKING_STATUS.CONFIRMED),
          q.lte(q.field("date"), yesterdayStr)
        )
      )
      .collect();

    for (const booking of missedActivityBookings) {
      await ctx.db.patch(booking._id, {
        status: BOOKING_STATUS.NO_SHOW,
        updatedAt: Date.now(),
      });

      // Notify partner about no-show
      const activity = await ctx.db.get(booking.activityId);
      if (activity) {
        await ctx.scheduler.runAfter(0, internal.domains.notifications.actions.sendNotification, {
          userId: activity.partnerId,
          type: "booking_no_show",
          title: "Cliente não compareceu",
          message: "O cliente " + booking.customerInfo.name + " não compareceu à atividade " + activity.title,
          relatedId: booking._id,
          relatedType: "activity_booking",
        });
      }
    }

    // Similar logic for other booking types...
    
    // Event bookings
    const missedEventBookings = await ctx.db
      .query("eventBookings")
      .filter(q => q.eq(q.field("status"), BOOKING_STATUS.CONFIRMED))
      .collect();

    for (const booking of missedEventBookings) {
      const event = await ctx.db.get(booking.eventId);
      if (event && event.date <= yesterdayStr) {
        await ctx.db.patch(booking._id, {
          status: BOOKING_STATUS.NO_SHOW,
          updatedAt: Date.now(),
        });
      }
    }

    // Restaurant reservations
    const missedRestaurantReservations = await ctx.db
      .query("restaurantReservations")
      .filter(q => 
        q.and(
          q.eq(q.field("status"), BOOKING_STATUS.CONFIRMED),
          q.lte(q.field("date"), yesterdayStr)
        )
      )
      .collect();

    for (const reservation of missedRestaurantReservations) {
      await ctx.db.patch(reservation._id, {
        status: BOOKING_STATUS.NO_SHOW,
        updatedAt: Date.now(),
      });
    }
  },
});