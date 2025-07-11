// Export all admin reservation functions
export * from "./queries";
export * from "./mutations";
export * from "./types";

// Re-export commonly used types
export type {
  AdminReservationDoc,
  AdminReservationId,
  AutoConfirmationSettingsDoc,
  AutoConfirmationSettingsId,
  ReservationChangeHistoryDoc,
} from "./types";

// Export status constants
export {
  ADMIN_RESERVATION_STATUS_LABELS,
  ADMIN_RESERVATION_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  CREATION_METHOD_LABELS,
} from "./types";