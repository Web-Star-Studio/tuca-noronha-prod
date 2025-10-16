import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
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

    console.log(`✅ Booking ${bookingId} confirmed by admin ${user.name}`);

    // Send email notification to customer
    try {
      const bookingDetailsUrl = `${process.env.SITE_URL || "http://localhost:3000"}/reservas/${bookingId}`;
      
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingApprovedEmail, {
        customerEmail: bookingWithStatus.customerInfo?.email || bookingWithStatus.email,
        customerName: bookingWithStatus.customerInfo?.name || bookingWithStatus.name,
        confirmationCode: bookingWithStatus.confirmationCode,
        assetName: "Reserva", // Will be enhanced with actual asset name
        assetType: bookingType,
        bookingDate: bookingWithStatus.date,
        bookingTime: bookingWithStatus.time,
        totalAmount: bookingWithStatus.totalPrice || bookingWithStatus.finalAmount,
        adminNotes: adminNotes,
        bookingDetailsUrl,
      });
      
      console.log(`📧 Email notification scheduled for ${bookingWithStatus.customerInfo?.email}`);
    } catch (emailError) {
      console.error("Failed to schedule email:", emailError);
      // Don't fail the mutation if email fails
    }

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

    console.log(`❌ Booking ${bookingId} rejected by admin ${user.name}`);

    // Send email notification to customer
    try {
      const bookingDetailsUrl = `${process.env.SITE_URL || "http://localhost:3000"}/reservas/${bookingId}`;
      
      await ctx.scheduler.runAfter(0, internal.domains.email.actions.sendBookingRejectedEmail, {
        customerEmail: bookingWithStatus.customerInfo?.email || bookingWithStatus.email,
        customerName: bookingWithStatus.customerInfo?.name || bookingWithStatus.name,
        confirmationCode: bookingWithStatus.confirmationCode,
        assetName: "Reserva", // Will be enhanced with actual asset name
        assetType: bookingType,
        bookingDate: bookingWithStatus.date,
        adminNotes: adminNotes,
        rejectionReason: rejectionReason,
        bookingDetailsUrl,
      });
      
      console.log(`📧 Rejection email scheduled for ${bookingWithStatus.customerInfo?.email}`);
    } catch (emailError) {
      console.error("Failed to schedule rejection email:", emailError);
      // Don't fail the mutation if email fails
    }

    return {
      success: true,
      bookingId,
      status: BOOKING_STATUS.REJECTED,
    };
  },
});
