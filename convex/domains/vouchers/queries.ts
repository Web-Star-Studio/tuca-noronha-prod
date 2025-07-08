import { query } from "../../_generated/server";
import { v } from "convex/values";
import { 
  verifyVoucherValidator,
  getPartnerVouchersValidator,
  getCustomerVouchersValidator
} from "./types";
import { isVoucherExpired, parseQRCodeString, verifyToken } from "./utils";

/**
 * Helper function to get voucher data - internal use only
 */
async function getVoucherData(ctx: any, voucherNumber: string) {
  // Find voucher by number
  const voucher = await ctx.db
    .query("vouchers")
    .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", voucherNumber))
    .filter((q) => q.eq(q.field("isActive"), true))
    .first();

  if (!voucher) {
    throw new Error("Voucher não encontrado");
  }

  // Check if voucher has expired (read-only check in query)
  let currentStatus = voucher.status;
  if (voucher.expiresAt && isVoucherExpired(voucher.expiresAt) && voucher.status === "active") {
    // Note: In a query, we can't mutate data, so we'll return the current status
    // but indicate it should be expired. The mutation will happen in a separate call.
    currentStatus = "expired";
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
    case "accommodation":
      booking = await ctx.db
        .query("accommodationBookings")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        asset = await ctx.db.get(booking.accommodationId);
      }
      break;
  }

  if (!booking || !asset) {
    throw new Error("Reserva ou ativo não encontrado");
  }

  // Return formatted voucher data
  return {
    voucher: {
      voucherNumber: voucher.voucherNumber,
      status: currentStatus,
      qrCode: voucher.qrCode,
      generatedAt: voucher.generatedAt,
      expiresAt: voucher.expiresAt,
      usedAt: voucher.usedAt,
      downloadCount: voucher.downloadCount,
      scanCount: voucher.scanCount,
      pdfUrl: voucher.pdfUrl,
    },
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
      name: partner.name,
      contactInfo: partner.email,
    },
  };
}

/**
 * Get voucher by voucher number (public access for customers)
 */
export const getVoucherByNumber = query({
  args: { voucherNumber: v.string() },
  handler: async (ctx, { voucherNumber }) => {
    return await getVoucherData(ctx, voucherNumber);
  },
});

/**
 * Get voucher by booking ID and type
 */
export const getVoucherByBooking = query({
  args: { 
    bookingId: v.string(), 
    bookingType: v.union(v.literal("activity"), v.literal("event"), v.literal("restaurant"), v.literal("vehicle"), v.literal("package"), v.literal("accommodation"))
  },
  handler: async (ctx, { bookingId, bookingType }) => {
    // Find voucher by booking
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_booking", (q) => 
        q.eq("bookingId", bookingId).eq("bookingType", bookingType)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!voucher) {
      return null;
    }

    return {
      voucherNumber: voucher.voucherNumber,
      status: voucher.status,
      generatedAt: voucher.generatedAt,
      expiresAt: voucher.expiresAt,
      qrCode: voucher.qrCode
    };
  },
});

/**
 * Verify voucher using QR code token (for partner scanning)
 */
export const verifyVoucher = query({
  args: verifyVoucherValidator,
  handler: async (ctx, { verificationToken, partnerId }) => {
    // Parse and verify the QR code
    const qrData = parseQRCodeString(verificationToken);
    if (!qrData) {
      return {
        success: false,
        error: "Token de verificação inválido",
      };
    }

    // Check if token has expired
    if (isVoucherExpired(qrData.exp)) {
      return {
        success: false,
        error: "Token de verificação expirado",
      };
    }

    // Find voucher by number
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", qrData.n))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!voucher) {
      return {
        success: false,
        error: "Voucher não encontrado",
      };
    }

    // Verify partner access (if partnerId provided)
    if (partnerId && voucher.partnerId !== partnerId) {
      // Check if user is an employee with access to this partner's assets
      const currentUser = await ctx.db.get(partnerId);
      if (currentUser?.role !== "employee" || currentUser.partnerId !== voucher.partnerId) {
        return {
          success: false,
          error: "Acesso negado - voucher não pertence a este parceiro",
        };
      }
    }

    // Check voucher status
    if (voucher.status !== "active") {
      return {
        success: false,
        error: `Voucher ${voucher.status === "used" ? "já foi utilizado" : 
                voucher.status === "cancelled" ? "foi cancelado" : 
                voucher.status === "expired" ? "expirou" : "inválido"}`,
      };
    }

    // Check voucher expiration
    if (voucher.expiresAt && isVoucherExpired(voucher.expiresAt)) {
      return {
        success: false,
        error: "Voucher expirado",
      };
    }

    // Get booking and asset information
    const voucherData = await getVoucherData(ctx, voucher.voucherNumber);

    return {
      success: true,
      voucher: voucherData,
    };
  },
});

