import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Add item to wishlist
export const addToWishlist = mutation({
  args: {
    itemType: v.string(),
    itemId: v.string(),
  },
  returns: v.id("wishlistItems"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    // Get or create user
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Check if item already exists in wishlist
    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", user._id)
         .eq("itemType", args.itemType)
         .eq("itemId", args.itemId)
      )
      .first();

    if (existing) {
      throw new Error("Item já está na lista de favoritos");
    }

    return await ctx.db.insert("wishlistItems", {
      userId: user._id,
      itemType: args.itemType,
      itemId: args.itemId,
      addedAt: Date.now(),
    });
  },
});

// Remove item from wishlist
export const removeFromWishlist = mutation({
  args: {
    itemType: v.string(),
    itemId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", user._id)
         .eq("itemType", args.itemType)
         .eq("itemId", args.itemId)
      )
      .first();

    if (!existing) {
      throw new Error("Item não encontrado na lista de favoritos");
    }

    await ctx.db.delete(existing._id);
    return null;
  },
});

// Check if item is in wishlist
export const isInWishlist = query({
  args: {
    itemType: v.string(),
    itemId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return false;
    }

    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", user._id)
         .eq("itemType", args.itemType)
         .eq("itemId", args.itemId)
      )
      .first();

    return !!existing;
  },
});

// Get user's wishlist
export const getUserWishlist = query({
  args: {
    itemType: v.optional(v.string()),
  },
  returns: v.array(v.object({
    _id: v.id("wishlistItems"),
    _creationTime: v.number(),
    userId: v.id("users"),
    itemType: v.string(),
    itemId: v.string(),
    addedAt: v.number(),
    item: v.any(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    let wishlistItems;
    if (args.itemType) {
      wishlistItems = await ctx.db
        .query("wishlistItems")
        .withIndex("by_user_type", (q) =>
          q.eq("userId", user._id).eq("itemType", args.itemType!)
        )
        .order("desc")
        .collect();
    } else {
      wishlistItems = await ctx.db
        .query("wishlistItems")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();
    }

    // Get details for each item based on type
    const itemsWithDetails = await Promise.all(
      wishlistItems.map(async (item) => {
        let details: any = null;
        
        switch (item.itemType) {
          case "package":
            details = await ctx.db.get(item.itemId as Id<"packages">);
            break;
          case "accommodation":
            details = await ctx.db.get(item.itemId as Id<"accommodations">);
            break;
          case "activity":
            details = await ctx.db.get(item.itemId as Id<"activities">);
            break;
          case "restaurant":
            details = await ctx.db.get(item.itemId as Id<"restaurants">);
            break;
          case "event":
            details = await ctx.db.get(item.itemId as Id<"events">);
            break;
          case "vehicle":
            details = await ctx.db.get(item.itemId as Id<"vehicles">);
            break;
        }

        return {
          ...item,
          item: details,
        };
      })
    );

    return itemsWithDetails.filter(item => item.item !== null); // Filter out deleted items
  },
});

// Get wishlist count for user
export const getWishlistCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return 0;
    }

    const wishlistItems = await ctx.db
      .query("wishlistItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return wishlistItems.length;
  },
}); 