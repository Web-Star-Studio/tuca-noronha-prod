import type { QueryCtx, MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Activity } from "./types";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../../domains/rbac";

type Ctx = QueryCtx | MutationCtx;

/**
 * Validates that an activity belongs to the specified user
 */
export async function validateActivityOwnership(
  ctx: Ctx,
  activityId: Id<"activities">,
  userId: Id<"users"> | null
): Promise<boolean> {
  if (!userId) return false;
  
  const activity = await ctx.db.get(activityId);
  if (!activity) return false;
  
  return activity.partnerId.toString() === userId.toString();
}

/**
 * Formats an activity object for display
 */
export function formatActivity(activity: Activity) {
  return {
    ...activity,
    maxParticipants: Number(activity.maxParticipants),
    minParticipants: Number(activity.minParticipants)
  };
}

/**
 * Formats activity ticket quantities from bigint to number
 */
export function formatActivityTicket(ticket: any) {
  return {
    ...ticket,
    availableQuantity: Number(ticket.availableQuantity),
    maxPerOrder: Number(ticket.maxPerOrder)
  };
} 