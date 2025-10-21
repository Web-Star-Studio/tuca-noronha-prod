import { v } from "convex/values";

// Common booking status values - More semantic and descriptive
export const BOOKING_STATUS = {
  // Initial states - NEW WORKFLOW
  PENDING_APPROVAL: "pending_approval",           // Solicitação enviada, aguardando aprovação do admin
  
  // After admin approval
  CONFIRMED: "confirmed",                         // Confirmada pelo admin, aguardando pagamento
  AWAITING_PAYMENT: "awaiting_payment",          // Confirmada, cliente precisa pagar
  
  // Payment states
  PAYMENT_PENDING: "payment_pending",            // Pagamento em processo
  PAID: "paid",                                  // Pago com sucesso
  
  // Active states
  IN_PROGRESS: "in_progress",                    // Em andamento (para atividades/eventos)
  
  // Final states
  COMPLETED: "completed",                        // Concluída com sucesso
  CANCELED: "canceled",                          // Cancelada
  REJECTED: "rejected",                          // Rejeitada pelo admin
  NO_SHOW: "no_show",                           // Cliente não compareceu
  EXPIRED: "expired",                           // Expirada (pagamento não concluído no prazo)
  
  // Legacy (keep for compatibility)
  DRAFT: "draft",                               // Old: Reserva criada mas pagamento não iniciado
  AWAITING_CONFIRMATION: "awaiting_confirmation", // Old: Pagamento concluído, aguardando confirmação
} as const;

// Payment status values - More detailed
export const PAYMENT_STATUS = {
  NOT_REQUIRED: "not_required",        // Pagamento não necessário (reserva gratuita)
  PENDING: "pending",                  // Aguardando início do pagamento
  PROCESSING: "processing",            // Pagamento sendo processado
  AWAITING_PAYMENT_METHOD: "awaiting_payment_method", // Aguardando método de pagamento (ex: PIX)
  PAID: "paid",                       // Pago com sucesso
  PARTIALLY_PAID: "partially_paid",   // Parcialmente pago
  FAILED: "failed",                   // Falha no pagamento
  REFUNDED: "refunded",               // Reembolsado
  PARTIALLY_REFUNDED: "partially_refunded", // Parcialmente reembolsado
  CANCELED: "canceled",               // Pagamento cancelado
} as const;

// Payment method values
export const PAYMENT_METHOD = {
  CREDIT_CARD: "credit_card",
  PIX: "pix",
  BANK_TRANSFER: "bank_transfer",
  CASH: "cash",
} as const;

// Customer info validator (reusable)
export const customerInfoValidator = v.object({
  name: v.string(),
  email: v.string(),
  phone: v.string(),
  cpf: v.optional(v.string()),
});

// Activity booking validators
export const createActivityBookingValidator = v.object({
  activityId: v.id("activities"),
  ticketId: v.optional(v.id("activityTickets")),
  date: v.string(),
  time: v.optional(v.string()),
  participants: v.number(),
  adults: v.optional(v.number()),
  children: v.optional(v.number()),
  additionalParticipants: v.optional(v.array(v.string())),
  customerInfo: v.optional(customerInfoValidator),
  specialRequests: v.optional(v.string()),
  couponCode: v.optional(v.string()),
  discountAmount: v.optional(v.number()),
  finalAmount: v.optional(v.number()),
});

export const updateActivityBookingValidator = v.object({
  bookingId: v.id("activityBookings"),
  status: v.optional(v.string()),
  paymentStatus: v.optional(v.string()),
  paymentMethod: v.optional(v.string()),
  specialRequests: v.optional(v.string()),
});

// Event booking validators
export const createEventBookingValidator = v.object({
  eventId: v.id("events"),
  ticketId: v.optional(v.id("eventTickets")),
  quantity: v.number(),
  adults: v.optional(v.number()),
  children: v.optional(v.number()),
  participantNames: v.optional(v.array(v.string())),
  customerInfo: v.optional(customerInfoValidator),
  specialRequests: v.optional(v.string()),
  couponCode: v.optional(v.string()),
  discountAmount: v.optional(v.number()),
  finalAmount: v.optional(v.number()),
});

export const updateEventBookingValidator = v.object({
  bookingId: v.id("eventBookings"),
  status: v.optional(v.string()),
  paymentStatus: v.optional(v.string()),
  paymentMethod: v.optional(v.string()),
  specialRequests: v.optional(v.string()),
});

// Restaurant reservation validators
export const createRestaurantReservationValidator = v.object({
  restaurantId: v.id("restaurants"),
  date: v.string(),
  time: v.string(),
  partySize: v.number(),
  adults: v.optional(v.number()),
  children: v.optional(v.number()),
  guestNames: v.optional(v.array(v.string())),
  customerInfo: v.optional(customerInfoValidator),
  specialRequests: v.optional(v.string()),
  couponCode: v.optional(v.string()),
  discountAmount: v.optional(v.number()),
  finalAmount: v.optional(v.number()),
});

export const updateRestaurantReservationValidator = v.object({
  reservationId: v.id("restaurantReservations"),
  status: v.optional(v.string()),
  specialRequests: v.optional(v.string()),
});

// Vehicle booking validators
export const createVehicleBookingValidator = v.object({
  vehicleId: v.id("vehicles"),
  startDate: v.number(),
  endDate: v.number(),
  customerInfo: v.optional(customerInfoValidator),
  pickupLocation: v.optional(v.string()),
  returnLocation: v.optional(v.string()),
  additionalDrivers: v.optional(v.number()),
  additionalOptions: v.optional(v.array(v.string())),
  notes: v.optional(v.string()),
  couponCode: v.optional(v.string()),
  discountAmount: v.optional(v.number()),
  finalAmount: v.optional(v.number()),
});



export const updateVehicleBookingValidator = v.object({
  bookingId: v.id("vehicleBookings"),
  status: v.optional(v.string()),
  paymentStatus: v.optional(v.string()),
  paymentMethod: v.optional(v.string()),
  pickupLocation: v.optional(v.string()),
  returnLocation: v.optional(v.string()),
  notes: v.optional(v.string()),
});

// Validators for booking approval workflow
export const confirmBookingValidator = v.object({
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
  adminNotes: v.optional(v.string()),
});

export const rejectBookingValidator = v.object({
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
  adminNotes: v.string(), // Required for rejection
  rejectionReason: v.optional(v.string()),
});

export const createPaymentLinkValidator = v.object({
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
});
