import { mutation, query } from "../../_generated/server";
import { customQuery, customMutation, customCtx } from "convex-helpers/server/customFunctions";
import type { UserRole } from "./types";
import { requireRole } from "./utils";

/**
 * Custom query factory that wraps queries with role-based access control
 * @param roles List of roles allowed to execute the query
 * @returns A custom query function with RBAC
 */
export const queryWithRole = (roles: UserRole[]) =>
  customQuery(
    query,
    customCtx(async (ctx) => {
      await requireRole(ctx, roles);
      // Return context without additional modifications
      return {};
    }),
  );

/**
 * Custom mutation factory that wraps mutations with role-based access control
 * @param roles List of roles allowed to execute the mutation
 * @returns A custom mutation function with RBAC
 */
export const mutationWithRole = (roles: UserRole[]) =>
  customMutation(
    mutation,
    customCtx(async (ctx) => {
      await requireRole(ctx, roles);
      return {};
    }),
  ); 