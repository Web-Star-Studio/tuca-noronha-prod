import { internalQuery } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Get Mercado Pago webhook event by ID (idempotency helper)
 */
export const getWebhookEvent = internalQuery({
  args: {
    mpEventId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("mpWebhookEvents")
      .filter((q) => q.eq(q.field("mpEventId"), args.mpEventId))
      .first();

    return event || null;
  },
});
