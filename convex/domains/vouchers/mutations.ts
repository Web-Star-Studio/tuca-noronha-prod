import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import {
  createVoucherValidator,
  updateVoucherValidator,
  useVoucherValidator,
  cancelVoucherValidator,
  createUsageLogValidator,
  VOUCHER_STATUS,
  VOUCHER_ACTIONS,
  USER_TYPES,
} from "./types";
import {
  generateVoucherNumber,
  generateVerificationToken,
  generateQRCodeData,
  qrCodeDataToString,
  calculateVoucherExpiration,
} from "./utils";

/**
 * Generate a new voucher for a booking
 */
export const generateVoucher = mutation({
  args: createVoucherValidator,
  handler: async (ctx, { bookingId, bookingType, partnerId, customerId, expiresAt }) => {
    // Get current user for audit logging
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query("users")
          .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
          .first()
      : null;

    // Check if voucher already exists for this booking
    const existingVoucher = await ctx.db
      .query("vouchers")
      .withIndex("by_booking", (q) => 
        q.eq("bookingId", bookingId).eq("bookingType", bookingType)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existingVoucher) {
      throw new Error("Voucher já existe para esta reserva");
    }

    // Generate unique voucher number
    let voucherNumber: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      voucherNumber = generateVoucherNumber();
      const exists = await ctx.db
        .query("vouchers")
        .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
        .first();

      if (!exists) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error("Erro ao gerar número único do voucher");
    }

    // Calculate expiration if not provided
    const calculatedExpiration = expiresAt || calculateVoucherExpiration(bookingType);

    // Generate verification token and QR code
    const verificationToken = generateVerificationToken(voucherNumber, calculatedExpiration);
    const qrCodeData = generateQRCodeData(voucherNumber, verificationToken, calculatedExpiration);
    const qrCodeString = qrCodeDataToString(qrCodeData);

    // Create voucher record
    const now = Date.now();
    const voucherId = await ctx.db.insert("vouchers", {
      voucherNumber,
      qrCode: qrCodeString,
      bookingId,
      bookingType,
      status: VOUCHER_STATUS.ACTIVE,
      generatedAt: now,
      expiresAt: calculatedExpiration,
      emailSent: false,
      downloadCount: 0,
      verificationToken,
      scanCount: 0,
      partnerId,
      customerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Log voucher generation
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.GENERATED,
      timestamp: now,
      userId: currentUser?._id,
      userType: currentUser?.role || USER_TYPES.ADMIN,
      metadata: JSON.stringify({
        bookingId,
        bookingType,
        generatedBy: currentUser?.name || "System",
      }),
      createdAt: now,
    });

    return {
      voucherId,
      voucherNumber,
      qrCode: qrCodeString,
      expiresAt: calculatedExpiration,
    };
  },
});

/**
 * Update voucher information
 */
