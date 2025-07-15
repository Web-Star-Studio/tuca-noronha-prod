import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";
import type { Doc, Id } from "../../_generated/dataModel";
import {
  ListPackageProposalsArgs,
  PackageProposalStatus,
  PackageProposalPriority,
  PackageProposalApprovalStatus,
} from "./types";

/**
 * Helper function to check if a traveler has access to a package request
 */
async function checkTravelerAccessToPackageRequest(
  ctx: any,
  packageRequest: any,
  currentUserId: Id<"users">
): Promise<boolean> {
  // First try userId if it exists
  if (packageRequest.userId === currentUserId) {
    return true;
  }

  // If no userId or doesn't match, try email matching
  const currentUser = await ctx.db.get(currentUserId);
  if (currentUser) {
    const packageEmail = packageRequest.customerInfo.email.toLowerCase().trim();
    const userEmail = currentUser.email?.toLowerCase().trim();
    
    if (userEmail && packageEmail === userEmail) {
      return true;
    }
  }

  return false;
}

/**
 * Get a specific package proposal by ID
 */
export const getPackageProposal = query({
  args: {
    id: v.id("packageProposals"),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const proposal = await ctx.db.get(args.id);
    if (!proposal || !proposal.isActive) {
      return null;
    }

    // Check permissions
    if (currentUserRole === "master") {
      return proposal;
    }

    if (currentUserRole === "partner" || currentUserRole === "employee") {
      // Can view proposals they created or belong to their organization
      if (proposal.adminId === currentUserId || proposal.partnerId === currentUserId) {
        return proposal;
      }
    }

    if (currentUserRole === "traveler") {
      // Check if this user made the package request
      const packageRequest = await ctx.db.get(proposal.packageRequestId);
      if (packageRequest) {
        const hasAccess = await checkTravelerAccessToPackageRequest(ctx, packageRequest, currentUserId);
        if (hasAccess) {
          return proposal;
        }
      }
    }

    throw new Error("Acesso negado a esta proposta");
  },
});

/**
 * Get a specific package proposal by ID with error handling
 */
export const getPackageProposalWithAuth = query({
  args: {
    id: v.id("packageProposals"),
  },
  returns: v.object({
    success: v.boolean(),
    data: v.union(v.null(), v.any()),
    error: v.optional(v.string()),
    errorType: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      return {
        success: false,
        data: null,
        error: "Usuário não autenticado",
        errorType: "unauthenticated"
      };
    }

    const proposal = await ctx.db.get(args.id);
    if (!proposal || !proposal.isActive) {
      return {
        success: false,
        data: null,
        error: "Proposta não encontrada",
        errorType: "not_found"
      };
    }

    // Check permissions
    if (currentUserRole === "master") {
      return {
        success: true,
        data: proposal,
      };
    }

    if (currentUserRole === "partner" || currentUserRole === "employee") {
      // Can view proposals they created or belong to their organization
      if (proposal.adminId === currentUserId || proposal.partnerId === currentUserId) {
        return {
          success: true,
          data: proposal,
        };
      }
    }

    if (currentUserRole === "traveler") {
      // Check if this user made the package request
      const packageRequest = await ctx.db.get(proposal.packageRequestId);
      if (packageRequest) {
        const hasAccess = await checkTravelerAccessToPackageRequest(ctx, packageRequest, currentUserId);
        if (hasAccess) {
          return {
            success: true,
            data: proposal,
          };
        }
      }
    }

    return {
      success: false,
      data: null,
      error: "Acesso negado a esta proposta",
      errorType: "access_denied"
    };
  },
});

/**
 * List package proposals with filtering and pagination
 */
