import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getCurrentUserConvexId } from "../rbac/utils";

/**
 * Gera hash das preferências do usuário (mesmo algoritmo das mutations)
 */
function generatePreferencesHash(preferences: any): string {
  const normalized = {
    personalityProfile: preferences.personalityProfile || {},
    interests: (preferences.interests || []).sort(),
    moodTags: (preferences.moodTags || []).sort(),
    experienceGoals: (preferences.experienceGoals || []).sort(),
    budget: preferences.budget || 0,
    tripDuration: preferences.tripDuration || "",
    companions: preferences.companions || "",
  };
  
  // Usar btoa em vez de Buffer para base64 (compatível com Convex)
  const jsonString = JSON.stringify(normalized);
  return btoa(jsonString);
}


/**
 * Verifica estatísticas do cache do usuário
 */
export const getCacheStats = query({
  args: {},
  returns: v.object({
    totalCacheEntries: v.number(),
    cacheByCategory: v.array(v.object({
      category: v.union(v.string(), v.null()),
      count: v.number(),
      oldestCache: v.number(),
      newestCache: v.number(),
    })),
    expiredCaches: v.number(),
    totalCacheSize: v.number(), // Estimativa baseada no número de recomendações
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return {
        totalCacheEntries: 0,
        cacheByCategory: [],
        expiredCaches: 0,
        totalCacheSize: 0,
      };
    }

    try {
      const now = Date.now();

      // Buscar todos os caches do usuário
      const allCaches = await ctx.db
        .query("cachedRecommendations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      // Agrupar por categoria e calcular estatísticas
      const cacheByCategory: { [key: string]: any[] } = {};
      let expiredCount = 0;
      let totalRecommendations = 0;

      for (const cache of allCaches) {
        const categoryKey = cache.category || "all";
        
        if (!cacheByCategory[categoryKey]) {
          cacheByCategory[categoryKey] = [];
        }
        cacheByCategory[categoryKey].push(cache);

        if (cache.expiresAt <= now) {
          expiredCount++;
        }

        totalRecommendations += cache.recommendations.length;
      }

      // Transformar agrupamento em array de estatísticas
      const categoryStats = Object.entries(cacheByCategory).map(([category, caches]) => {
        const creationTimes = caches.map(c => c._creationTime);
        return {
          category: category === "all" ? null : category,
          count: caches.length,
          oldestCache: Math.min(...creationTimes),
          newestCache: Math.max(...creationTimes),
        };
      });

      return {
        totalCacheEntries: allCaches.length,
        cacheByCategory: categoryStats,
        expiredCaches: expiredCount,
        totalCacheSize: totalRecommendations,
      };

    } catch (error) {
      console.error("Erro ao calcular estatísticas de cache:", error);
      return {
        totalCacheEntries: 0,
        cacheByCategory: [],
        expiredCaches: 0,
        totalCacheSize: 0,
      };
    }
  },
});

/**
 * Lista todas as entradas de cache do usuário (para debug)
 */
export const listUserCaches = query({
  args: {
    includeExpired: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.id("cachedRecommendations"),
    category: v.optional(v.string()),
    preferencesHash: v.string(),
    recommendationsCount: v.number(),
    personalizedMessage: v.string(),
    isUsingAI: v.boolean(),
    confidenceScore: v.optional(v.number()),
    cacheVersion: v.string(),
    expiresAt: v.number(),
    _creationTime: v.number(),
    isExpired: v.boolean(),
    cacheAge: v.number(), // em minutos
    timeUntilExpiry: v.number(), // em minutos (negativo se expirado)
  })),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return [];
    }

    try {
      const now = Date.now();

      // Buscar caches do usuário
      let caches = await ctx.db
        .query("cachedRecommendations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      // Filtrar expirados se necessário
      if (!args.includeExpired) {
        caches = caches.filter(cache => cache.expiresAt > now);
      }

      // Transformar em formato de resposta
      return caches.map(cache => {
        const cacheAge = Math.floor((now - cache._creationTime) / (1000 * 60));
        const timeUntilExpiry = Math.floor((cache.expiresAt - now) / (1000 * 60));
        
        return {
          _id: cache._id,
          category: cache.category,
          preferencesHash: cache.preferencesHash,
          recommendationsCount: cache.recommendations.length,
          personalizedMessage: cache.personalizedMessage,
          isUsingAI: cache.isUsingAI,
          confidenceScore: cache.confidenceScore,
          cacheVersion: cache.cacheVersion,
          expiresAt: cache.expiresAt,
          _creationTime: cache._creationTime,
          isExpired: cache.expiresAt <= now,
          cacheAge,
          timeUntilExpiry,
        };
      }).sort((a, b) => b._creationTime - a._creationTime); // Ordenar por mais recente

    } catch (error) {
      console.error("Erro ao listar caches do usuário:", error);
      return [];
    }
  },
});