/**
 * Get vouchers for a partner (with RBAC)
 */
export const getPartnerVouchers = query({
  args: getPartnerVouchersValidator,
  handler: async (ctx, { partnerId, status, bookingType, dateRange, limit = 50, offset = 0 }) => {
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
    let allowedPartnerIds: string[] = [];
    
    if (currentUser.role === "master") {
      // Masters can see all vouchers
      allowedPartnerIds = [partnerId];
    } else if (currentUser.role === "partner") {
      // Partners can only see their own vouchers
      if (currentUser._id !== partnerId) {
        throw new Error("Acesso negado");
      }
      allowedPartnerIds = [partnerId];
    } else if (currentUser.role === "employee") {
      // Employees can see vouchers for their partner
      if (!currentUser.partnerId || currentUser.partnerId !== partnerId) {
        throw new Error("Acesso negado");
      }
      allowedPartnerIds = [partnerId];
    } else {
      throw new Error("Acesso negado");
    }

    // Build query
    let query = ctx.db
      .query("vouchers")
      .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
      .filter((q) => q.eq(q.field("isActive"), true));

    // Apply status filter
    if (status) {
      query = query.filter((q) => q.eq(q.field("status"), status));
    }

    // Apply booking type filter
    if (bookingType) {
      query = query.filter((q) => q.eq(q.field("bookingType"), bookingType));
    }

    // Apply date range filter
    if (dateRange) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("generatedAt"), dateRange.from),
          q.lte(q.field("generatedAt"), dateRange.to)
        )
      );
    }

    // Get vouchers with pagination
    const vouchers = await query
      .order("desc")
      .take(limit + offset);

    const paginatedVouchers = vouchers.slice(offset, offset + limit);

    // Enrich vouchers with booking and asset data
    const enrichedVouchers = await Promise.all(
      paginatedVouchers.map(async (voucher) => {
        try {
          const voucherData = await getVoucherData(ctx, voucher.voucherNumber);
          return voucherData;
        } catch (error) {
          // Return basic voucher data if enrichment fails
          return {
            voucher: {
              voucherNumber: voucher.voucherNumber,
              status: voucher.status,
              qrCode: voucher.qrCode,
              generatedAt: voucher.generatedAt,
              expiresAt: voucher.expiresAt,
              usedAt: voucher.usedAt,
              downloadCount: voucher.downloadCount,
              scanCount: voucher.scanCount,
              pdfUrl: voucher.pdfUrl,
            },
            booking: null,
            customer: null,
            asset: null,
            partner: null,
          };
        }
      })
    );

    return {
      vouchers: enrichedVouchers,
      hasMore: vouchers.length > offset + limit,
      total: vouchers.length,
    };
  },
});

/**
 * Get vouchers for a customer
 */
