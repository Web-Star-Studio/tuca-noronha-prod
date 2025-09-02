import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Provider-agnostic internal query to get booking data for checkout
 * Used by both Stripe and Mercado Pago checkout flows
 */
export const getBookingForCheckout = internalQuery({
  args: {
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package")
    ),
  },
  returns: v.union(
    v.object({
      totalPrice: v.number(),
      assetName: v.string(),
      assetId: v.string(),
      userId: v.string(),
      status: v.string(),
      paymentStatus: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const { bookingId, assetType } = args;

    try {
      let booking: any = null;
      let asset: any = null;

      // Fetch booking based on asset type
      if (assetType === "activity") {
        booking = await ctx.db.get(bookingId as any);
        if (booking) {
          asset = await ctx.db.get(booking.activityId);
        }
      } else if (assetType === "event") {
        booking = await ctx.db.get(bookingId as any);
        if (booking) {
          asset = await ctx.db.get(booking.eventId);
        }
      } else if (assetType === "restaurant") {
        booking = await ctx.db.get(bookingId as any);
        if (booking) {
          asset = await ctx.db.get(booking.restaurantId);
        }
      } else if (assetType === "vehicle") {
        booking = await ctx.db.get(bookingId as any);
        if (booking) {
          asset = await ctx.db.get(booking.vehicleId);
        }
      }

      if (!booking || !asset) {
        return null;
      }

      // Return provider-agnostic booking data
      return {
        totalPrice: booking.totalPrice || booking.finalAmount || 0,
        assetName: asset.title || asset.name || "Booking",
        assetId: String(asset._id),
        userId: String(booking.userId),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      };
    } catch (error) {
      console.error("Error fetching booking for checkout:", error);
      return null;
    }
  },
});
