import { mutation } from "../../_generated/server";
import type { MutationCtx } from "../../_generated/server";
import { requireRole } from "./utils";
import type { UserRole } from "./types";

// Use loose typings to avoid excessive complexity.

/**
 * Higher-order helper that attaches role-based access control to Convex mutations.
 *
 * The generic typing mirrors Convex‟s `mutation` builder so that argument and
 * return value validators continue to be fully type-safe.
 */
export function mutationWithRole(allowedRoles: UserRole[]) {
  return function (mutationConfig: any): any {
    return mutation({
      ...(mutationConfig ?? {}),
      handler: async (ctx: MutationCtx, ...args: any[]) => {
        await requireRole(ctx, allowedRoles);
        return mutationConfig.handler.apply(null, [ctx, ...args]);
      },
    }) as any;
  };
} 