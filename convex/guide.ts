
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";

export const addSection = mutation({
  args: {
    sectionTitle: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("guideContent", {
      sectionTitle: args.sectionTitle,
      content: args.content,
      tags: args.tags,
    });
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("guideContent")
      .withSearchIndex("by_content", (q) => q.search("content", args.query))
      .collect();
    return results;
  },
});
