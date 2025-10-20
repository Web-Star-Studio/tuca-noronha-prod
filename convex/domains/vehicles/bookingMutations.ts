/**
 * Vehicle Booking Mutations - Fluxo completo de reserva de veículos
 * 
 * FLUXO:
 * 1. Viajante solicita reserva (requestVehicleBooking) → status: pending_request
 * 2. Admin confirma com valor real (confirmBookingWithPrice) → status: awaiting_payment
 * 3. Viajante paga (processVehiclePayment) → status: paid
 * 
 * OU: Admin rejeita (rejectBookingRequest) → status: rejected
 * OU: Viajante cancela (cancelBooking) → status: canceled
 */

import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac/utils";
import { generateConfirmationCode } from "../bookings/utils";

// Status possíveis
export const BOOKING_STATUS = {
  PENDING_REQUEST: "pending_request",       // Solicitação feita, aguardando admin
  CONFIRMED: "confirmed",                   // Admin confirmou com valor real
  AWAITING_PAYMENT: "awaiting_payment",     // Aguardando pagamento do viajante
  PAID: "paid",                             // Pagamento realizado
  COMPLETED: "completed",                   // Reserva concluída (após uso)
  CANCELED: "canceled",                     // Cancelada pelo viajante
  REJECTED: "rejected",                     // Rejeitada pelo admin
  EXPIRED: "expired",                       // Prazo de pagamento expirou
} as const;

/**
 * 1. SOLICITAÇÃO DE RESERVA PELO VIAJANTE
 * - Não paga neste momento
 * - Apenas solicita com valor estimado
 */
export const requestVehicleBooking = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    startDate: v.number(),
    endDate: v.number(),
    pickupLocation: v.optional(v.string()),
    returnLocation: v.optional(v.string()),
    additionalDrivers: v.optional(v.number()),
    additionalOptions: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
  },
  returns: v.object({
    bookingId: v.id("vehicleBookings"),
    confirmationCode: v.string(),
    estimatedPrice: v.number(),
  }),
  handler: async (ctx, args) => {
    console.log("[VEHICLE BOOKING] Iniciando requestVehicleBooking:", {
      vehicleId: args.vehicleId,
      startDate: args.startDate,
      endDate: args.endDate,
      customerInfo: args.customerInfo,
    });

    const userId = await getCurrentUserConvexId(ctx);
    console.log("[VEHICLE BOOKING] UserId obtido:", userId);
    
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    // Buscar veículo para pegar o preço estimado
    const vehicle = await ctx.db.get(args.vehicleId);
    console.log("[VEHICLE BOOKING] Veículo encontrado:", vehicle ? "SIM" : "NÃO");
    
    if (!vehicle) {
      throw new Error("Veículo não encontrado");
    }

    // Calcular número de dias
    const days = Math.ceil((args.endDate - args.startDate) / (1000 * 60 * 60 * 24));
    const estimatedPrice = vehicle.estimatedPricePerDay * days;
    
    console.log("[VEHICLE BOOKING] Cálculos:", { days, estimatedPrice });

    // Generate confirmation code
    const startDateString = new Date(args.startDate).toISOString().split('T')[0];
    const customerName = args.customerInfo?.name || 'Guest';
    const confirmationCode = generateConfirmationCode(startDateString, customerName);
    const now = Date.now();

    console.log("[VEHICLE BOOKING] Preparando insert:", {
      confirmationCode,
      customerName,
      startDateString,
    });

    // Criar reserva com status pending_request
    const bookingId = await ctx.db.insert("vehicleBookings", {
      vehicleId: args.vehicleId,
      userId: userId, // Garante que é Id<"users">
      startDate: args.startDate,
      endDate: args.endDate,
      estimatedPrice,
      totalPrice: estimatedPrice, // Inicialmente igual ao estimado
      status: BOOKING_STATUS.PENDING_REQUEST,
      pickupLocation: args.pickupLocation,
      returnLocation: args.returnLocation,
      additionalDrivers: args.additionalDrivers,
      additionalOptions: args.additionalOptions,
      notes: args.notes,
      customerInfo: args.customerInfo,
      confirmationCode,
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    console.log("[VEHICLE BOOKING] Reserva criada com sucesso:", bookingId);

    // TODO: Enviar notificação para admin
    // await ctx.scheduler.runAfter(0, internal.notifications.notifyAdminNewBookingRequest, {
    //   bookingId,
    //   vehicleName: vehicle.name,
    // });

    return {
      bookingId,
      confirmationCode,
      estimatedPrice,
    };
  },
});

/**
 * 2. ADMIN CONFIRMA RESERVA COM VALOR REAL
 * - Define o preço final
 * - Define prazo de 24h para pagamento
 */
