import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { 
  confirmBookingValidator, 
  rejectBookingValidator,
  BOOKING_STATUS 
} from "./types";

/**
 * Confirm a booking request
 * Admin approves the booking and customer will receive notification to pay
 */
export const confirmBooking = mutation({
  args: confirmBookingValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autenticado");
    }

    // Get current user to check if admin
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => 
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Check if user is admin
    if (user.role !== "admin" && user.role !== "partner") {
      throw new Error("Apenas administradores podem confirmar reservas");
    }

    const { bookingId, bookingType, adminNotes } = args;
    const now = Date.now();

    // Get the booking
    const booking = await ctx.db.get(bookingId as any);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Type assertion for booking status check
    const bookingWithStatus = booking as any;

    // Check if booking is in pending_approval status
    if (bookingWithStatus.status !== BOOKING_STATUS.PENDING_APPROVAL) {
      throw new Error(`Reserva não está pendente de aprovação. Status atual: ${bookingWithStatus.status}`);
    }

    // Update booking
    await ctx.db.patch(bookingId as any, {
      status: BOOKING_STATUS.CONFIRMED,
      approvedAt: now,
      approvedBy: user._id,
      adminNotes: adminNotes || bookingWithStatus.adminNotes,
      updatedAt: now,
    });

    // TODO: Send notification to customer
    // TODO: Create notification in notifications table
    console.log(`✅ Booking ${bookingId} confirmed by admin ${user.name}`);

    return {
      success: true,
      bookingId,
      status: BOOKING_STATUS.CONFIRMED,
    };
  },
});

/**
 * Reject a booking request
 * Admin rejects the booking with a reason
 */
export const rejectBooking = mutation({
  args: rejectBookingValidator,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autenticado");
    }

    // Get current user to check if admin
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => 
        q.eq("clerkId", identity.subject)
      )
      .unique();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Check if user is admin
    if (user.role !== "admin" && user.role !== "partner") {
      throw new Error("Apenas administradores podem rejeitar reservas");
    }

    const { bookingId, bookingType, adminNotes, rejectionReason } = args;
    const now = Date.now();

    // Get the booking
    const booking = await ctx.db.get(bookingId as any);
    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Type assertion for booking status check
    const bookingWithStatus = booking as any;

    // Check if booking is in pending_approval status
    if (bookingWithStatus.status !== BOOKING_STATUS.PENDING_APPROVAL) {
      throw new Error(`Reserva não está pendente de aprovação. Status atual: ${bookingWithStatus.status}`);
    }

    // Update booking
    await ctx.db.patch(bookingId as any, {
      status: BOOKING_STATUS.REJECTED,
      rejectedAt: now,
      rejectedBy: user._id,
      adminNotes: `${adminNotes}${rejectionReason ? `\nMotivo: ${rejectionReason}` : ''}`,
      updatedAt: now,
    });

    // TODO: Send notification to customer
    // TODO: Create notification in notifications table
    console.log(`❌ Booking ${bookingId} rejected by admin ${user.name}`);

    return {
      success: true,
      bookingId,
      status: BOOKING_STATUS.REJECTED,
    };
  },
});