/**
 * Obtém informações detalhadas sobre limites de cache e uso atual
 */
export const getCacheLimitStats = query({
  args: {},
  returns: v.object({
    limits: v.object({
      maxEntriesPerUser: v.number(),
      maxEntriesPerCategory: v.number(),
      defaultTtlHours: v.number(),
    }),
    currentUsage: v.object({
      totalEntries: v.number(),
      usagePercentage: v.number(),
      categoryCounts: v.array(v.object({
        category: v.union(v.string(), v.null()),
        count: v.number(),
        percentage: v.number(),
        nearLimit: v.boolean(),
      })),
    }),
    warnings: v.array(v.string()),
    recommendations: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return {
        limits: {
          maxEntriesPerUser: 50,
          maxEntriesPerCategory: 20,
          defaultTtlHours: 24,
        },
        currentUsage: {
          totalEntries: 0,
          usagePercentage: 0,
          categoryCounts: [],
        },
        warnings: [],
        recommendations: [],
      };
    }

    try {
      const now = Date.now();
      
      // Configurações (sincronizar com mutations.ts)
      const MAX_ENTRIES_PER_USER = 50;
      const MAX_ENTRIES_PER_CATEGORY = 20;
      const DEFAULT_TTL_HOURS = 24;

      // Buscar todos os caches do usuário (incluindo expirados para estatísticas completas)
      const allCaches = await ctx.db
        .query("cachedRecommendations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      const activeCaches = allCaches.filter(cache => cache.expiresAt > now);

      // Agrupar por categoria
      const categoryGroups: { [key: string]: any[] } = {};
      for (const cache of activeCaches) {
        const categoryKey = cache.category || "general";
        if (!categoryGroups[categoryKey]) {
          categoryGroups[categoryKey] = [];
        }
        categoryGroups[categoryKey].push(cache);
      }

      // Calcular estatísticas por categoria
      const categoryCounts = Object.entries(categoryGroups).map(([category, caches]) => {
        const count = caches.length;
        const percentage = Math.round((count / MAX_ENTRIES_PER_CATEGORY) * 100);
        const nearLimit = count >= MAX_ENTRIES_PER_CATEGORY * 0.8; // 80% do limite

        return {
          category: category === "general" ? null : category,
          count,
          percentage,
          nearLimit,
        };
      });

      // Gerar avisos e recomendações
      const warnings: string[] = [];
      const recommendations: string[] = [];

      const totalEntries = activeCaches.length;
      const usagePercentage = Math.round((totalEntries / MAX_ENTRIES_PER_USER) * 100);

      if (usagePercentage >= 90) {
        warnings.push("Você está usando mais de 90% do limite de cache. Novas entradas podem causar remoção automática de caches antigos.");
      } else if (usagePercentage >= 75) {
        warnings.push("Você está se aproximando do limite de cache (75% usado).");
      }

      // Verificar categorias próximas do limite
      for (const categoryCount of categoryCounts) {
        if (categoryCount.nearLimit) {
          const categoryName = categoryCount.category || "categoria geral";
          warnings.push(`A ${categoryName} está próxima do limite (${categoryCount.count}/${MAX_ENTRIES_PER_CATEGORY} entradas).`);
        }
      }

      // Gerar recomendações
      if (usagePercentage > 50) {
        recommendations.push("Considere invalidar caches antigos ou desnecessários para otimizar o uso.");
      }

      const expiredCount = allCaches.length - activeCaches.length;
      if (expiredCount > 0) {
        recommendations.push(`Você tem ${expiredCount} caches expirados que serão limpos automaticamente.`);
      }

      if (categoryCounts.length > 5) {
        recommendations.push("Considere consolidar algumas categorias para melhor organização do cache.");
      }

      return {
        limits: {
          maxEntriesPerUser: MAX_ENTRIES_PER_USER,
          maxEntriesPerCategory: MAX_ENTRIES_PER_CATEGORY,
          defaultTtlHours: DEFAULT_TTL_HOURS,
        },
        currentUsage: {
          totalEntries,
          usagePercentage,
          categoryCounts,
        },
        warnings,
        recommendations,
      };

    } catch (error) {
      console.error("Erro ao calcular estatísticas de limite de cache:", error);
      return {
        limits: {
          maxEntriesPerUser: 50,
          maxEntriesPerCategory: 20,
          defaultTtlHours: 24,
        },
        currentUsage: {
          totalEntries: 0,
          usagePercentage: 0,
          categoryCounts: [],
        },
        warnings: ["Erro ao carregar estatísticas de cache"],
        recommendations: [],
      };
    }
  },
}); 