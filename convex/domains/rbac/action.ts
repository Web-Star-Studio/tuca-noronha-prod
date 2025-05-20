import { action } from "../../_generated/server";
import type { ActionCtx } from "../../_generated/server";
import { requireRole } from "./utils";
import type { UserRole } from "./types";

// Loose typing for wrapper

/**
 * Higher-order function that wraps a Convex action with role-based access control
 * @param allowedRoles Array of roles that are allowed to execute this action
 */
export function actionWithRole(allowedRoles: UserRole[]) {
  return function (actionConfig: any): any {
    return action({
      ...(actionConfig ?? {}),
      handler: async (ctx: ActionCtx, ...args: any[]) => {
        await requireRole(ctx as any, allowedRoles);
        return actionConfig.handler.apply(null, [ctx, ...args]);
      },
    }) as any;
  };
} 