export const getCustomerVouchers = query({
  args: getCustomerVouchersValidator,
  handler: async (ctx, { customerId, status, limit = 20, offset = 0 }) => {
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

    // RBAC check - users can only see their own vouchers (unless master)
    if (currentUser.role !== "master" && currentUser._id !== customerId) {
      throw new Error("Acesso negado");
    }

    // Build query
    let query = ctx.db
      .query("vouchers")
      .withIndex("by_customer", (q) => q.eq("customerId", customerId))
      .filter((q) => q.eq(q.field("isActive"), true));

    // Apply status filter
    if (status) {
      query = query.filter((q) => q.eq(q.field("status"), status));
    }

    // Get vouchers with pagination
    const vouchers = await query
      .order("desc")
      .take(limit + offset);

    const paginatedVouchers = vouchers.slice(offset, offset + limit);

    // Enrich vouchers with booking and asset data
    const enrichedVouchers = await Promise.all(
      paginatedVouchers.map(async (voucher) => {
        try {
          const voucherData = await getVoucherData(ctx, voucher.voucherNumber);
          return voucherData;
        } catch (error) {
          // Return basic voucher data if enrichment fails
          return {
            voucher: {
              voucherNumber: voucher.voucherNumber,
              status: voucher.status,
              qrCode: voucher.qrCode,
              generatedAt: voucher.generatedAt,
              expiresAt: voucher.expiresAt,
              usedAt: voucher.usedAt,
              downloadCount: voucher.downloadCount,
              scanCount: voucher.scanCount,
              pdfUrl: voucher.pdfUrl,
            },
            booking: null,
            customer: null,
            asset: null,
            partner: null,
          };
        }
      })
    );

    return {
      vouchers: enrichedVouchers,
      hasMore: vouchers.length > offset + limit,
      total: vouchers.length,
    };
  },
});

/**
 * Get voucher usage logs for audit
 */
export const getVoucherUsageLogs = query({
  args: { 
    voucherId: v.id("vouchers"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, { voucherId, limit = 50, offset = 0 }) => {
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

    // RBAC check
    const canAccess = currentUser.role === "master" || 
                     voucher.partnerId === currentUser._id ||
                     voucher.customerId === currentUser._id ||
                     (currentUser.role === "employee" && currentUser.partnerId === voucher.partnerId);

    if (!canAccess) {
      throw new Error("Acesso negado");
    }

    // Get usage logs
    const logs = await ctx.db
      .query("voucherUsageLogs")
      .withIndex("by_voucher", (q) => q.eq("voucherId", voucherId))
      .order("desc")
      .take(limit + offset);

    const paginatedLogs = logs.slice(offset, offset + limit);

    // Enrich logs with user information
    const enrichedLogs = await Promise.all(
      paginatedLogs.map(async (log) => {
        let userInfo: any = null;
        if (log.userId) {
          const user = await ctx.db.get(log.userId);
          if (user) {
            userInfo = {
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }

        return {
          ...log,
          user: userInfo,
        };
      })
    );

    return {
      logs: enrichedLogs,
      hasMore: logs.length > offset + limit,
      total: logs.length,
    };
  },
});

/**
 * Get voucher statistics for partner dashboard
 */
export const getVoucherStats = query({
  args: { 
    partnerId: v.id("users"),
    dateRange: v.optional(v.object({
      from: v.number(),
      to: v.number()
    }))
  },
  handler: async (ctx, { partnerId, dateRange }) => {
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

    // Build base query
    let query = ctx.db
      .query("vouchers")
      .withIndex("by_partner", (q) => q.eq("partnerId", partnerId))
      .filter((q) => q.eq(q.field("isActive"), true));

    // Apply date range if provided
    if (dateRange) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("generatedAt"), dateRange.from),
          q.lte(q.field("generatedAt"), dateRange.to)
        )
      );
    }

    const vouchers = await query.collect();

    // Calculate statistics
    const stats = {
      total: vouchers.length,
      active: vouchers.filter(v => v.status === "active").length,
      used: vouchers.filter(v => v.status === "used").length,
      cancelled: vouchers.filter(v => v.status === "cancelled").length,
      expired: vouchers.filter(v => v.status === "expired").length,
      totalDownloads: vouchers.reduce((sum, v) => sum + v.downloadCount, 0),
      totalScans: vouchers.reduce((sum, v) => sum + v.scanCount, 0),
      byBookingType: {
        activity: vouchers.filter(v => v.bookingType === "activity").length,
        event: vouchers.filter(v => v.bookingType === "event").length,
        restaurant: vouchers.filter(v => v.bookingType === "restaurant").length,
        vehicle: vouchers.filter(v => v.bookingType === "vehicle").length,
        accommodation: vouchers.filter(v => v.bookingType === "accommodation").length,
      },
    };

    return stats;
  },
});