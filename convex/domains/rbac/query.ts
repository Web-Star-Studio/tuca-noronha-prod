import { query } from "../../_generated/server";
import type { QueryCtx } from "../../_generated/server";
import { requireRole } from "./utils";
import type { UserRole } from "./types";

// Loose typing for wrapper

/**
 * Higher-order function that wraps a Convex query with role-based access control
 * @param allowedRoles Array of roles that are allowed to execute this query
 */
export function queryWithRole(allowedRoles: UserRole[]) {
  return function (queryConfig: any): any {
    return query({
      ...(queryConfig ?? {}),
      handler: async (ctx: QueryCtx, ...args: any[]) => {
        await requireRole(ctx, allowedRoles);
        return queryConfig.handler.apply(null, [ctx, ...args]);
      },
    }) as any;
  };
} 