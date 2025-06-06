import { v } from "convex/values";

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELED: "booking_canceled", 
  BOOKING_UPDATED: "booking_updated",
  BOOKING_REMINDER: "booking_reminder",
  PAYMENT_RECEIVED: "payment_received",
  SYSTEM_UPDATE: "system_update",
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

/**
 * Related entity types for notifications
 */
export const RELATED_TYPES = {
  ACTIVITY_BOOKING: "activity_booking",
  EVENT_BOOKING: "event_booking", 
  RESTAURANT_RESERVATION: "restaurant_reservation",
  VEHICLE_BOOKING: "vehicle_booking",
} as const;

export type RelatedType = typeof RELATED_TYPES[keyof typeof RELATED_TYPES];

/**
 * Validators for mutations
 */
export const createNotificationValidator = v.object({
  userId: v.id("users"),
  type: v.string(),
  title: v.string(),
  message: v.string(),
  relatedId: v.optional(v.string()),
  relatedType: v.optional(v.string()),
  data: v.optional(v.object({
    confirmationCode: v.optional(v.string()),
    bookingType: v.optional(v.string()),
    assetName: v.optional(v.string()),
    partnerName: v.optional(v.string()),
  })),
});

export const markAsReadValidator = v.object({
  notificationId: v.id("notifications"),
});

export const markAllAsReadValidator = v.object({
  userId: v.id("users"),
});

export const deleteNotificationValidator = v.object({
  notificationId: v.id("notifications"),
});

/**
 * Helper function to create notification data for booking confirmations
 */
export function createBookingConfirmationData(
  confirmationCode: string,
  bookingType: string,
  assetName: string,
  partnerName?: string
) {
  return {
    confirmationCode,
    bookingType,
    assetName,
    partnerName,
  };
}

/**
 * Helper function to generate notification titles and messages
 */
export function getNotificationContent(
  type: NotificationType,
  assetName?: string,
  confirmationCode?: string
) {
  switch (type) {
    case NOTIFICATION_TYPES.BOOKING_CONFIRMED:
      return {
        title: "Reserva Confirmada! 🎉",
        message: `Sua reserva para "${assetName}" foi confirmada! Código: ${confirmationCode}`,
      };
    case NOTIFICATION_TYPES.BOOKING_CANCELED:
      return {
        title: "Reserva Cancelada",
        message: `Sua reserva para "${assetName}" foi cancelada. Código: ${confirmationCode}`,
      };
    case NOTIFICATION_TYPES.BOOKING_UPDATED:
      return {
        title: "Reserva Atualizada",
        message: `Sua reserva para "${assetName}" foi atualizada. Código: ${confirmationCode}`,
      };
    case NOTIFICATION_TYPES.BOOKING_REMINDER:
      return {
        title: "Lembrete de Reserva",
        message: `Lembre-se da sua reserva para "${assetName}" hoje! Código: ${confirmationCode}`,
      };
    default:
      return {
        title: "Notificação",
        message: "Você tem uma nova notificação.",
      };
  }
} 