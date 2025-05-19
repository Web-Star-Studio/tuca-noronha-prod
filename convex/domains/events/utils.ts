import type { QueryCtx, MutationCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { Event, EventTicket } from "./types";

type Ctx = QueryCtx | MutationCtx;

/**
 * Validates that an event belongs to the specified user
 */
export async function validateEventOwnership(
  ctx: Ctx,
  eventId: Id<"events">,
  userId: Id<"users"> | null
): Promise<boolean> {
  if (!userId) return false;
  
  const event = await ctx.db.get(eventId);
  if (!event) return false;
  
  return event.partnerId.toString() === userId.toString();
}

/**
 * Formats an event object for display
 */
export function formatEvent(event: Event) {
  return {
    ...event,
    maxParticipants: Number(event.maxParticipants)
  };
}

/**
 * Formats event ticket quantities from bigint to number
 */
export function formatEventTicket(ticket: EventTicket) {
  return {
    ...ticket,
    availableQuantity: Number(ticket.availableQuantity),
    maxPerOrder: Number(ticket.maxPerOrder)
  };
} 