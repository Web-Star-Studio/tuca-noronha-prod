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
    v.any(),
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

    return booking;
  },
});