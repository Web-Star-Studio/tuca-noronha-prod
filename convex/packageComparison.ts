import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Add package to comparison
export const addToComparison = mutation({
  args: {
    packageId: v.id("packages"),
  },
  returns: v.union(v.id("packageComparisons"), v.null()),
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

    // Get or create user's comparison list
    let comparison = await ctx.db
      .query("packageComparisons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!comparison) {
      // Create new comparison
      return await ctx.db.insert("packageComparisons", {
        userId: user._id,
        packageIds: [args.packageId],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Check if package is already in comparison
    if (comparison.packageIds.includes(args.packageId)) {
      throw new Error("Pacote já está na comparação");
    }

    // Check if comparison is full (max 3 packages)
    if (comparison.packageIds.length >= 3) {
      throw new Error("Máximo de 3 pacotes para comparação");
    }

    // Add package to existing comparison
    await ctx.db.patch(comparison._id, {
      packageIds: [...comparison.packageIds, args.packageId],
      updatedAt: Date.now(),
    });
    return comparison._id;
  },
});

// Remove package from comparison
export const removeFromComparison = mutation({
  args: {
    packageId: v.id("packages"),
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

    const comparison = await ctx.db
      .query("packageComparisons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!comparison) {
      throw new Error("Lista de comparação não encontrada");
    }

    const updatedPackageIds = comparison.packageIds.filter(id => id !== args.packageId);

    if (updatedPackageIds.length === 0) {
      // Delete comparison if empty
      await ctx.db.delete(comparison._id);
      return null;
    }

    await ctx.db.patch(comparison._id, {
      packageIds: updatedPackageIds,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// Clear comparison
export const clearComparison = mutation({
  args: {},
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

    const comparison = await ctx.db
      .query("packageComparisons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!comparison) {
      return null;
    }

    await ctx.db.delete(comparison._id);
    return null;
  },
});

// Get user's comparison
export const getUserComparison = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("packageComparisons"),
      _creationTime: v.number(),
      userId: v.id("users"),
      packageIds: v.array(v.id("packages")),
      createdAt: v.number(),
      updatedAt: v.number(),
      packages: v.array(v.any()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    const comparison = await ctx.db
      .query("packageComparisons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!comparison) {
      return null;
    }

    // Get package details
    const packages = await Promise.all(
      comparison.packageIds.map(async (packageId) => {
        const pkg = await ctx.db.get(packageId);
        if (!pkg) return null;



        // Get vehicle details (if exists)
        const vehicle = pkg.vehicleId ? await ctx.db.get(pkg.vehicleId) : null;

        // Get included activities count
        const includedActivitiesCount = pkg.includedActivityIds.length;

        // Get included restaurants count
        const includedRestaurantsCount = pkg.includedRestaurantIds.length;

        // Get included events count
        const includedEventsCount = pkg.includedEventIds.length;

        return {
          ...pkg,

          vehicle: vehicle ? {
            id: vehicle._id,
            name: vehicle.name,
            brand: vehicle.brand,
            model: vehicle.model,
            category: vehicle.category,
            pricePerDay: vehicle.estimatedPricePerDay ?? 0,
            imageUrl: vehicle.imageUrl,
          } : null,
          includedActivitiesCount,
          includedRestaurantsCount,
          includedEventsCount,
        };
      })
    );

    return {
      ...comparison,
      packages: packages.filter(Boolean),
    };
  },
});

// Check if package is in comparison
export const isInComparison = query({
  args: {
    packageId: v.id("packages"),
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

    const comparison = await ctx.db
      .query("packageComparisons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!comparison) {
      return false;
    }

    return comparison.packageIds.includes(args.packageId);
  },
});

// Get comparison count
export const getComparisonCount = query({
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

    const comparison = await ctx.db
      .query("packageComparisons")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return comparison ? comparison.packageIds.length : 0;
  },
}); 