export const confirmBookingWithPrice = mutation({
  args: {
    bookingId: v.id("vehicleBookings"),
    finalPrice: v.number(),
    adminNotes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    paymentDeadline: v.number(),
  }),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role !== "master" && role !== "partner") {
      throw new Error("Apenas administradores podem confirmar reservas");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.status !== BOOKING_STATUS.PENDING_REQUEST) {
      throw new Error(`Reserva não pode ser confirmada no status atual: ${booking.status}`);
    }

    const now = Date.now();
    const paymentDeadline = now + (24 * 60 * 60 * 1000); // 24 horas

    await ctx.db.patch(args.bookingId, {
      finalPrice: args.finalPrice,
      totalPrice: args.finalPrice,
      status: BOOKING_STATUS.AWAITING_PAYMENT,
      adminNotes: args.adminNotes,
      confirmedAt: now,
      paymentDeadline,
      updatedAt: now,
    });

    // Buscar dados do veículo para o email
    const vehicle = await ctx.db.get(booking.vehicleId);
    
    // Enviar email de confirmação com valor final para o viajante
    if (vehicle && booking.customerInfo) {
      try {
        const { internal } = await import("../../_generated/api");
        await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendVehicleBookingConfirmedEmail, {
          customerEmail: booking.customerInfo.email,
          customerName: booking.customerInfo.name,
          vehicleName: vehicle.name,
          confirmationCode: booking.confirmationCode,
          finalPrice: args.finalPrice,
          startDate: booking.startDate,
          endDate: booking.endDate,
          paymentDeadline,
          adminNotes: args.adminNotes,
        });
      } catch (error) {
        console.error("Erro ao agendar envio de email:", error);
        // Não falhar a mutation se o email falhar
      }
    }

    // TODO: Agendar verificação de prazo de pagamento
    // await ctx.scheduler.runAt(paymentDeadline, internal.vehicles.checkPaymentDeadline, {
    //   bookingId: args.bookingId,
    // });

    return {
      success: true,
      paymentDeadline,
    };
  },
});

/**
 * 3. ADMIN REJEITA SOLICITAÇÃO
 */
export const rejectBookingRequest = mutation({
  args: {
    bookingId: v.id("vehicleBookings"),
    adminNotes: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const role = await getCurrentUserRole(ctx);
    if (role !== "master" && role !== "partner") {
      throw new Error("Apenas administradores podem rejeitar reservas");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.status !== BOOKING_STATUS.PENDING_REQUEST) {
      throw new Error(`Reserva não pode ser rejeitada no status atual: ${booking.status}`);
    }

    const now = Date.now();

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.REJECTED,
      adminNotes: args.adminNotes,
      rejectedAt: now,
      updatedAt: now,
    });

    // TODO: Enviar notificação para viajante
    // await ctx.scheduler.runAfter(0, internal.notifications.notifyTravelerBookingRejected, {
    //   bookingId: args.bookingId,
    //   reason: args.adminNotes,
    // });

    return {
      success: true,
    };
  },
});

/**
 * 4. PROCESSAR PAGAMENTO (chamado após sucesso no Mercado Pago)
 */
export const processVehiclePayment = mutation({
  args: {
    bookingId: v.id("vehicleBookings"),
    mpPaymentId: v.string(),
    paymentMethod: v.string(),
    paymentStatus: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.userId !== userId) {
      throw new Error("Você não tem permissão para pagar esta reserva");
    }

    if (booking.status !== BOOKING_STATUS.AWAITING_PAYMENT) {
      throw new Error(`Pagamento não pode ser processado no status atual: ${booking.status}`);
    }

    // Verificar se não expirou o prazo
    if (booking.paymentDeadline && Date.now() > booking.paymentDeadline) {
      await ctx.db.patch(args.bookingId, {
        status: BOOKING_STATUS.EXPIRED,
        updatedAt: Date.now(),
      });
      throw new Error("Prazo para pagamento expirou");
    }

    const now = Date.now();

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.PAID,
      mpPaymentId: args.mpPaymentId,
      paymentMethod: args.paymentMethod,
      paymentStatus: args.paymentStatus,
      paidAt: now,
      updatedAt: now,
    });

    // TODO: Enviar notificação para admin
    // await ctx.scheduler.runAfter(0, internal.notifications.notifyAdminBookingPaid, {
    //   bookingId: args.bookingId,
    // });

    return {
      success: true,
    };
  },
});

/**
 * 5. CANCELAR RESERVA (viajante pode cancelar se não gostar do valor)
 */
export const cancelBooking = mutation({
  args: {
    bookingId: v.id("vehicleBookings"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserConvexId(ctx);
    const role = await getCurrentUserRole(ctx);

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Viajante só pode cancelar se for dele e estiver em certos status
    if (role !== "master" && role !== "partner") {
      if (booking.userId !== userId) {
        throw new Error("Você não tem permissão para cancelar esta reserva");
      }

      const cancelableStatuses = [
        BOOKING_STATUS.PENDING_REQUEST,
        BOOKING_STATUS.AWAITING_PAYMENT,
      ];

      if (!cancelableStatuses.includes(booking.status as any)) {
        throw new Error(`Reserva não pode ser cancelada no status atual: ${booking.status}`);
      }
    }

    const now = Date.now();

    await ctx.db.patch(args.bookingId, {
      status: BOOKING_STATUS.CANCELED,
      notes: args.reason ? `${booking.notes || ""}\nMotivo do cancelamento: ${args.reason}` : booking.notes,
      updatedAt: now,
    });

    // TODO: Enviar notificação apropriada
    return {
      success: true,
    };
  },
});
