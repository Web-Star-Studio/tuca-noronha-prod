import { query, internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Partner-specific voucher verification query
 */
export const partnerVerifyVoucher = query({
  args: {
    voucherNumber: v.string(),
    partnerId: v.id("users"),
  },
  handler: async (ctx, { voucherNumber, partnerId }) => {
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

    // RBAC check - only the partner or their employees can verify
    if (currentUser.role !== "master" && 
        currentUser._id !== partnerId && 
        !(currentUser.role === "employee" && currentUser.partnerId === partnerId)) {
      throw new Error("Acesso negado");
    }

    try {
      // Get voucher data using the helper function from the main queries file
      const voucher = await ctx.db
        .query("vouchers")
        .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      if (!voucher) {
        throw new Error("Voucher não encontrado");
      }

      // Verify partner access
      if (voucher.partnerId !== partnerId) {
        throw new Error("Acesso negado - voucher não pertence a este parceiro");
      }

      // Check if voucher can be used
      const canUse = voucher.status === "active" && 
                    (!voucher.expiresAt || voucher.expiresAt > Date.now());

      return {
        success: true,
        voucherNumber: voucher.voucherNumber,
        status: voucher.status,
        canUse,
        verificationTime: Date.now(),
        expiresAt: voucher.expiresAt,
        scanCount: voucher.scanCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de verificação",
        canUse: false,
        verificationTime: Date.now(),
      };
    }
  },
});

/**
 * Get recent voucher activities for partner dashboard
 */
export const getRecentVoucherActivities = query({
  args: {
    partnerId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { partnerId, limit = 10 }) => {
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

    // RBAC check
    const canAccess = currentUser.role === "master" || 
                     currentUser._id === partnerId ||
                     (currentUser.role === "employee" && currentUser.partnerId === partnerId);

    if (!canAccess) {
      throw new Error("Acesso negado");
    }

    // Get partner vouchers
    const vouchers = await ctx.db
      .query("vouchers")
      .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const voucherIds = vouchers.map(v => v._id);

    // Get recent activities
    const activities = await ctx.db
      .query("voucherUsageLogs")
      .filter((q) => q.or(...voucherIds.map(id => q.eq(q.field("voucherId"), id))))
      .order("desc")
      .take(limit);

    // Enrich activities with voucher and user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        let voucherInfo: {
          voucherNumber: string;
          status: string;
          bookingType: string;
        } | null = null;
        let userInfo: {
          name: string | undefined;
          email: string | undefined;
          role: string | undefined;
        } | null = null;

        // Get voucher info
        if (activity.voucherId && activity.voucherId !== "unknown") {
          const voucher = await ctx.db.get(activity.voucherId as any);
          if (voucher && 'voucherNumber' in voucher) {
            voucherInfo = {
              voucherNumber: voucher.voucherNumber,
              status: voucher.status,
              bookingType: voucher.bookingType,
            };
          }
        }

        // Get user info
        if (activity.userId) {
          const user = await ctx.db.get(activity.userId);
          if (user && 'name' in user) {
            userInfo = {
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }

        return {
          ...activity,
          voucher: voucherInfo,
          user: userInfo,
        };
      })
    );

    return enrichedActivities;
  },
});

/**
 * Get voucher analytics for partner dashboard
 */