export const updateVoucher = mutation({
  args: updateVoucherValidator,
  handler: async (ctx, args) => {
    const { voucherId, ...updates } = args;

    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // Get voucher to check permissions
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // RBAC check - only partner, employees, or masters can update vouchers
    const canUpdate = currentUser.role === "master" || 
                     voucher.partnerId === currentUser._id ||
                     (currentUser.role === "employee" && currentUser.partnerId === voucher.partnerId);

    if (!canUpdate) {
      throw new Error("Acesso negado");
    }

    // Update voucher
    const now = Date.now();
    await ctx.db.patch(voucherId, {
      ...updates,
      updatedAt: now,
    });

    // Log update action
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: "updated" as any, // Add to VOUCHER_ACTIONS if needed
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      metadata: JSON.stringify({
        updatedFields: Object.keys(updates),
        updatedBy: currentUser.name,
      }),
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Mark voucher as used (partner check-in)
 */
export const useVoucher = mutation({
  args: useVoucherValidator,
  handler: async (ctx, { voucherId, partnerId, usageNotes, location }) => {
    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // Get voucher
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // RBAC check - only the partner or their employees can mark voucher as used
    const canUse = voucher.partnerId === partnerId ||
                  (currentUser.role === "employee" && currentUser.partnerId === voucher.partnerId);

    if (!canUse) {
      throw new Error("Acesso negado - voucher não pertence a este parceiro");
    }

    // Check voucher status
    if (voucher.status !== VOUCHER_STATUS.ACTIVE) {
      throw new Error(
        `Voucher não pode ser utilizado - status: ${
          voucher.status === "used" ? "já utilizado" :
          voucher.status === "cancelled" ? "cancelado" :
          voucher.status === "expired" ? "expirado" : "inválido"
        }`
      );
    }

    // Check expiration
    if (voucher.expiresAt && Date.now() > voucher.expiresAt) {
      // Auto-update to expired
      await ctx.db.patch(voucherId, {
        status: VOUCHER_STATUS.EXPIRED,
        updatedAt: Date.now(),
      });
      throw new Error("Voucher expirado");
    }

    // Mark voucher as used
    const now = Date.now();
    await ctx.db.patch(voucherId, {
      status: VOUCHER_STATUS.USED,
      usedAt: now,
      updatedAt: now,
    });

    // Log usage
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.USED,
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      location,
      metadata: JSON.stringify({
        usedBy: currentUser.name,
        partnerId,
        usageNotes,
        location,
      }),
      createdAt: now,
    });

    // Update booking status if needed
    try {
      switch (voucher.bookingType) {
        case "activity":
          const activityBooking = await ctx.db
            .query("activityBookings")
            .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
            .first();
          if (activityBooking && activityBooking.status !== "completed") {
            await ctx.db.patch(activityBooking._id, {
              status: "in_progress",
              updatedAt: now,
            });
          }
          break;
        case "event":
          const eventBooking = await ctx.db
            .query("eventBookings")
            .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
            .first();
          if (eventBooking && eventBooking.status !== "completed") {
            await ctx.db.patch(eventBooking._id, {
              status: "in_progress",
              updatedAt: now,
            });
          }
          break;
        // Add other booking types as needed
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      // Don't fail the voucher usage if booking update fails
    }

    return {
      success: true,
      usedAt: now,
      message: "Voucher utilizado com sucesso",
    };
  },
});

/**
 * Cancel voucher
 */
export const cancelVoucher = mutation({
  args: cancelVoucherValidator,
  handler: async (ctx, { voucherId, reason, userId }) => {
    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // Get voucher
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // RBAC check - customer, partner, employees, or masters can cancel
    const canCancel = currentUser.role === "master" ||
                     voucher.partnerId === currentUser._id ||
                     voucher.customerId === currentUser._id ||
                     (currentUser.role === "employee" && currentUser.partnerId === voucher.partnerId);

    if (!canCancel) {
      throw new Error("Acesso negado");
    }

    // Check if voucher can be cancelled
    if (voucher.status === VOUCHER_STATUS.USED) {
      throw new Error("Voucher já foi utilizado e não pode ser cancelado");
    }

    if (voucher.status === VOUCHER_STATUS.CANCELLED) {
      throw new Error("Voucher já está cancelado");
    }

    // Cancel voucher
    const now = Date.now();
    await ctx.db.patch(voucherId, {
      status: VOUCHER_STATUS.CANCELLED,
      updatedAt: now,
    });

    // Log cancellation
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.CANCELLED,
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      metadata: JSON.stringify({
        cancelledBy: currentUser.name,
        reason,
        cancelledByUserId: userId,
      }),
      createdAt: now,
    });

    return {
      success: true,
      cancelledAt: now,
      message: "Voucher cancelado com sucesso",
    };
  },
});

/**
 * Record voucher scan (for analytics)
 */
