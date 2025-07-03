import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { createVoucherValidator, VOUCHER_STATUS } from "./types";
import type { Id } from "../../_generated/dataModel";

/**
 * Generate a unique voucher number
 * Format: VCH-YYYYMMDD-XXXX
 */
function generateVoucherNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  
  return `VCH-${year}${month}${day}-${random}`;
}

/**
 * Create a voucher for a confirmed booking
 */
export const createVoucher = internalMutation({
  args: createVoucherValidator,
  returns: v.id("vouchers"),
  handler: async (ctx, args) => {
    // Check if voucher already exists for this booking
    const existingVoucher = await ctx.db
      .query("vouchers")
      .withIndex("by_booking", (q) => 
        q.eq("bookingId", args.bookingId).eq("bookingType", args.bookingType)
      )
      .filter((q) => q.neq(q.field("status"), VOUCHER_STATUS.CANCELLED))
      .first();

    if (existingVoucher) {
      throw new Error("Voucher já existe para esta reserva");
    }

    const voucherNumber = generateVoucherNumber();
    const now = Date.now();

    // Calculate validity period based on booking type
    let validFrom = now;
    let validUntil = now + (365 * 24 * 60 * 60 * 1000); // Default: 1 year

    // For specific booking types, set validity based on booking date
    if (args.bookingType === "activity" || args.bookingType === "event") {
      const bookingDate = new Date(args.bookingDetails.date);
      validFrom = bookingDate.getTime();
      validUntil = bookingDate.getTime() + (24 * 60 * 60 * 1000); // Valid for the day
    } else if (args.bookingType === "restaurant") {
      const bookingDate = new Date(args.bookingDetails.date);
      validFrom = bookingDate.getTime();
      validUntil = bookingDate.getTime() + (4 * 60 * 60 * 1000); // Valid for 4 hours
    } else if (args.bookingType === "vehicle") {
      validFrom = new Date(args.bookingDetails.startDate).getTime();
      validUntil = new Date(args.bookingDetails.endDate).getTime();
    } else if (args.bookingType === "package") {
      validFrom = new Date(args.bookingDetails.startDate).getTime();
      validUntil = new Date(args.bookingDetails.endDate).getTime();
    }

    // Generate QR Code data
    const qrCodeData = JSON.stringify({
      voucherNumber,
      bookingId: args.bookingId,
      bookingType: args.bookingType,
      confirmationCode: args.confirmationCode,
    });

    const voucherId = await ctx.db.insert("vouchers", {
      bookingId: args.bookingId,
      bookingType: args.bookingType,
      voucherNumber,
      issueDate: now,
      customerInfo: args.customerInfo,
      assetInfo: args.assetInfo,
      bookingDetails: args.bookingDetails,
      partnerId: args.partnerId,
      status: VOUCHER_STATUS.ACTIVE,
      qrCode: qrCodeData,
      validFrom,
      validUntil,
      createdBy: args.partnerId, // For now, created by partner
      confirmationCode: args.confirmationCode,
      createdAt: now,
      updatedAt: now,
    });

    return voucherId;
  },
});

/**
 * Mark voucher as used
 */
export const useVoucher = mutation({
  args: {
    voucherNumber: v.string(),
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

    if (!user || (user.role !== "partner" && user.role !== "employee" && user.role !== "master")) {
      throw new Error("Sem permissão para usar vouchers");
    }

    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", args.voucherNumber))
      .first();

    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    if (voucher.status === VOUCHER_STATUS.USED) {
      throw new Error("Voucher já foi utilizado");
    }

    if (voucher.status === VOUCHER_STATUS.CANCELLED) {
      throw new Error("Voucher foi cancelado");
    }

    if (voucher.status === VOUCHER_STATUS.EXPIRED) {
      throw new Error("Voucher expirado");
    }

    const now = Date.now();

    // Check validity period
    if (voucher.validFrom && now < voucher.validFrom) {
      throw new Error("Voucher ainda não está válido");
    }

    if (voucher.validUntil && now > voucher.validUntil) {
      // Mark as expired
      await ctx.db.patch(voucher._id, {
        status: VOUCHER_STATUS.EXPIRED,
        updatedAt: now,
      });
      throw new Error("Voucher expirado");
    }

    // Check if user has permission for this partner's vouchers
    if (user.role === "partner" && voucher.partnerId !== user._id) {
      throw new Error("Sem permissão para usar vouchers de outro parceiro");
    }

    // Mark as used
    await ctx.db.patch(voucher._id, {
      status: VOUCHER_STATUS.USED,
      usedAt: now,
      updatedAt: now,
    });

    return null;
  },
});

/**
 * Cancel a voucher
 */
export const cancelVoucher = mutation({
  args: {
    voucherId: v.id("vouchers"),
    reason: v.string(),
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

    const voucher = await ctx.db.get(args.voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // Check permissions
    const canCancel = user.role === "master" || 
      (user.role === "partner" && voucher.partnerId === user._id) ||
      (user.role === "traveler" && voucher.customerInfo.email === user.email);

    if (!canCancel) {
      throw new Error("Sem permissão para cancelar este voucher");
    }

    if (voucher.status === VOUCHER_STATUS.CANCELLED) {
      throw new Error("Voucher já foi cancelado");
    }

    if (voucher.status === VOUCHER_STATUS.USED) {
      throw new Error("Não é possível cancelar um voucher já utilizado");
    }

    const now = Date.now();

    await ctx.db.patch(args.voucherId, {
      status: VOUCHER_STATUS.CANCELLED,
      cancelledAt: now,
      cancelReason: args.reason,
      updatedAt: now,
    });

    return null;
  },
});

/**
 * Check and update expired vouchers
 */
export const checkExpiredVouchers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find active vouchers that have passed their validity period
    const expiredVouchers = await ctx.db
      .query("vouchers")
      .withIndex("by_status", (q) => q.eq("status", VOUCHER_STATUS.ACTIVE))
      .filter((q) => 
        q.and(
          q.neq(q.field("validUntil"), undefined),
          q.lt(q.field("validUntil"), now)
        )
      )
      .collect();

    // Update each expired voucher
    for (const voucher of expiredVouchers) {
      await ctx.db.patch(voucher._id, {
        status: VOUCHER_STATUS.EXPIRED,
        updatedAt: now,
      });
    }

    return expiredVouchers.length;
  },
}); 