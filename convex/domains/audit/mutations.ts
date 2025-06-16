import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac";
import { createAuditLog, logAssetOperation } from "./utils";
import type { Id } from "../../_generated/dataModel";

/**
 * Manually create an audit log entry (admin only)
 */
export const createManualAuditLog = mutation({
  args: {
    eventType: v.string(),
    action: v.string(),
    resourceType: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    resourceName: v.optional(v.string()),
    metadata: v.optional(v.any()),
    severity: v.optional(v.string()),
  },
  returns: v.id("auditLogs"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Only masters can create manual audit logs
    if (currentUserRole !== "master") {
      throw new Error("Apenas masters podem criar logs manuais");
    }

    return await createAuditLog(ctx, {
      event: {
        type: args.eventType as any,
        action: args.action,
        category: "system_admin",
        severity: (args.severity as any) || "medium",
      },
      resource: args.resourceType && args.resourceId ? {
        type: args.resourceType,
        id: args.resourceId,
        name: args.resourceName,
      } : undefined,
      metadata: {
        ...args.metadata,
        manualEntry: true,
        reason: "Entrada manual criada por administrador",
      },
      status: "success",
    });
  },
});

/**
 * Bulk delete audit logs (admin only)
 */
export const bulkDeleteAuditLogs = mutation({
  args: {
    logIds: v.array(v.id("auditLogs")),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    if (currentUserRole !== "master") {
      throw new Error("Apenas masters podem deletar logs em massa");
    }

    let deletedCount = 0;
    const errors: string[] = [];

    // Log the bulk deletion operation first
    await createAuditLog(ctx, {
      event: {
        type: "bulk_operation",
        action: `Exclusão em massa de ${args.logIds.length} logs de auditoria`,
        category: "system_admin",
        severity: "critical",
      },
      metadata: {
        logIds: args.logIds.map(id => id.toString()),
        reason: args.reason,
        requestedCount: args.logIds.length,
      },
      status: "pending",
    });

    // Delete each log
    for (const logId of args.logIds) {
      try {
        const log = await ctx.db.get(logId);
        if (log) {
          await ctx.db.delete(logId);
          deletedCount++;
        } else {
          errors.push(`Log ${logId} não encontrado`);
        }
      } catch (error) {
        errors.push(`Erro ao deletar log ${logId}: ${error}`);
      }
    }

    // Log the completion
    await createAuditLog(ctx, {
      event: {
        type: "bulk_operation",
        action: `Exclusão em massa concluída: ${deletedCount}/${args.logIds.length} logs deletados`,
        category: "system_admin",
        severity: "critical",
      },
      metadata: {
        deletedCount,
        totalRequested: args.logIds.length,
        errors,
        reason: args.reason,
      },
      status: errors.length === 0 ? "success" : "partial",
    });

    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    };
  },
});

/**
 * Clean expired audit logs based on retention policies
 */
export const cleanExpiredAuditLogs = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    maxToDelete: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    message: v.string(),
    expiredLogs: v.array(v.object({
      _id: v.id("auditLogs"),
      timestamp: v.number(),
      expiresAt: v.optional(v.number()),
      category: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    if (currentUserRole !== "master") {
      throw new Error("Apenas masters podem limpar logs expirados");
    }

    const now = Date.now();
    const isDryRun = args.dryRun || false;
    const maxToDelete = args.maxToDelete || 1000;

    // Find expired logs
    const expiredLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_expires", q => q.lt("expiresAt", now))
      .take(maxToDelete);

    if (isDryRun) {
      return {
        success: true,
        deletedCount: 0,
        message: `Simulação: ${expiredLogs.length} logs expirados seriam removidos`,
        expiredLogs: expiredLogs.map(log => ({
          _id: log._id,
          timestamp: log.timestamp,
          expiresAt: log.expiresAt,
          category: log.event.category,
        })),
      };
    }

    // Delete expired logs
    let deletedCount = 0;
    for (const log of expiredLogs) {
      try {
        await ctx.db.delete(log._id);
        deletedCount++;
      } catch (error) {
        console.error(`Erro ao deletar log expirado ${log._id}:`, error);
      }
    }

    // Log the cleanup operation
    await createAuditLog(ctx, {
      event: {
        type: "system_config_change",
        action: `Limpeza automática de logs expirados: ${deletedCount} logs removidos`,
        category: "system_admin",
        severity: "medium",
      },
      metadata: {
        deletedCount,
        totalExpired: expiredLogs.length,
        cleanupTimestamp: now,
      },
      status: "success",
    });

    return {
      success: true,
      deletedCount,
      message: `${deletedCount} logs expirados foram removidos`,
      expiredLogs: expiredLogs.slice(0, 10).map(log => ({
        _id: log._id,
        timestamp: log.timestamp,
        expiresAt: log.expiresAt,
        category: log.event.category,
      })),
    };
  },
});

/**
 * Update audit log retention policy (admin only)
 */
export const updateRetentionPolicy = mutation({
  args: {
    category: v.string(),
    severity: v.string(),
    retentionDays: v.number(),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    if (currentUserRole !== "master") {
      throw new Error("Apenas masters podem alterar políticas de retenção");
    }

    // Validate retention period
    if (args.retentionDays < 30 || args.retentionDays > 2555) {
      throw new Error("Período de retenção deve estar entre 30 dias e 7 anos");
    }

    // Log the policy change
    await createAuditLog(ctx, {
      event: {
        type: "system_config_change",
        action: `Política de retenção alterada para ${args.category}/${args.severity}: ${args.retentionDays} dias`,
        category: "compliance",
        severity: "high",
      },
      metadata: {
        policyCategory: args.category,
        policySeverity: args.severity,
        newRetentionDays: args.retentionDays,
        reason: args.reason,
      },
      status: "success",
    });

    // In a real implementation, you would store this policy in a separate table
    // For now, we just log the change
    return {
      success: true,
      message: `Política de retenção atualizada para ${args.category}/${args.severity}`,
    };
  },
});

