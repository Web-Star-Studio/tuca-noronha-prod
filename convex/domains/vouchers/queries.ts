import { v } from "convex/values";
import { query } from "../../_generated/server";
import { VOUCHER_STATUS } from "./types";

/**
 * Get voucher by ID
 */
export const getVoucher = query({
  args: { voucherId: v.id("vouchers") },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const voucher = await ctx.db.get(args.voucherId);
    if (!voucher) return null;

    // Get partner info
    const partner = await ctx.db.get(voucher.partnerId);
    
    // Get asset info based on booking type
    let assetDetails: any = null;
    if (voucher.bookingType === "activity") {
      const booking = await ctx.db
        .query("activityBookings")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const activity = await ctx.db.get(booking.activityId);
        assetDetails = activity;
      }
    } else if (voucher.bookingType === "event") {
      const booking = await ctx.db
        .query("eventBookings")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const event = await ctx.db.get(booking.eventId);
        assetDetails = event;
      }
    } else if (voucher.bookingType === "restaurant") {
      const booking = await ctx.db
        .query("restaurantReservations")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const restaurant = await ctx.db.get(booking.restaurantId);
        assetDetails = restaurant;
      }
    } else if (voucher.bookingType === "vehicle") {
      const booking = await ctx.db
        .query("vehicleBookings")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const vehicle = await ctx.db.get(booking.vehicleId);
        assetDetails = vehicle;
      }
    } else if (voucher.bookingType === "package") {
      const booking = await ctx.db
        .query("packageBookings")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const packageData = await ctx.db.get(booking.packageId);
        assetDetails = packageData;
      }
    }

    return {
      ...voucher,
      partner,
      assetDetails,
    };
  },
});

/**
 * Get voucher by voucher number
 */
export const getVoucherByNumber = query({
  args: { voucherNumber: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_voucher_number", (q) => q.eq("voucherNumber", args.voucherNumber))
      .first();

    if (!voucher) return null;

    // Get partner info
    const partner = await ctx.db.get(voucher.partnerId);

    return {
      ...voucher,
      partner,
    };
  },
});

/**
 * Get voucher by confirmation code with access validation
 */
export const getVoucherByConfirmationCode = query({
  args: { confirmationCode: v.string() },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    const user = identity ? await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first() : null;
    
    // Find all vouchers with this confirmation code
    const vouchers = await ctx.db
      .query("vouchers")
      .withIndex("by_confirmation_code", (q) => 
        q.eq("confirmationCode", args.confirmationCode)
      )
      .collect();
    
    if (vouchers.length === 0) return null;
    
    const voucher = vouchers[0]; // Should be unique
    
    // Check access permissions
    if (user) {
      // Admin/Master can see all vouchers
      if (user.role === "master" || user.role === "employee") {
        // Access granted - admin user
        console.log("✅ Voucher access granted (admin user)");
      } 
      // Partner can see vouchers from their assets
      else if (user.role === "partner" && voucher.partnerId === user._id) {
        // Access granted - partner owns this voucher
        console.log("✅ Voucher access granted (partner owner)");
      }
      // Customer can only see their own vouchers (check by email since vouchers don't have userId)
      else if (user.role === "traveler" && voucher.customerInfo.email === user.email) {
        // Access granted - customer owns this voucher
        console.log("✅ Voucher access granted (voucher owner)");
      }
      else {
        console.log("❌ Voucher access denied - unauthorized user");
        return null;
      }
    } else {
      // For public access (no auth), only allow if the URL contains the confirmation code
      // This allows sharing voucher links
      console.log("⚠️ Voucher access - public link (no authentication)");
    }
    
    // Get partner info
    const partner = await ctx.db.get(voucher.partnerId);
    
    // Get asset info based on booking type
    let assetDetails: any = null;
    if (voucher.bookingType === "activity") {
      const booking = await ctx.db
        .query("activityBookings")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const activity = await ctx.db.get(booking.activityId);
        assetDetails = {
          name: activity?.title,
          description: activity?.description,
          duration: activity?.duration,
          includes: activity?.includes,
          booking: {
            date: booking.date,
            time: booking.time,
            participants: booking.participants,
            totalPrice: booking.totalPrice,
            specialRequests: booking.specialRequests,
          },
        };
      }
    } else if (voucher.bookingType === "event") {
      const booking = await ctx.db
        .query("eventBookings")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const event = await ctx.db.get(booking.eventId);
        assetDetails = {
          name: event?.title,
          description: event?.description,
          location: event?.location,
          date: event?.date,
          time: event?.time,
          booking: {
            quantity: booking.quantity,
            totalPrice: booking.totalPrice,
            specialRequests: booking.specialRequests,
          },
        };
      }
    } else if (voucher.bookingType === "restaurant") {
      const booking = await ctx.db
        .query("restaurantReservations")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const restaurant = await ctx.db.get(booking.restaurantId);
        assetDetails = {
          name: restaurant?.name,
          description: restaurant?.description,
          address: restaurant?.address,
          cuisine: restaurant?.cuisine,
          booking: {
            date: booking.date,
            time: booking.time,
            partySize: booking.partySize,
            specialRequests: booking.specialRequests,
          },
        };
      }
    } else if (voucher.bookingType === "vehicle") {
      const booking = await ctx.db
        .query("vehicleBookings")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const vehicle = await ctx.db.get(booking.vehicleId);
        assetDetails = {
          name: vehicle?.name,
          model: vehicle?.model,
          category: vehicle?.category,
          features: vehicle?.features,
          booking: {
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalPrice: booking.totalPrice,
            pickupLocation: booking.pickupLocation,
            returnLocation: booking.returnLocation,
            additionalDrivers: booking.additionalDrivers,
          },
        };
      }
    } else if (voucher.bookingType === "package") {
      const booking = await ctx.db
        .query("packageBookings")
        .filter((q) => q.eq(q.field("_id"), voucher.bookingId))
        .first();
      if (booking) {
        const packageData = await ctx.db.get(booking.packageId);
        assetDetails = {
          name: packageData?.name,
          description: packageData?.description,
          duration: packageData?.duration,
          includes: packageData?.includes,
          highlights: packageData?.highlights,
          booking: {
            startDate: booking.startDate,
            endDate: booking.endDate,
            guests: booking.guests,
            totalPrice: booking.totalPrice,
            breakdown: booking.breakdown,
          },
        };
      }
    }
    
    return {
      ...voucher,
      partner: partner ? {
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
      } : null,
      assetDetails,
    };
  },
});

