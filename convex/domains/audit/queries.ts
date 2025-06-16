import { v } from "convex/values";
import { query } from "../../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";
import type { Id } from "../../_generated/dataModel";
import type { AuditLogStats, AuditLogFilters } from "./types";
import { auditLogValidators } from "./types";

/**
 * Get audit logs with RBAC filtering and pagination
 */
export const getAuditLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    searchTerm: v.optional(v.string()),
    eventType: v.optional(v.string()),
    userRole: v.optional(v.string()),
    timeRange: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    stats: v.object({
      total: v.number(),
      errors: v.number(),
      warnings: v.number(),
      today: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only masters and partners can view audit logs
    if (currentUserRole !== "master" && currentUserRole !== "partner") {
      throw new Error("Acesso negado aos logs de auditoria");
    }

    // Start with indexed query ordered by timestamp
    let query = ctx.db.query("auditLogs").withIndex("by_timestamp").order("desc");

    // Apply RBAC filtering
    if (currentUserRole === "partner") {
      // Partners can only see logs related to their resources or their own actions
      query = query.filter(q => 
        q.or(
          q.eq(q.field("actor.userId"), currentUserId),
          q.eq(q.field("resource.partnerId"), currentUserId)
        )
      );
    }

    // Apply time range filter
    if (args.timeRange) {
      const now = Date.now();
      let startTime: number;
      
      switch (args.timeRange) {
        case "1h":
          startTime = now - (1 * 60 * 60 * 1000);
          break;
        case "24h":
          startTime = now - (24 * 60 * 60 * 1000);
          break;
        case "7d":
          startTime = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startTime = now - (30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = now - (24 * 60 * 60 * 1000);
      }
      
      query = query.filter(q => q.gte(q.field("timestamp"), startTime));
    }

    // Apply additional filters
    if (args.eventType && args.eventType !== "all") {
      query = query.filter(q => q.eq(q.field("event.type"), args.eventType));
    }

    if (args.userRole && args.userRole !== "all") {
      query = query.filter(q => q.eq(q.field("actor.role"), args.userRole));
    }

    // Apply search term
    if (args.searchTerm) {
      const searchTerm = args.searchTerm.toLowerCase();
      query = query.filter(q => 
        q.or(
          q.eq(q.field("event.action"), searchTerm),
          q.eq(q.field("actor.name"), searchTerm)
        )
      );
    }

    // Get paginated results
    const result = await query.paginate(args.paginationOpts);

    // Calculate stats
    const allLogs = await ctx.db.query("auditLogs").collect();
    const today = Date.now() - (24 * 60 * 60 * 1000);
    
    const stats = {
      total: allLogs.length,
      errors: allLogs.filter(log => log.status === "failure").length,
      warnings: allLogs.filter(log => log.event.severity === "medium" || log.event.severity === "high").length,
      today: allLogs.filter(log => log.timestamp > today).length,
    };

    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      stats,
    };
  },
});

/**
 * Get audit log statistics for dashboard
 */
export const getAuditLogStats = query({
  args: {
    timeRange: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    errors: v.number(),
    warnings: v.number(),
    criticalEvents: v.number(),
    todayCount: v.number(),
    byEventType: v.record(v.string(), v.number()),
    byCategory: v.record(v.string(), v.number()),
    recentActivity: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    if (currentUserRole !== "master" && currentUserRole !== "partner") {
      throw new Error("Acesso negado às estatísticas");
    }

    // Get logs based on time range
    const timeRange = args.timeRange || "24h";
    const now = Date.now();
    let startTime: number;

    switch (timeRange) {
      case "1h":
        startTime = now - (1 * 60 * 60 * 1000);
        break;
      case "24h":
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now - (24 * 60 * 60 * 1000);
    }

    let logs = await ctx.db
      .query("auditLogs")
      .filter(q => q.gte(q.field("timestamp"), startTime))
      .collect();

    // Apply RBAC filtering
    if (currentUserRole === "partner") {
      logs = logs.filter(log => 
        log.actor.userId === currentUserId ||
        log.resource?.partnerId === currentUserId
      );
    }

    // Calculate statistics
    const stats = {
      total: logs.length,
      errors: logs.filter(log => log.status === "failure").length,
      warnings: logs.filter(log => log.event.severity === "medium" || log.event.severity === "high").length,
      criticalEvents: logs.filter(log => log.event.severity === "critical").length,
      todayCount: logs.filter(log => log.timestamp > (now - 24 * 60 * 60 * 1000)).length,
      byEventType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      recentActivity: logs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map(log => ({
          _id: log._id,
          timestamp: log.timestamp,
          action: log.event.action,
          actor: log.actor.name,
          severity: log.event.severity,
          status: log.status,
        })),
    };

    // Count by event type
    logs.forEach(log => {
      stats.byEventType[log.event.type] = (stats.byEventType[log.event.type] || 0) + 1;
    });

    // Count by category
    logs.forEach(log => {
      stats.byCategory[log.event.category] = (stats.byCategory[log.event.category] || 0) + 1;
    });

    return stats;
  },
});

/**
 * Get a specific audit log by ID
 */
