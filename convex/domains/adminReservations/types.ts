import { v } from "convex/values";
import { Doc, Id } from "../../_generated/dataModel";

// Admin Reservation Types
export const AdminReservationCreationMethod = v.union(
  v.literal("admin_direct"),
  v.literal("admin_conversion"),
  v.literal("admin_group"),
  v.literal("admin_phone"),
  v.literal("admin_walkin")
);

export const AdminReservationPaymentStatus = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("cash"),
  v.literal("transfer"),
  v.literal("deferred"),
  v.literal("partial"),
  v.literal("refunded"),
  v.literal("cancelled")
);

export const AdminReservationStatus = v.union(
  v.literal("draft"),
  v.literal("confirmed"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled"),
  v.literal("no_show")
);

export const AdminReservationAssetType = v.union(
  v.literal("activities"),
  v.literal("events"),
  v.literal("restaurants"),
  v.literal("vehicles"),
  v.literal("packages")
);

// Input validators for creating admin reservations
export const CreateAdminReservationArgs = v.object({
  assetId: v.string(),
  assetType: AdminReservationAssetType,
  assetName: v.string(),
  travelerId: v.id("users"),
  reservationData: v.object({
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    guests: v.optional(v.number()),
    specialRequests: v.optional(v.string()),
    assetSpecific: v.optional(v.any()),
  }),
  createdMethod: AdminReservationCreationMethod,
  paymentStatus: AdminReservationPaymentStatus,
  totalAmount: v.number(),
  paidAmount: v.optional(v.number()),
  paymentMethod: v.optional(v.string()),
  paymentNotes: v.optional(v.string()),
  adminNotes: v.optional(v.string()),
  customerNotes: v.optional(v.string()),
  internalFlags: v.optional(v.array(v.string())),
});

export const UpdateAdminReservationArgs = v.object({
  id: v.id("adminReservations"),
  reservationData: v.optional(v.object({
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    guests: v.optional(v.number()),
    specialRequests: v.optional(v.string()),
    assetSpecific: v.optional(v.any()),
  })),
  paymentStatus: v.optional(AdminReservationPaymentStatus),
  totalAmount: v.optional(v.number()),
  paidAmount: v.optional(v.number()),
  paymentMethod: v.optional(v.string()),
  paymentNotes: v.optional(v.string()),
  status: v.optional(AdminReservationStatus),
  adminNotes: v.optional(v.string()),
  customerNotes: v.optional(v.string()),
  internalFlags: v.optional(v.array(v.string())),
  changeReason: v.optional(v.string()),
});

export const ListAdminReservationsArgs = v.object({
  travelerId: v.optional(v.id("users")),
  adminId: v.optional(v.id("users")),
  partnerId: v.optional(v.id("users")),
  organizationId: v.optional(v.id("partnerOrganizations")),
  assetType: v.optional(AdminReservationAssetType),
  status: v.optional(AdminReservationStatus),
  paymentStatus: v.optional(AdminReservationPaymentStatus),
  createdMethod: v.optional(AdminReservationCreationMethod),
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

// Auto-Confirmation Types
export const AutoConfirmationAssetType = v.union(
  v.literal("activities"),
  v.literal("events"),
  v.literal("restaurants"),
  v.literal("vehicles")
);

export const CreateAutoConfirmationSettingsArgs = v.object({
  assetId: v.string(),
  assetType: AutoConfirmationAssetType,
  enabled: v.boolean(),
  name: v.string(),
  priority: v.number(),
  conditions: v.object({
    timeRestrictions: v.object({
      enableTimeRestrictions: v.boolean(),
      allowedDaysOfWeek: v.array(v.number()),
      allowedHours: v.object({
        start: v.string(),
        end: v.string(),
      }),
      timezone: v.string(),
    }),
    amountThresholds: v.object({
      enableAmountThresholds: v.boolean(),
      minAmount: v.optional(v.number()),
      maxAmount: v.optional(v.number()),
    }),
    customerTypeFilters: v.object({
      enableCustomerFilters: v.boolean(),
      allowedCustomerTypes: v.array(v.string()),
      minBookingHistory: v.optional(v.number()),
      blacklistedCustomers: v.array(v.id("users")),
    }),
    bookingConditions: v.object({
      enableBookingConditions: v.boolean(),
      maxGuestsCount: v.optional(v.number()),
      minAdvanceBooking: v.optional(v.number()),
      maxAdvanceBooking: v.optional(v.number()),
      allowedPaymentMethods: v.array(v.string()),
    }),
    availabilityConditions: v.object({
      enableAvailabilityConditions: v.boolean(),
      requireAvailabilityCheck: v.boolean(),
      maxOccupancyPercentage: v.optional(v.number()),
      bufferTime: v.optional(v.number()),
    }),
  }),
  notifications: v.object({
    notifyCustomer: v.boolean(),
    notifyPartner: v.boolean(),
    notifyEmployees: v.boolean(),
    customMessage: v.optional(v.string()),
    emailTemplate: v.optional(v.string()),
  }),
  overrideSettings: v.object({
    allowManualOverride: v.boolean(),
    overrideRequiresApproval: v.boolean(),
    overrideApprovers: v.array(v.id("users")),
  }),
});

// Status mappings for UI
export const ADMIN_RESERVATION_STATUS_LABELS = {
  draft: "Rascunho",
  confirmed: "Confirmado",
  in_progress: "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
} as const;

export const ADMIN_RESERVATION_STATUS_COLORS = {
  draft: "yellow",
  confirmed: "green",
  in_progress: "blue",
  completed: "purple",
  cancelled: "red",
  no_show: "gray",
} as const;

export const PAYMENT_STATUS_LABELS = {
  pending: "Pendente",
  completed: "Pago",
  cash: "Dinheiro",
  transfer: "Transferência",
  deferred: "Pagamento Posterior",
  partial: "Parcial",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
} as const;

export const PAYMENT_STATUS_COLORS = {
  pending: "yellow",
  completed: "green",
  cash: "blue",
  transfer: "cyan",
  deferred: "orange",
  partial: "amber",
  refunded: "purple",
  cancelled: "red",
} as const;

export const CREATION_METHOD_LABELS = {
  admin_direct: "Criada pelo Admin",
  admin_conversion: "Conversão de Solicitação",
  admin_group: "Reserva de Grupo",
  admin_phone: "Reserva por Telefone",
  admin_walkin: "Walk-in",
} as const;

// Type exports
export type AdminReservationDoc = Doc<"adminReservations">;
export type AdminReservationId = Id<"adminReservations">;
export type AutoConfirmationSettingsDoc = Doc<"autoConfirmationSettings">;
export type AutoConfirmationSettingsId = Id<"autoConfirmationSettings">;
export type ReservationChangeHistoryDoc = Doc<"reservationChangeHistory">;