/**
 * Export audit logs (admin only)
 */
export const exportAuditLogs = mutation({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    format: v.union(v.literal("json"), v.literal("csv")),
    includeMetadata: v.optional(v.boolean()),
    categories: v.optional(v.array(v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    exportId: v.string(),
    recordCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    if (currentUserRole !== "master") {
      throw new Error("Apenas masters podem exportar logs");
    }

    // Get logs in the specified date range
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", q => 
        q.gte("timestamp", args.startDate).lte("timestamp", args.endDate)
      )
      .collect();

    // Filter by categories if specified
    let filteredLogs = logs;
    if (args.categories && args.categories.length > 0) {
      filteredLogs = logs.filter(log => 
        args.categories!.includes(log.event.category)
      );
    }

    // Generate export ID
    const exportId = `audit_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log the export operation
    await createAuditLog(ctx, {
      event: {
        type: "system_config_change",
        action: `Exportação de logs de auditoria: ${filteredLogs.length} registros`,
        category: "compliance",
        severity: "medium",
      },
      metadata: {
        exportId,
        format: args.format,
        startDate: args.startDate,
        endDate: args.endDate,
        recordCount: filteredLogs.length,
        includeMetadata: args.includeMetadata,
        categories: args.categories,
      },
      status: "success",
    });

    // In a real implementation, you would:
    // 1. Process the logs into the requested format
    // 2. Store the export file in cloud storage
    // 3. Return a download link or file ID

    return {
      success: true,
      exportId,
      recordCount: filteredLogs.length,
      message: `Exportação iniciada: ${filteredLogs.length} registros serão processados`,
    };
  },
});

/**
 * Internal mutation to create audit logs (used by other mutations)
 */
export const internalCreateAuditLog = internalMutation({
  args: {
    actorId: v.id("users"),
    actorRole: v.string(),
    actorName: v.string(),
    actorEmail: v.optional(v.string()),
    eventType: v.string(),
    action: v.string(),
    category: v.string(),
    severity: v.string(),
    resourceType: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    resourceName: v.optional(v.string()),
    resourcePartnerId: v.optional(v.id("users")),
    ipAddress: v.string(),
    userAgent: v.optional(v.string()),
    platform: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
  },
  returns: v.id("auditLogs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("auditLogs", {
      actor: {
        userId: args.actorId,
        role: args.actorRole as any,
        name: args.actorName,
        email: args.actorEmail,
      },
      event: {
        type: args.eventType as any,
        action: args.action,
        category: args.category as any,
        severity: args.severity as any,
      },
      resource: args.resourceType ? {
        type: args.resourceType,
        id: args.resourceId!,
        name: args.resourceName,
        partnerId: args.resourcePartnerId,
      } : undefined,
      source: {
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        platform: args.platform as any,
      },
      status: args.status as any,
      metadata: args.metadata,
      compliance: {
        regulations: ["LGPD", "ISO27001"],
        retentionPeriod: 180,
        isPersonalData: false,
      },
      timestamp: now,
      expiresAt: now + (180 * 24 * 60 * 60 * 1000), // 6 months
    });
  },
});

/**
 * Archive old audit logs instead of deleting them
 */
export const archiveOldAuditLogs = mutation({
  args: {
    olderThanDays: v.number(),
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    archivedCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    if (currentUserRole !== "master") {
      throw new Error("Apenas masters podem arquivar logs");
    }

    const cutoffDate = Date.now() - (args.olderThanDays * 24 * 60 * 60 * 1000);
    const isDryRun = args.dryRun || false;

    // Find old logs
    const oldLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp", q => q.lt("timestamp", cutoffDate))
      .collect();

    if (isDryRun) {
      return {
        success: true,
        archivedCount: 0,
        message: `Simulação: ${oldLogs.length} logs seriam arquivados`,
      };
    }

    // In a real implementation, you would:
    // 1. Export the logs to long-term storage
    // 2. Delete them from the main database
    // 3. Keep a reference in an archive table

    let archivedCount = 0;
    for (const log of oldLogs.slice(0, 100)) { // Limit to 100 for safety
      try {
        // Here you would export to archive storage
        // For now, we just mark them as archived in metadata
        await ctx.db.patch(log._id, {
          metadata: {
            ...log.metadata,
            archived: true,
            archivedAt: Date.now(),
          },
        });
        archivedCount++;
      } catch (error) {
        console.error(`Erro ao arquivar log ${log._id}:`, error);
      }
    }

    // Log the archival operation
    await createAuditLog(ctx, {
      event: {
        type: "system_config_change",
        action: `Arquivamento de logs antigos: ${archivedCount} logs arquivados`,
        category: "system_admin",
        severity: "medium",
      },
      metadata: {
        archivedCount,
        cutoffDate,
        olderThanDays: args.olderThanDays,
      },
      status: "success",
    });

    return {
      success: true,
      archivedCount,
      message: `${archivedCount} logs foram arquivados`,
    };
  },
}); 