import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Action interna para limpar cache expirado de recomendações
 */
export const cleanExpiredRecommendationsCache = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      console.log('🧹 Iniciando limpeza de cache expirado...');
      
      const result = await ctx.runMutation(internal.domains.recommendations.cleanExpiredCache, {});
      
      console.log(`✅ Limpeza concluída: ${result.deletedCount} caches expirados removidos`);
      
      // Log apenas se houve cache removido
      if (result.deletedCount > 0) {
        console.log(`📊 Estatística: ${result.deletedCount} entradas de cache antigas foram removidas`);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro durante limpeza de cache:', error);
      throw error;
    }
  },
});

const crons = cronJobs();

// Limpar cache expirado a cada 6 horas
crons.interval(
  "clean expired recommendations cache",
  { hours: 6 },
  internal.crons.cleanExpiredRecommendationsCache,
  {}
);

export default crons; 