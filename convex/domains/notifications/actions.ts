"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";

/**
 * Send booking confirmation notification and email
 */
export const sendBookingConfirmationNotification = action({
  args: {
    userId: v.id("users"),
    bookingId: v.string(),
    bookingType: v.string(),
    assetName: v.string(),
    confirmationCode: v.string(),
    customerEmail: v.string(),
    customerName: v.string(),
    partnerName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Create in-app notification
    await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
      userId: args.userId,
      type: "booking_confirmed",
      title: "Reserva Confirmada! 🎉",
      message: `Sua reserva para "${args.assetName}" foi confirmada! Código: ${args.confirmationCode}`,
      relatedId: args.bookingId,
      relatedType: `${args.bookingType}_booking`,
      data: {
        confirmationCode: args.confirmationCode,
        bookingType: args.bookingType,
        assetName: args.assetName,
        partnerName: args.partnerName,
      },
    });

    // Send email notification (placeholder for now)
    console.log(`Sending confirmation email to ${args.customerEmail} for booking ${args.confirmationCode}`);
    
    // TODO: Implement actual email sending service
    // This could be done with services like Resend, SendGrid, or AWS SES
    
    return null;
  },
});

/**
 * Send booking cancellation notification and email
 */
export const sendBookingCancellationNotification = action({
  args: {
    userId: v.id("users"),
    bookingId: v.string(),
    bookingType: v.string(),
    assetName: v.string(),
    confirmationCode: v.string(),
    customerEmail: v.string(),
    customerName: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Create in-app notification
    await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
      userId: args.userId,
      type: "booking_canceled",
      title: "Reserva Cancelada",
      message: `Sua reserva para "${args.assetName}" foi cancelada. ${args.reason ? `Motivo: ${args.reason}` : ""} Código: ${args.confirmationCode}`,
      relatedId: args.bookingId,
      relatedType: `${args.bookingType}_booking`,
      data: {
        confirmationCode: args.confirmationCode,
        bookingType: args.bookingType,
        assetName: args.assetName,
      },
    });

    // Send email notification
    console.log(`Sending cancellation email to ${args.customerEmail} for booking ${args.confirmationCode}`);
    
    return null;
  },
});

/**
 * Send booking reminder notification
 */
export const sendBookingReminderNotification = action({
  args: {
    userId: v.id("users"),
    bookingId: v.string(),
    bookingType: v.string(),
    assetName: v.string(),
    confirmationCode: v.string(),
    date: v.string(),
    customerEmail: v.string(),
    customerName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Create in-app notification
    await ctx.runMutation(internal.domains.notifications.mutations.createNotification, {
      userId: args.userId,
      type: "booking_reminder",
      title: "Lembrete de Reserva",
      message: `Lembre-se da sua reserva para "${args.assetName}" em ${args.date}! Código: ${args.confirmationCode}`,
      relatedId: args.bookingId,
      relatedType: `${args.bookingType}_booking`,
      data: {
        confirmationCode: args.confirmationCode,
        bookingType: args.bookingType,
        assetName: args.assetName,
      },
    });

    // Send email reminder
    console.log(`Sending reminder email to ${args.customerEmail} for booking ${args.confirmationCode}`);
    
    return null;
  },
}); 