/**
 * Get vouchers by partner
 */
export const getVouchersByPartner = query({
  args: {
    partnerId: v.id("users"),
    status: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let vouchersQuery = ctx.db
      .query("vouchers")
      .withIndex("by_partner", (q) => q.eq("partnerId", args.partnerId));

    if (args.status) {
      vouchersQuery = vouchersQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const vouchers = await vouchersQuery
      .order("desc")
      .collect();

    return vouchers;
  },
});

/**
 * Get vouchers by user email
 */
export const getVouchersByUser = query({
  args: {
    email: v.string(),
    status: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let vouchersQuery = ctx.db
      .query("vouchers")
      .withIndex("by_user", (q) => q.eq("customerInfo.email", args.email));

    if (args.status) {
      vouchersQuery = vouchersQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const vouchers = await vouchersQuery
      .order("desc")
      .collect();

    // For each voucher, get partner info
    const vouchersWithPartner = await Promise.all(
      vouchers.map(async (voucher) => {
        const partner = await ctx.db.get(voucher.partnerId);
        return {
          ...voucher,
          partner,
        };
      })
    );

    return vouchersWithPartner;
  },
});

/**
 * Get vouchers by booking
 */
export const getVoucherByBooking = query({
  args: {
    bookingId: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package")
    ),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_booking", (q) => 
        q.eq("bookingId", args.bookingId).eq("bookingType", args.bookingType)
      )
      .filter((q) => q.neq(q.field("status"), VOUCHER_STATUS.CANCELLED))
      .first();

    if (!voucher) return null;

    // Get partner info
    const partner = await ctx.db.get(voucher.partnerId);

    return {
      ...voucher,
      partner,
    };
  },
});

/**
 * Search vouchers with filters
 */
export const searchVouchers = query({
  args: {
    searchTerm: v.optional(v.string()),
    status: v.optional(v.string()),
    bookingType: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let vouchersQuery: any = ctx.db.query("vouchers");

    // Filter by partner if provided
    if (args.partnerId !== undefined) {
      vouchersQuery = vouchersQuery.withIndex("by_partner", (q) => 
        q.eq("partnerId", args.partnerId!)
      );
    }

    // Filter by status if provided
    if (args.status) {
      vouchersQuery = vouchersQuery.filter((q) => 
        q.eq(q.field("status"), args.status)
      );
    }

    // Filter by booking type if provided
    if (args.bookingType) {
      vouchersQuery = vouchersQuery.filter((q) => 
        q.eq(q.field("bookingType"), args.bookingType)
      );
    }

    // Filter by date range if provided
    if (args.dateFrom !== undefined) {
      vouchersQuery = vouchersQuery.filter((q) => 
        q.gte(q.field("issueDate"), args.dateFrom!)
      );
    }
    if (args.dateTo !== undefined) {
      vouchersQuery = vouchersQuery.filter((q) => 
        q.lte(q.field("issueDate"), args.dateTo!)
      );
    }

    let vouchers = await vouchersQuery
      .order("desc")
      .collect();

    // Filter by search term if provided
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      vouchers = vouchers.filter((voucher) => 
        voucher.voucherNumber.toLowerCase().includes(searchLower) ||
        voucher.confirmationCode.toLowerCase().includes(searchLower) ||
        voucher.customerInfo.name.toLowerCase().includes(searchLower) ||
        voucher.customerInfo.email.toLowerCase().includes(searchLower)
      );
    }

    return vouchers;
  },
}); 