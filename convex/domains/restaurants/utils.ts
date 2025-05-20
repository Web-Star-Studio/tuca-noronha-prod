import type { QueryCtx, MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { verifyPartnerAccess } from "../../domains/rbac";
import type { Restaurant, RestaurantWithCreator, RestaurantCreator } from "./types";

// Union type for Convex function context (query or mutation)
type Ctx = QueryCtx | MutationCtx;

/**
 * Validate that a user owns a restaurant (has permission to modify it)
 */
export async function validateRestaurantOwnership(
  ctx: Ctx,
  restaurantId: Id<"restaurants">
): Promise<boolean> {
  return await verifyPartnerAccess(ctx, restaurantId, "restaurants");
}

/**
 * Format a restaurant with its creator details
 */
export async function formatRestaurant(
  ctx: Ctx,
  restaurant: Restaurant
): Promise<RestaurantWithCreator> {
  // Try to get creator info if available
  let creator: RestaurantCreator | null = null;
  if (restaurant.partnerId) {
    const partner = await ctx.db.get(restaurant.partnerId);
    if (partner) {
      creator = {
        id: partner._id as Id<"users">,
        name: partner.name,
        email: partner.email,
        image: partner.image
      };
    }
  }
  
  return {
    ...restaurant,
    creator
  };
}

/**
 * Generate a reservation confirmation code
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like O, 0, 1, I
  let code = '';
  
  // Generate 8 character code
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
} 