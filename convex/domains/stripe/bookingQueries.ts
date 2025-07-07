import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Get booking by ID from any table
 */
export const getBookingById = internalQuery({
  args: {
    bookingId: v.string(),
    tableName: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.string(),
      stripePaymentIntentId: v.optional(v.string()),
      stripeCheckoutSessionId: v.optional(v.string()),
      paymentStatus: v.optional(v.string()),
      status: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query(args.tableName as any)
      .filter((q: any) => q.eq(q.field("_id"), args.bookingId))
      .unique();

    if (!booking) {
      return null;
    }

    return {
      _id: booking._id,
      stripePaymentIntentId: booking.stripePaymentIntentId,
      stripeCheckoutSessionId: booking.stripeCheckoutSessionId,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
    };
  },
});