export const getAuditLogById = query({
  args: {
    auditLogId: v.id("auditLogs"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    if (currentUserRole !== "master" && currentUserRole !== "partner") {
      throw new Error("Acesso negado");
    }

    const auditLog = await ctx.db.get(args.auditLogId);
    if (!auditLog) {
      return null;
    }

    // RBAC check
    if (currentUserRole === "partner") {
      const canAccess = 
        auditLog.actor.userId === currentUserId ||
        auditLog.resource?.partnerId === currentUserId;

      if (!canAccess) {
        throw new Error("Acesso negado a este log");
      }
    }

    return auditLog;
  },
});

/**
 * Get audit logs for a specific resource (with RBAC)
 */
export const getAuditLogsForResource = query({
  args: {
    resourceType: v.string(),
    resourceId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    if (currentUserRole !== "master" && currentUserRole !== "partner") {
      throw new Error("Acesso negado aos logs do recurso");
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_resource", q => 
        q.eq("resource.type", args.resourceType).eq("resource.id", args.resourceId)
      )
      .order("desc")
      .take(args.limit || 50);

    // RBAC filtering
    if (currentUserRole === "partner") {
      return logs.filter(log => 
        log.actor.userId === currentUserId ||
        log.resource?.partnerId === currentUserId
      );
    }

    return logs;
  },
});

/**
 * Get audit logs for current user's activities
 */
export const getMyAuditLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    eventType: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_actor_timestamp", q => q.eq("actor.userId", currentUserId))
      .order("desc");

    // Filter by event type if provided
    if (args.eventType) {
      query = query.filter(q => q.eq(q.field("event.type"), args.eventType));
    }

    return await query.paginate(args.paginationOpts);
  },
});

/**
 * Search audit logs with advanced filters
 */
export const searchAuditLogs = query({
  args: {
    searchTerm: v.string(),
    filters: v.optional(auditLogValidators.filters),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    if (currentUserRole !== "master" && currentUserRole !== "partner") {
      throw new Error("Acesso negado à pesquisa de logs");
    }

    // Apply search and filters
    const searchTerm = args.searchTerm.toLowerCase();
    let logs: any[];

    // Apply RBAC - different query strategies
    if (currentUserRole === "partner") {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_partner", q => 
          q.eq("resource.partnerId", currentUserId)
        )
        .collect();
    } else {
      logs = await ctx.db.query("auditLogs").collect();
    }

    // Filter by search term and additional filters
    let filteredLogs = logs.filter(log => 
      log.event.action.toLowerCase().includes(searchTerm) ||
      log.actor.name.toLowerCase().includes(searchTerm) ||
      log.resource?.name?.toLowerCase().includes(searchTerm) ||
      log.source.ipAddress.includes(searchTerm)
    );

    // Apply additional filters
    if (args.filters) {
      const filters = args.filters;

      if (filters.eventType) {
        filteredLogs = filteredLogs.filter(log => log.event.type === filters.eventType);
      }
      if (filters.eventCategory) {
        filteredLogs = filteredLogs.filter(log => log.event.category === filters.eventCategory);
      }
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.event.severity === filters.severity);
      }
      if (filters.status) {
        filteredLogs = filteredLogs.filter(log => log.status === filters.status);
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    // Sort by timestamp descending and limit
    return filteredLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, args.limit || 100);
  },
});

/**
 * Get audit log summary for compliance reports
 */
export const getAuditLogSummary = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    includePersonalData: v.optional(v.boolean()),
  },
  returns: v.object({
    totalEvents: v.number(),
    eventsByCategory: v.record(v.string(), v.number()),
    eventsBySeverity: v.record(v.string(), v.number()),
    personalDataEvents: v.number(),
    complianceMetrics: v.object({
      authenticationEvents: v.number(),
      authorizationEvents: v.number(),
      dataModificationEvents: v.number(),
      systemAdminEvents: v.number(),
    }),
    riskMetrics: v.object({
      highRiskEvents: v.number(),
      criticalEvents: v.number(),
      failedOperations: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only masters can generate compliance reports
    if (currentUserRole !== "master") {
      throw new Error("Acesso negado aos relatórios de compliance");
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", q => 
        q.gte("timestamp", args.startDate).lte("timestamp", args.endDate)
      )
      .collect();

    const summary = {
      totalEvents: logs.length,
      eventsByCategory: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      personalDataEvents: logs.filter(log => log.compliance?.isPersonalData).length,
      complianceMetrics: {
        authenticationEvents: logs.filter(log => log.event.category === "authentication").length,
        authorizationEvents: logs.filter(log => log.event.category === "authorization").length,
        dataModificationEvents: logs.filter(log => log.event.category === "data_modification").length,
        systemAdminEvents: logs.filter(log => log.event.category === "system_admin").length,
      },
      riskMetrics: {
        highRiskEvents: logs.filter(log => log.event.severity === "high").length,
        criticalEvents: logs.filter(log => log.event.severity === "critical").length,
        failedOperations: logs.filter(log => log.status === "failure").length,
      },
    };

    // Count by category
    logs.forEach(log => {
      summary.eventsByCategory[log.event.category] = 
        (summary.eventsByCategory[log.event.category] || 0) + 1;
    });

    // Count by severity
    logs.forEach(log => {
      summary.eventsBySeverity[log.event.severity] = 
        (summary.eventsBySeverity[log.event.severity] || 0) + 1;
    });

    return summary;
  },
}); 