export const listPackageProposals = query({
  args: ListPackageProposalsArgs,
  returns: v.object({
    proposals: v.array(v.any()),
    total: v.number(),
    hasMore: v.boolean(),
    cursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const limit = args.limit || 20;

    let query;

    // Base query
    if (currentUserRole === "master") {
      if (args.status) {
        query = ctx.db
          .query("packageProposals")
          .withIndex("by_status", q => q.eq("status", args.status!));
      } else {
        query = ctx.db.query("packageProposals");
      }
    } else if (currentUserRole === "partner" || currentUserRole === "employee") {
      query = ctx.db
        .query("packageProposals")
        .withIndex("by_partner", q => q.eq("partnerId", currentUserId));
    } else {
      // For travelers, get package requests by userId and email
      const currentUser = await ctx.db.get(currentUserId);
      const userEmail = currentUser?.email?.toLowerCase().trim();
      
      let userPackageRequests = await ctx.db
        .query("packageRequests")
        .withIndex("by_user", q => q.eq("userId", currentUserId))
        .collect();
      
      // Also get requests by email if available
      if (userEmail) {
        const allPackageRequests = await ctx.db.query("packageRequests").collect();
        const emailMatchRequests = allPackageRequests.filter(req => 
          req.customerInfo.email.toLowerCase().trim() === userEmail &&
          !userPackageRequests.some(existing => existing._id === req._id)
        );
        userPackageRequests = [...userPackageRequests, ...emailMatchRequests];
      }
      
      const requestIds = userPackageRequests.map(req => req._id);
      if (requestIds.length === 0) return { proposals: [], total: 0, hasMore: false };
      query = ctx.db
        .query("packageProposals")
        .filter(q => q.or(...requestIds.map(id => q.eq(q.field("packageRequestId"), id))));
    }
    
    // Apply additional filters
    if (args.packageRequestId) {
      query = query.filter(q => q.eq(q.field("packageRequestId"), args.packageRequestId!));
    }
    if (args.adminId && currentUserRole === "master") {
      query = query.filter(q => q.eq(q.field("adminId"), args.adminId!));
    }
    if (args.partnerId && currentUserRole === "master") {
      query = query.filter(q => q.eq(q.field("partnerId"), args.partnerId!));
    }
    if (args.approvalStatus) {
      query = query.filter(q => q.eq(q.field("approvalStatus"), args.approvalStatus!));
    }
    if (args.priority) {
      query = query.filter(q => q.eq(q.field("priority"), args.priority!));
    }
    if (args.convertedToBooking !== undefined) {
      query = query.filter(q => q.eq(q.field("convertedToBooking"), args.convertedToBooking));
    }
    if (args.validUntil) {
      query = query.filter(q => q.gte(q.field("validUntil"), args.validUntil));
    }

    if (args.searchTerm) {
      query = query.withSearchIndex("by_title_description", q =>
        q.search("title", args.searchTerm)
      );
    }

    query = query.filter(q => q.eq(q.field("isActive"), true));
    
    const paginatedProposals = await query.order("desc").paginate({ numItems: limit, cursor: args.cursor ?? null });

    // Create a separate query for total count since queries can't be reused after pagination
    // We'll build the count query with the same logic as the main query
    let countQuery;
    
    // Apply base query logic to count query
    if (currentUserRole === "master") {
      if (args.status) {
        countQuery = ctx.db
          .query("packageProposals")
          .withIndex("by_status", q => q.eq("status", args.status!));
      } else {
        countQuery = ctx.db.query("packageProposals");
      }
    } else if (currentUserRole === "partner" || currentUserRole === "employee") {
      countQuery = ctx.db
        .query("packageProposals")
        .withIndex("by_partner", q => q.eq("partnerId", currentUserId));
    } else {
      // For travelers, get package requests by userId and email (same logic as above)
      const currentUserForCount = await ctx.db.get(currentUserId);
      const userEmailForCount = currentUserForCount?.email?.toLowerCase().trim();
      
      let userPackageRequestsForCount = await ctx.db
        .query("packageRequests")
        .withIndex("by_user", q => q.eq("userId", currentUserId))
        .collect();
      
      // Also get requests by email if available
      if (userEmailForCount) {
        const allPackageRequestsForCount = await ctx.db.query("packageRequests").collect();
        const emailMatchRequestsForCount = allPackageRequestsForCount.filter(req => 
          req.customerInfo.email.toLowerCase().trim() === userEmailForCount &&
          !userPackageRequestsForCount.some(existing => existing._id === req._id)
        );
        userPackageRequestsForCount = [...userPackageRequestsForCount, ...emailMatchRequestsForCount];
      }
      
      const requestIdsForCount = userPackageRequestsForCount.map(req => req._id);
      if (requestIdsForCount.length === 0) {
        // Return early since we already know the total is 0
        return {
          proposals: paginatedProposals.page,
          total: 0,
          hasMore: paginatedProposals.isDone,
          cursor: paginatedProposals.continueCursor,
        };
      }
      countQuery = ctx.db
        .query("packageProposals")
        .filter(q => q.or(...requestIdsForCount.map(id => q.eq(q.field("packageRequestId"), id))));
    }
    
    // Apply the same additional filters to count query
    if (args.packageRequestId) {
      countQuery = countQuery.filter(q => q.eq(q.field("packageRequestId"), args.packageRequestId!));
    }
    if (args.adminId && currentUserRole === "master") {
      countQuery = countQuery.filter(q => q.eq(q.field("adminId"), args.adminId!));
    }
    if (args.partnerId && currentUserRole === "master") {
      countQuery = countQuery.filter(q => q.eq(q.field("partnerId"), args.partnerId!));
    }
    if (args.approvalStatus) {
      countQuery = countQuery.filter(q => q.eq(q.field("approvalStatus"), args.approvalStatus!));
    }
    if (args.priority) {
      countQuery = countQuery.filter(q => q.eq(q.field("priority"), args.priority!));
    }
    if (args.convertedToBooking !== undefined) {
      countQuery = countQuery.filter(q => q.eq(q.field("convertedToBooking"), args.convertedToBooking));
    }
    if (args.validUntil) {
      countQuery = countQuery.filter(q => q.gte(q.field("validUntil"), args.validUntil!));
    }
    if (args.searchTerm) {
      countQuery = countQuery.withSearchIndex("by_title_description", q =>
        q.search("title", args.searchTerm!)
      );
    }
    
    countQuery = countQuery.filter(q => q.eq(q.field("isActive"), true));
    const total = (await countQuery.collect()).length;

    return {
      proposals: paginatedProposals.page,
      total,
      hasMore: paginatedProposals.isDone,
      cursor: paginatedProposals.continueCursor,
    };
  },
});

/**
 * Get proposals for a specific package request
 */
export const getProposalsForRequest = query({
  args: {
    packageRequestId: v.id("packageRequests"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get the package request
    const packageRequest = await ctx.db.get(args.packageRequestId);
    if (!packageRequest) {
      throw new Error("Solicitação de pacote não encontrada");
    }

    // Check permissions
    if (currentUserRole === "traveler") {
      // For travelers, check both userId (if exists) and email match
      const hasAccess = await checkTravelerAccessToPackageRequest(ctx, packageRequest, currentUserId);
      
      if (!hasAccess) {
        throw new Error("Acesso negado");
      }
    }

    if (currentUserRole === "partner" || currentUserRole === "employee") {
      if (packageRequest.partnerId !== currentUserId) {
        throw new Error("Acesso negado");
      }
    }

    // Get proposals for this request
    const proposals = await ctx.db
      .query("packageProposals")
      .withIndex("by_package_request", (q) => 
        q.eq("packageRequestId", args.packageRequestId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return proposals.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get proposal statistics for admin dashboard
 */
export const getProposalStatistics = query({
  args: {
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  returns: v.object({
    total: v.number(),
    byStatus: v.any(),
    byPriority: v.any(),
    conversionRate: v.number(),
    averageValue: v.number(),
    totalValue: v.number(),
    pending: v.number(),
    sent: v.number(),
    accepted: v.number(),
    rejected: v.number(),
    expired: v.number(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only admins can view statistics
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    // Calculate time range
    const timeRange = args.timeRange || "30d";
    const now = Date.now();
    let startTime = 0;
    
    switch (timeRange) {
      case "7d":
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startTime = now - (90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startTime = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }

    let query;
    if (currentUserRole === "master" && args.partnerId) {
      query = ctx.db
        .query("packageProposals")
        .withIndex("by_partner", q => q.eq("partnerId", args.partnerId!));
    } else if (currentUserRole === "partner" || currentUserRole === "employee") {
      const partnerId = args.partnerId || currentUserId;
      query = ctx.db
        .query("packageProposals")
        .withIndex("by_partner", q => q.eq("partnerId", partnerId));
    } else {
      query = ctx.db.query("packageProposals");
    }

    // Filter by time range and active status
    const proposals = await query
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gte(q.field("createdAt"), startTime)
        )
      )
      .collect();

    // Calculate statistics
    const total = proposals.length;
    
    const byStatus = proposals.reduce((acc, proposal) => {
      acc[proposal.status] = (acc[proposal.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = proposals.reduce((acc, proposal) => {
      acc[proposal.priority] = (acc[proposal.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const convertedProposals = proposals.filter(p => p.convertedToBooking);
    const conversionRate = total > 0 ? (convertedProposals.length / total) * 100 : 0;

    const totalValue = proposals.reduce((sum, proposal) => sum + proposal.totalPrice, 0);
    const averageValue = total > 0 ? totalValue / total : 0;

    const pending = byStatus.draft + byStatus.review || 0;
    const sent = byStatus.sent + byStatus.viewed + byStatus.under_negotiation || 0;
    const accepted = byStatus.accepted || 0;
    const rejected = byStatus.rejected || 0;
    const expired = byStatus.expired || 0;

    return {
      total,
      byStatus,
      byPriority,
      conversionRate,
      averageValue,
      totalValue,
      pending,
      sent,
      accepted,
      rejected,
      expired,
    };
  },
});

/**
 * Get pending proposals requiring approval
 */
export const getPendingApprovals = query({
  args: {
    partnerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only admins can view pending approvals
    if (!["master", "partner"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    const limit = args.limit || 10;

    let query = ctx.db
      .query("packageProposals")
      .withIndex("by_approval_status", q => q.eq("approvalStatus", "pending"));

    // Apply role-based filtering
    if (currentUserRole === "partner") {
      const partnerId = args.partnerId || currentUserId;
      query = query.filter(q => q.eq(q.field("partnerId"), partnerId));
    } else if (args.partnerId) {
      query = query.filter(q => q.eq(q.field("partnerId"), args.partnerId!));
    }

    const pendingProposals = await query
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .take(limit);

    return pendingProposals;
  },
});

/**
 * Get proposal templates (for quick proposal creation)
 */
export const getProposalTemplates = query({
  args: {
    category: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only admins can view templates
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    let query;

    // Base query with permissions
    if (currentUserRole === "master") {
      query = ctx.db.query("packageProposalTemplates");
    } else {
      // Non-masters can only see public templates or their own templates
      query = ctx.db
        .query("packageProposalTemplates")
        .filter(q => 
          q.or(
            q.eq(q.field("isPublic"), true),
            q.eq(q.field("partnerId"), currentUserId)
          )
        );
    }

    // Apply filters
    if (args.category) {
      query = query.filter(q => q.eq(q.field("category"), args.category));
    }
    if (args.partnerId && currentUserRole === "master") {
      query = query.filter(q => q.eq(q.field("partnerId"), args.partnerId));
    }
    if (args.isActive !== undefined) {
      query = query.filter(q => q.eq(q.field("isActive"), args.isActive));
    } else {
      // Default to only active templates
      query = query.filter(q => q.eq(q.field("isActive"), true));
    }

    return await query
      .order("desc")
      .take(50); // Limit for performance
  },
});

/**
 * Search proposals by title or content
 */
export const searchProposals = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only admins can search proposals
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    const limit = args.limit || 20;

    let query = ctx.db
      .query("packageProposals")
      .withSearchIndex("by_title_description", q => q.search("title", args.searchTerm));

    // Apply role-based filtering
    if (currentUserRole === "partner" || currentUserRole === "employee") {
      query = query.filter(q =>
        q.or(
          q.eq(q.field("adminId"), currentUserId),
          q.eq(q.field("partnerId"), currentUserId)
        )
      );
    }
    
    const proposals = await query
      .filter(q => q.eq(q.field("isActive"), true))
      .take(limit);

    return proposals;
  },
});

/**
 * Get proposal activity feed (for timeline view)
 */
export const getProposalActivity = query({
  args: {
    proposalId: v.id("packageProposals"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Get the proposal to check permissions
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || !proposal.isActive) {
      throw new Error("Proposta não encontrada");
    }

    // Check permissions (same as getPackageProposal)
    if (currentUserRole !== "master") {
      if (currentUserRole === "partner" || currentUserRole === "employee") {
        if (proposal.adminId !== currentUserId && proposal.partnerId !== currentUserId) {
          throw new Error("Acesso negado");
        }
      } else if (currentUserRole === "traveler") {
        const packageRequest = await ctx.db.get(proposal.packageRequestId);
        if (!packageRequest) {
          throw new Error("Acesso negado");
        }
        
        const hasAccess = await checkTravelerAccessToPackageRequest(ctx, packageRequest, currentUserId);
        
        if (!hasAccess) {
          throw new Error("Acesso negado");
        }
      }
    }

    // Get audit logs for this proposal
    const auditLogs = await ctx.db
      .query("auditLogs")
      .filter((q) => 
        q.and(
          q.eq(q.field("resource.type"), "package_proposal"),
          q.eq(q.field("resource.id"), args.proposalId.toString())
        )
      )
      .order("desc")
      .take(50);

    return auditLogs.map(log => ({
      id: log._id,
      timestamp: log.timestamp,
      action: log.event.action,
      actor: log.actor,
      eventType: log.event.type,
      metadata: log.metadata,
    }));
  },
});

/**
 * Internal query to get proposal by ID (for actions and mutations)
 */
export const internalGetProposal = internalQuery({
  args: {
    id: v.id("packageProposals"),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get proposal stats - alias for getProposalStatistics
 */
export const getProposalStats = query({
  args: {
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  returns: v.object({
    total: v.number(),
    byStatus: v.any(),
    byPriority: v.any(),
    conversionRate: v.number(),
    averageValue: v.number(),
    totalValue: v.number(),
    pending: v.number(),
    sent: v.number(),
    accepted: v.number(),
    rejected: v.number(),
    expired: v.number(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only admins can view statistics
    if (!["master", "partner", "employee"].includes(currentUserRole)) {
      throw new Error("Permissões insuficientes");
    }

    // Calculate time range
    const timeRange = args.timeRange || "30d";
    const now = Date.now();
    let startTime = 0;
    
    switch (timeRange) {
      case "7d":
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startTime = now - (90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startTime = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }

    let query;
    if (currentUserRole === "master" && args.partnerId) {
      query = ctx.db
        .query("packageProposals")
        .withIndex("by_partner", q => q.eq("partnerId", args.partnerId!));
    } else if (currentUserRole === "partner" || currentUserRole === "employee") {
      const partnerId = args.partnerId || currentUserId;
      query = ctx.db
        .query("packageProposals")
        .withIndex("by_partner", q => q.eq("partnerId", partnerId));
    } else {
      query = ctx.db.query("packageProposals");
    }

    // Filter by time range and active status
    const proposals = await query
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.gte(q.field("createdAt"), startTime)
        )
      )
      .collect();

    // Calculate statistics
    const total = proposals.length;
    
    const byStatus = proposals.reduce((acc, proposal) => {
      acc[proposal.status] = (acc[proposal.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = proposals.reduce((acc, proposal) => {
      acc[proposal.priority] = (acc[proposal.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const convertedProposals = proposals.filter(p => p.convertedToBooking);
    const conversionRate = total > 0 ? (convertedProposals.length / total) * 100 : 0;

    const totalValue = proposals.reduce((sum, proposal) => sum + proposal.totalPrice, 0);
    const averageValue = total > 0 ? totalValue / total : 0;

    const pending = (byStatus.draft || 0) + (byStatus.review || 0);
    const sent = (byStatus.sent || 0) + (byStatus.viewed || 0) + (byStatus.under_negotiation || 0);
    const accepted = byStatus.accepted || 0;
    const rejected = byStatus.rejected || 0;
    const expired = byStatus.expired || 0;

    return {
      total,
      byStatus,
      byPriority,
      conversionRate,
      averageValue,
      totalValue,
      pending,
      sent,
      accepted,
      rejected,
      expired,
    };
  },
});

