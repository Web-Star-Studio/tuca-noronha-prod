import { cronJobs } from "convex/server";
import { internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Internal action to clean expired audit logs automatically
 */
export const cleanExpiredAuditLogsAction = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      console.log('🧹 Iniciando limpeza automática de logs de auditoria expirados...');
      
      const result = await ctx.runMutation(internal.domains.audit.mutations.cleanExpiredAuditLogs, {
        dryRun: false,
        maxToDelete: 500, // Limit to avoid performance issues
      });
      
      if (result.deletedCount > 0) {
        console.log(`✅ Limpeza de audit logs concluída: ${result.deletedCount} logs expirados removidos`);
        
        // Log to audit system about the cleanup
        await ctx.runMutation(internal.domains.audit.mutations.internalCreateAuditLog, {
          actorId: "system" as any, // System action
          actorRole: "system",
          actorName: "Sistema Automático",
          eventType: "system_config_change",
          action: `Limpeza automática de logs: ${result.deletedCount} logs expirados removidos`,
          category: "system_admin",
          severity: "medium",
          ipAddress: "127.0.0.1",
          platform: "system",
          status: "success",
          metadata: {
            automated: true,
            deletedCount: result.deletedCount,
            cleanupType: "expired_logs",
          },
        });
      } else {
        console.log('ℹ️ Nenhum log expirado encontrado para remoção');
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro durante limpeza automática de audit logs:', error);
      
      // Log the error to audit system
      try {
        await ctx.runMutation(internal.domains.audit.mutations.internalCreateAuditLog, {
          actorId: "system" as any,
          actorRole: "system", 
          actorName: "Sistema Automático",
          eventType: "system_config_change",
          action: "Falha na limpeza automática de logs",
          category: "system_admin",
          severity: "high",
          ipAddress: "127.0.0.1",
          platform: "system",
          status: "failure",
          metadata: {
            automated: true,
            error: error instanceof Error ? error.message : String(error),
            cleanupType: "expired_logs",
          },
        });
      } catch (logError) {
        console.error('Failed to log cleanup error:', logError);
      }
      
      throw error;
    }
  },
});

/**
 * Internal action for audit log health checks and statistics
 */
export const auditLogHealthCheck = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      console.log('🔍 Executando verificação de saúde dos logs de auditoria...');
      
      // Get audit log statistics
      const stats = await ctx.runQuery(internal.domains.audit.queries.getAuditLogStats, {
        timeRange: "24h",
      });
      
      const healthMetrics = {
        totalLogs: stats.total,
        errorRate: stats.total > 0 ? (stats.errors / stats.total) * 100 : 0,
        criticalEvents: stats.criticalEvents,
        todayLogs: stats.todayCount,
      };
      
      // Log health metrics
      console.log(`📊 Métricas de saúde dos logs:`, healthMetrics);
      
      // Alert if error rate is too high
      if (healthMetrics.errorRate > 10) {
        console.warn(`⚠️ Taxa de erro alta detectada: ${healthMetrics.errorRate.toFixed(2)}%`);
        
        await ctx.runMutation(internal.domains.audit.mutations.internalCreateAuditLog, {
          actorId: "system" as any,
          actorRole: "system",
          actorName: "Sistema de Monitoramento",
          eventType: "system_config_change",
          action: `Taxa de erro alta detectada nos logs: ${healthMetrics.errorRate.toFixed(2)}%`,
          category: "security",
          severity: "high",
          ipAddress: "127.0.0.1",
          platform: "system",
          status: "success",
          metadata: {
            automated: true,
            healthCheck: true,
            ...healthMetrics,
          },
        });
      }
      
      // Alert if too many critical events
      if (healthMetrics.criticalEvents > 5) {
        console.warn(`🚨 Muitos eventos críticos detectados: ${healthMetrics.criticalEvents}`);
        
        await ctx.runMutation(internal.domains.audit.mutations.internalCreateAuditLog, {
          actorId: "system" as any,
          actorRole: "system",
          actorName: "Sistema de Monitoramento",
          eventType: "system_config_change",
          action: `Número alto de eventos críticos detectado: ${healthMetrics.criticalEvents}`,
          category: "security",
          severity: "critical",
          ipAddress: "127.0.0.1",
          platform: "system",
          status: "success",
          metadata: {
            automated: true,
            healthCheck: true,
            ...healthMetrics,
          },
        });
      }
      
      console.log('✅ Verificação de saúde dos logs concluída');
      return null;
    } catch (error) {
      console.error('❌ Erro durante verificação de saúde dos logs:', error);
      throw error;
    }
  },
});

/**
 * Internal action for archiving old audit logs
 */
export const archiveOldAuditLogsAction = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      console.log('📦 Iniciando arquivamento de logs antigos...');
      
      const result = await ctx.runMutation(internal.domains.audit.mutations.archiveOldAuditLogs, {
        olderThanDays: 365, // Archive logs older than 1 year
        dryRun: false,
      });
      
      if (result.archivedCount > 0) {
        console.log(`✅ Arquivamento concluído: ${result.archivedCount} logs arquivados`);
      } else {
        console.log('ℹ️ Nenhum log antigo encontrado para arquivamento');
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro durante arquivamento de logs:', error);
      throw error;
    }
  },
});

// Configure cron jobs
const crons = cronJobs();

// Clean expired audit logs daily at 2 AM
crons.cron(
  "Clean expired audit logs",
  "0 2 * * *", // Daily at 2:00 AM
  internal.domains.audit.cron.cleanExpiredAuditLogsAction,
  {}
);

// Health check every 4 hours
crons.cron(
  "Audit log health check", 
  "0 */4 * * *", // Every 4 hours
  internal.domains.audit.cron.auditLogHealthCheck,
  {}
);

// Archive old logs weekly on Sunday at 3 AM
crons.cron(
  "Archive old audit logs",
  "0 3 * * 0", // Weekly on Sunday at 3:00 AM
  internal.domains.audit.cron.archiveOldAuditLogsAction,
  {}
);

export default crons; 