export const getVoucherAnalytics = query({
  args: {
    partnerId: v.id("users"),
    dateRange: v.optional(v.object({
      from: v.number(),
      to: v.number()
    })),
    groupBy: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, { partnerId, dateRange, groupBy = "day" }) => {
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

    // RBAC check
    const canAccess = currentUser.role === "master" || 
                     currentUser._id === partnerId ||
                     (currentUser.role === "employee" && currentUser.partnerId === partnerId);

    if (!canAccess) {
      throw new Error("Acesso negado");
    }

    // Get vouchers with date filter
    let query = ctx.db
      .query("vouchers")
      .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
      .filter((q) => q.eq(q.field("isActive"), true));

    if (dateRange) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("generatedAt"), dateRange.from),
          q.lte(q.field("generatedAt"), dateRange.to)
        )
      );
    }

    const vouchers = await query.collect();

    // Calculate time-based analytics
    const analytics = {
      overview: {
        totalVouchers: vouchers.length,
        activeVouchers: vouchers.filter(v => v.status === "active").length,
        usedVouchers: vouchers.filter(v => v.status === "used").length,
        totalScans: vouchers.reduce((sum, v) => sum + v.scanCount, 0),
        totalDownloads: vouchers.reduce((sum, v) => sum + v.downloadCount, 0),
        usageRate: vouchers.length > 0 ? (vouchers.filter(v => v.status === "used").length / vouchers.length) * 100 : 0,
      },
      byBookingType: {
        activity: vouchers.filter(v => v.bookingType === "activity").length,
        event: vouchers.filter(v => v.bookingType === "event").length,
        restaurant: vouchers.filter(v => v.bookingType === "restaurant").length,
        vehicle: vouchers.filter(v => v.bookingType === "vehicle").length,

      },
      timeSeriesData: [] as any[], // Would need more complex grouping logic
    };

    return analytics;
  },
});

/**
 * Internal query for voucher data - used by actions
 */
export const getVoucherByNumberInternal = internalQuery({
  args: { voucherNumber: v.string() },
  handler: async (ctx, { voucherNumber }) => {
    // Find voucher by number
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!voucher) {
      throw new Error("Voucher não encontrado");
    }

    // Get customer information
    const customer = await ctx.db.get(voucher.customerId);
    if (!customer) {
      throw new Error("Cliente não encontrado");
    }

    // Get partner information
    const partner = await ctx.db.get(voucher.partnerId);
    if (!partner) {
      throw new Error("Parceiro não encontrado");
    }

    // Get booking information based on type
    let booking: any = null;
    let asset: any = null;

    switch (voucher.bookingType) {
      case "activity":
        booking = await ctx.db
          .query("activityBookings")
          .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
          .first();
        if (booking) {
          asset = await ctx.db.get(booking.activityId);
        }
        break;
      case "event":
        booking = await ctx.db
          .query("eventBookings")
          .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
          .first();
        if (booking) {
          asset = await ctx.db.get(booking.eventId);
        }
        break;
      case "restaurant":
        booking = await ctx.db
          .query("restaurantReservations")
          .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
          .first();
        if (booking) {
          asset = await ctx.db.get(booking.restaurantId);
        }
        break;
      case "vehicle":
        booking = await ctx.db
          .query("vehicleBookings")
          .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
          .first();
        if (booking) {
          asset = await ctx.db.get(booking.vehicleId);
        }
        break;

    }

    if (!booking || !asset) {
      throw new Error("Reserva ou ativo não encontrado");
    }

    // Return formatted voucher data
    return {
      _id: voucher._id,
      voucherNumber: voucher.voucherNumber,
      status: voucher.status,
      qrCode: voucher.qrCode,
      generatedAt: voucher.generatedAt,
      expiresAt: voucher.expiresAt,
      usedAt: voucher.usedAt,
      pdfStorageId: voucher.pdfStorageId,
      booking: {
        id: booking._id,
        type: voucher.bookingType,
        confirmationCode: booking.confirmationCode,
        status: booking.status,
        date: booking.date || booking.checkInDate || booking.startDate,
        time: booking.time,
        participants: booking.participants || booking.guestCount || booking.quantity || booking.partySize,
        totalAmount: booking.totalAmount,
        specialRequests: booking.specialRequests,
      },
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
      },
      asset: {
        name: asset.name || asset.title,
        location: asset.location || asset.address?.street,
        description: asset.description,
        type: voucher.bookingType,
      },
      partner: {
        _id: partner._id,
        name: partner.name,
        contactInfo: partner.email,
      },
    };
  },
});