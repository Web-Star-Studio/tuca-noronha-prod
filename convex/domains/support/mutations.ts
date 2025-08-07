
import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const sendContactMessage = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("contactMessages", {
      ...args,
      status: "new",
    });
  },
});