export const recordVoucherScan = mutation({
  args: {
    voucherId: v.id("vouchers"),
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, { voucherId, userId, ipAddress, userAgent, location }) => {
    // Get voucher
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    const now = Date.now();

    // Update scan count and last scanned time
    await ctx.db.patch(voucherId, {
      scanCount: voucher.scanCount + 1,
      lastScannedAt: now,
      updatedAt: now,
    });

    // Log scan
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.SCANNED,
      timestamp: now,
      userId,
      userType: userId ? undefined : "anonymous",
      ipAddress,
      userAgent,
      location,
      metadata: JSON.stringify({
        scanCount: voucher.scanCount + 1,
      }),
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Record voucher download (for analytics)
 */
export const recordVoucherDownload = mutation({
  args: {
    voucherId: v.id("vouchers"),
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { voucherId, userId, ipAddress, userAgent }) => {
    // Get voucher
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    const now = Date.now();

    // Update download count
    await ctx.db.patch(voucherId, {
      downloadCount: voucher.downloadCount + 1,
      updatedAt: now,
    });

    // Log download
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.DOWNLOADED,
      timestamp: now,
      userId,
      userType: userId ? undefined : "anonymous",
      ipAddress,
      userAgent,
      metadata: JSON.stringify({
        downloadCount: voucher.downloadCount + 1,
      }),
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Record voucher email sent
 */
export const recordVoucherEmailSent = mutation({
  args: {
    voucherId: v.id("vouchers"),
    emailAddress: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { voucherId, emailAddress, userId }) => {
    // Get voucher
    const voucher = await ctx.db.get(voucherId);
    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    const now = Date.now();

    // Update email sent status
    await ctx.db.patch(voucherId, {
      emailSent: true,
      emailSentAt: now,
      updatedAt: now,
    });

    // Log email sent
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.EMAILED,
      timestamp: now,
      userId,
      userType: "system",
      metadata: JSON.stringify({
        emailAddress,
        sentAt: now,
      }),
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Regenerate voucher (create new voucher for same booking)
 */
export const regenerateVoucher = mutation({
  args: {
    voucherId: v.id("vouchers"),
    reason: v.string(),
  },
  handler: async (ctx, { voucherId, reason }) => {
    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // Get original voucher
    const originalVoucher = await ctx.db.get(voucherId);
    if (!originalVoucher) {
      throw new Error("Voucher não encontrado");
    }

    // RBAC check
    const canRegenerate = currentUser.role === "master" ||
                         originalVoucher.partnerId === currentUser._id ||
                         (currentUser.role === "employee" && currentUser.partnerId === originalVoucher.partnerId);

    if (!canRegenerate) {
      throw new Error("Acesso negado");
    }

    // Cancel original voucher
    const now = Date.now();
    await ctx.db.patch(voucherId, {
      status: VOUCHER_STATUS.CANCELLED,
      updatedAt: now,
    });

    // Log cancellation of original
    await ctx.db.insert("voucherUsageLogs", {
      voucherId,
      action: VOUCHER_ACTIONS.CANCELLED,
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      metadata: JSON.stringify({
        cancelledBy: currentUser.name,
        reason: `Voucher regenerated: ${reason}`,
        regenerated: true,
      }),
      createdAt: now,
    });

    // Generate new voucher by creating it directly
    const voucherNumber = generateVoucherNumber();
    const verificationToken = generateVerificationToken(voucherNumber, originalVoucher.expiresAt);
    const qrCodeData = generateQRCodeData(voucherNumber, verificationToken, originalVoucher.expiresAt);
    const qrCodeString = qrCodeDataToString(qrCodeData);

    const newVoucherId = await ctx.db.insert("vouchers", {
      voucherNumber,
      qrCode: qrCodeString,
      bookingId: originalVoucher.bookingId,
      bookingType: originalVoucher.bookingType,
      status: VOUCHER_STATUS.ACTIVE,
      generatedAt: now,
      expiresAt: originalVoucher.expiresAt,
      emailSent: false,
      downloadCount: 0,
      verificationToken,
      scanCount: 0,
      partnerId: originalVoucher.partnerId,
      customerId: originalVoucher.customerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Log new voucher generation
    await ctx.db.insert("voucherUsageLogs", {
      voucherId: newVoucherId,
      action: VOUCHER_ACTIONS.GENERATED,
      timestamp: now,
      userId: currentUser._id,
      userType: currentUser.role,
      metadata: JSON.stringify({
        regenerated: true,
        originalVoucherId: voucherId,
        reason,
        generatedBy: currentUser.name,
      }),
      createdAt: now,
    });

    const newVoucher = {
      voucherId: newVoucherId,
      voucherNumber,
      qrCode: qrCodeString,
      expiresAt: originalVoucher.expiresAt,
    };

    return {
      success: true,
      originalVoucherId: voucherId,
      newVoucher,
      message: "Voucher regenerado com sucesso",
    };
  },
});

/**
 * Bulk update voucher expiration dates
 */
export const bulkUpdateVoucherExpiration = mutation({
  args: {
    partnerId: v.id("users"),
    bookingType: v.optional(v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("accommodation")
    )),
    newExpirationDate: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, { partnerId, bookingType, newExpirationDate, reason }) => {
    // Get current user for RBAC
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) {
      throw new Error("Usuário não encontrado");
    }

    // RBAC check - only masters or the partner themselves
    if (currentUser.role !== "master" && currentUser._id !== partnerId) {
      throw new Error("Acesso negado");
    }

    // Build query for vouchers to update
    let query = ctx.db
      .query("vouchers")
      .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("status"), "active")
        )
      );

    if (bookingType) {
      query = query.filter((q) => q.eq(q.field("bookingType"), bookingType));
    }

    const vouchers = await query.collect();

    if (vouchers.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        message: "Nenhum voucher encontrado para atualizar",
      };
    }

    // Update vouchers in batches
    const now = Date.now();
    let updatedCount = 0;

    for (const voucher of vouchers) {
      try {
        await ctx.db.patch(voucher._id, {
          expiresAt: newExpirationDate,
          updatedAt: now,
        });

        // Log the update
        await ctx.db.insert("voucherUsageLogs", {
          voucherId: voucher._id,
          action: "updated" as any,
          timestamp: now,
          userId: currentUser._id,
          userType: currentUser.role,
          metadata: JSON.stringify({
            bulkUpdate: true,
            reason,
            oldExpiration: voucher.expiresAt,
            newExpiration: newExpirationDate,
            updatedBy: currentUser.name,
          }),
          createdAt: now,
        });

        updatedCount++;
      } catch (error) {
        console.error(`Error updating voucher ${voucher._id}:`, error);
        // Continue with other vouchers
      }
    }

    return {
      success: true,
      updatedCount,
      totalVouchers: vouchers.length,
      message: `${updatedCount} vouchers atualizados com sucesso`,
    };
  },
});