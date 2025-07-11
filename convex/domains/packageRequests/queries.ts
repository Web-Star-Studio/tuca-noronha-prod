import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";
import { paginationOptsValidator } from "convex/server";

/**
 * List pending package requests with pagination
 */
export const listPendingRequests = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.object({
    requests: v.array(v.any()),
    total: v.number(),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only admins can view package requests
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    const { limit = 20, offset = 0 } = args;

    let query;
    
    // Role-based filtering
    if (currentUserRole === "master") {
      // Masters can see all pending requests
      query = ctx.db
        .query("packageRequests")
        .withIndex("by_status", q => q.eq("status", "pending"));
    } else if (currentUserRole === "partner" || currentUserRole === "employee") {
      // Partners and employees can see requests assigned to them or unassigned
      query = ctx.db
        .query("packageRequests")
        .filter(q => 
          q.and(
            q.eq(q.field("status"), "pending"),
            q.or(
              q.eq(q.field("assignedTo"), currentUserId),
              q.eq(q.field("assignedTo"), undefined)
            )
          )
        );
    } else {
      query = ctx.db
        .query("packageRequests")
        .withIndex("by_status", q => q.eq("status", "pending"));
    }

    const allPendingRequests = await query
      .filter(q => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Apply pagination
    const paginatedRequests = allPendingRequests.slice(offset, offset + limit);

    return {
      requests: paginatedRequests,
      total: allPendingRequests.length,
      hasMore: offset + limit < allPendingRequests.length,
    };
  },
});

/**
 * List all package requests with pagination and optional status filter
 */
export const listPackageRequests = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("in_review"),
      v.literal("proposal_sent"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("packageRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    } else {
      return await ctx.db
        .query("packageRequests")
        .paginate(args.paginationOpts);
    }
  },
});

/**
 * Get package request details by ID
 */
export const getPackageRequestDetails = query({
  args: { requestId: v.id("packageRequests") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

/**
 * Get package request by request number
 */
export const getPackageRequestByNumber = query({
  args: { requestNumber: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("packageRequests")
      .withIndex("by_request_number", (q) => q.eq("requestNumber", args.requestNumber))
      .first();
    
    return request || null;
  },
});

/**
 * Get package requests by customer email
 */
export const getPackageRequestsByEmail = query({
  args: { email: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const requests = await ctx.db.query("packageRequests").collect();
    return requests.filter(request => request.customerInfo.email === args.email);
  },
});

/**
 * Get assigned package requests for a specific user
 */
export const getAssignedPackageRequests = query({
  args: { 
    assignedTo: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("packageRequests")
      .withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.assignedTo))
      .paginate(args.paginationOpts);
  },
});

/**
 * Get recent package requests (last 10)
 */
export const getRecentPackageRequests = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db
      .query("packageRequests")
      .order("desc")
      .take(10);
  },
});