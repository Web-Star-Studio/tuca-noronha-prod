import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { getCurrentUserConvexId } from "../rbac/utils";
import { Doc, Id } from "../../_generated/dataModel";

// Configurações de cache
const CACHE_CONFIG = {
  MAX_ENTRIES_PER_USER: 50, // Máximo de entradas de cache por usuário
  MAX_ENTRIES_PER_CATEGORY: 20, // Máximo de entradas por categoria por usuário
  DEFAULT_TTL_HOURS: 24, // TTL padrão em horas
} as const;

/**
 * Gera hash das preferências do usuário para identificar mudanças
 * e determinar se o cache precisa ser invalidado
 */
function generatePreferencesHash(preferences: any): string {
  // Normalizar preferências para garantir hash consistente
  const normalized = {
    personalityProfile: preferences.personalityProfile || {},
    interests: (preferences.interests || []).sort(),
    moodTags: (preferences.moodTags || []).sort(),
    experienceGoals: (preferences.experienceGoals || []).sort(),
    budget: preferences.budget || 0,
    tripDuration: preferences.tripDuration || "",
    companions: preferences.companions || "",
  };
  
  // Criar hash simples baseado em JSON string (sem usar Buffer)
  const jsonString = JSON.stringify(normalized);
  return btoa(jsonString); // Usar btoa em vez de Buffer para base64
}

/**
 * Força limites de cache por usuário removendo entradas mais antigas
 * Implementa LRU (Least Recently Used) cleanup
 */
async function enforceCacheLimits(
  ctx: any,
  userId: Id<"users">,
  category?: string
): Promise<{ cleaned: number; message: string }> {
  try {
    // Se categoria especificada, limitar por categoria
    if (category) {
      const categoryEntries = await ctx.db
        .query("cachedRecommendations")
        .withIndex("by_user_and_category", (q) => 
          q.eq("userId", userId).eq("category", category)
        )
        .collect();

      if (categoryEntries.length >= CACHE_CONFIG.MAX_ENTRIES_PER_CATEGORY) {
        // Ordenar por creation time (mais antigos primeiro)
        categoryEntries.sort((a, b) => a._creationTime - b._creationTime);
        
        const entriesToRemove = categoryEntries.length - CACHE_CONFIG.MAX_ENTRIES_PER_CATEGORY + 1;
        const toDelete = categoryEntries.slice(0, entriesToRemove);
        
        for (const entry of toDelete) {
          await ctx.db.delete(entry._id);
        }
        
        return {
          cleaned: entriesToRemove,
          message: `${entriesToRemove} caches antigos da categoria "${category}" removidos`
        };
      }
    }

    // Verificar limite global por usuário
    const userEntries = await ctx.db
      .query("cachedRecommendations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc") // Mais antigos primeiro (_creationTime é automático)
      .collect();

    if (userEntries.length >= CACHE_CONFIG.MAX_ENTRIES_PER_USER) {
      const entriesToRemove = userEntries.length - CACHE_CONFIG.MAX_ENTRIES_PER_USER + 1;
      const toDelete = userEntries.slice(0, entriesToRemove);
      
      for (const entry of toDelete) {
        await ctx.db.delete(entry._id);
      }
      
      return {
        cleaned: entriesToRemove,
        message: `${entriesToRemove} caches antigos removidos (limite global por usuário)`
      };
    }

    return { cleaned: 0, message: "Nenhuma limpeza necessária" };

  } catch (error) {
    console.error("Erro ao forçar limites de cache:", error);
    return { cleaned: 0, message: "Erro durante limpeza de cache" };
  }
}

/**
 * Normaliza recomendações para garantir que tenham todos os campos necessários
 */
function normalizeRecommendations(recommendations: any[]): any[] {
  return recommendations.map(rec => ({
    ...rec,
    // Garantir que todos os campos obrigatórios existam
    interests: rec.interests || [],
    hasRealPrice: rec.hasRealPrice ?? false,
    hasRealRating: rec.hasRealRating ?? false,
    realPrice: rec.realPrice ?? null,
    realRating: rec.realRating ?? null,
  }));
}

/**
 * Busca recomendações em cache baseado nas preferências do usuário
 */
export const getCachedRecommendations = mutation({
  args: {
    userPreferences: v.any(),
    category: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("cachedRecommendations"),
      userId: v.id("users"), // Campo do banco de dados
      preferencesHash: v.string(), // Campo do banco de dados
      recommendations: v.array(v.object({
        id: v.string(),
        type: v.string(),
        title: v.string(),
        description: v.string(),
        reasoning: v.string(),
        matchScore: v.number(),
        category: v.string(),
        priceRange: v.string(),
        features: v.array(v.string()),
        location: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        estimatedPrice: v.number(),
        aiGenerated: v.boolean(),
        partnerId: v.string(),
        partnerName: v.optional(v.string()),
        rating: v.number(),
        tags: v.array(v.string()),
        isActive: v.boolean(),
        adventureLevel: v.optional(v.number()),
        luxuryLevel: v.optional(v.number()),
        socialLevel: v.optional(v.number()),
        duration: v.optional(v.string()),
        difficulty: v.optional(v.string()),
        interests: v.array(v.string()),
        hasRealPrice: v.boolean(),
        hasRealRating: v.boolean(),
        realPrice: v.union(v.number(), v.null()),
        realRating: v.union(v.number(), v.null()),
        aiInsights: v.optional(v.array(v.string())),
      })),
      personalizedMessage: v.string(),
      processingTime: v.number(),
      isUsingAI: v.boolean(),
      confidenceScore: v.optional(v.number()),
      category: v.optional(v.string()),
      cacheVersion: v.string(),
      expiresAt: v.number(),
      _creationTime: v.number(),
      isCacheHit: v.boolean(), // Flag para indicar que veio do cache
      cacheAge: v.number(), // Idade do cache em minutos
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return null;
    }

    try {
      const preferencesHash = generatePreferencesHash(args.userPreferences);
      const now = Date.now();

      // Buscar cache com hash correspondente
      const cached = await ctx.db
        .query("cachedRecommendations")
        .withIndex("by_user_and_hash", (q) => 
          q.eq("userId", userId).eq("preferencesHash", preferencesHash)
        )
        .filter((q) => q.eq(q.field("category"), args.category))
        .first();

      if (!cached) {
        return null; // Não há cache para essas preferências
      }

      // Verificar se o cache não expirou
      if (cached.expiresAt <= now) {
        console.log("Cache expirado encontrado, será removido automaticamente");
        return null;
      }

      // Calcular idade do cache em minutos
      const cacheAge = Math.floor((now - cached._creationTime) / (1000 * 60));

      // Retornar dados do cache com metadata adicional
      return {
        ...cached,
        isCacheHit: true,
        cacheAge,
      };

    } catch (error) {
      console.error("Erro ao buscar cache de recomendações:", error);
      return null;
    }
  },
});

/**
 * Salva recomendações no cache
 */
export const cacheRecommendations = mutation({
  args: {
    userPreferences: v.any(),
    recommendations: v.array(v.object({
      id: v.string(),
      type: v.string(),
      title: v.string(),
      description: v.string(),
      reasoning: v.string(),
      matchScore: v.number(),
      category: v.string(),
      priceRange: v.string(),
      features: v.array(v.string()),
      location: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      estimatedPrice: v.number(),
      aiGenerated: v.boolean(),
      partnerId: v.string(),
      partnerName: v.optional(v.string()),
      rating: v.number(),
      tags: v.array(v.string()),
      isActive: v.boolean(),
      adventureLevel: v.optional(v.number()),
      luxuryLevel: v.optional(v.number()),
      socialLevel: v.optional(v.number()),
      duration: v.optional(v.string()),
      difficulty: v.optional(v.string()),
      // Campos que podem não estar presentes em recomendações AI - serão adicionados pela normalização
      interests: v.optional(v.array(v.string())),
      hasRealPrice: v.optional(v.boolean()),
      hasRealRating: v.optional(v.boolean()),
      realPrice: v.optional(v.union(v.number(), v.null())),
      realRating: v.optional(v.union(v.number(), v.null())),
      aiInsights: v.optional(v.array(v.string())),
    })),
    personalizedMessage: v.string(),
    processingTime: v.number(),
    isUsingAI: v.boolean(),
    confidenceScore: v.optional(v.number()),
    category: v.optional(v.string()),
    cacheDurationHours: v.optional(v.number()), // Duração personalizada do cache
  },
  returns: v.object({
    success: v.boolean(),
    cacheId: v.optional(v.id("cachedRecommendations")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return {
        success: false,
        message: "Usuário não autenticado"
      };
    }

    try {
      const preferencesHash = generatePreferencesHash(args.userPreferences);
      const cacheDuration = (args.cacheDurationHours || CACHE_CONFIG.DEFAULT_TTL_HOURS) * 60 * 60 * 1000;
      const expiresAt = Date.now() + cacheDuration;

      // Normalizar recomendações para garantir todos os campos necessários
      const normalizedRecommendations = normalizeRecommendations(args.recommendations);

      // Verificar se já existe cache com o mesmo hash
      const existingCache = await ctx.db
        .query("cachedRecommendations")
        .withIndex("by_user_and_hash", (q) => 
          q.eq("userId", userId).eq("preferencesHash", preferencesHash)
        )
        .filter((q) => q.eq(q.field("category"), args.category))
        .first();

      let cacheId: Id<"cachedRecommendations">;
      let cleanupMessage = "";

      if (existingCache) {
        // Atualizar cache existente
        await ctx.db.patch(existingCache._id, {
          recommendations: normalizedRecommendations,
          personalizedMessage: args.personalizedMessage,
          processingTime: args.processingTime,
          isUsingAI: args.isUsingAI,
          confidenceScore: args.confidenceScore,
          expiresAt,
          cacheVersion: "1.0", // Incrementar se necessário
        });
        cacheId = existingCache._id;
      } else {
        // Forçar limites de cache antes de criar novo
        const cleanupResult = await enforceCacheLimits(ctx, userId, args.category);
        if (cleanupResult.cleaned > 0) {
          cleanupMessage = ` (${cleanupResult.message})`;
        }

        // Criar novo cache
        cacheId = await ctx.db.insert("cachedRecommendations", {
          userId,
          preferencesHash,
          recommendations: normalizedRecommendations,
          personalizedMessage: args.personalizedMessage,
          processingTime: args.processingTime,
          isUsingAI: args.isUsingAI,
          confidenceScore: args.confidenceScore,
          category: args.category,
          cacheVersion: "1.0",
          expiresAt,
        });
      }

      return {
        success: true,
        cacheId,
        message: (existingCache ? "Cache atualizado com sucesso" : "Cache criado com sucesso") + cleanupMessage
      };

    } catch (error) {
      console.error("Erro ao salvar cache de recomendações:", error);
      return {
        success: false,
        message: "Erro interno ao salvar cache"
      };
    }
  },
});

/**
 * Invalida cache de recomendações de um usuário
 * Útil quando o usuário atualiza suas preferências
 */
export const invalidateUserCache = mutation({
  args: {
    category: v.optional(v.string()), // Se especificado, invalida apenas esta categoria
  },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return {
        success: false,
        deletedCount: 0,
        message: "Usuário não autenticado"
      };
    }

    try {
      let query = ctx.db.query("cachedRecommendations")
        .withIndex("by_user", (q) => q.eq("userId", userId));

      if (args.category) {
        query = ctx.db.query("cachedRecommendations")
          .withIndex("by_user_and_category", (q) => 
            q.eq("userId", userId).eq("category", args.category)
          );
      }

      const cacheEntries = await query.collect();
      
      // Deletar todas as entradas encontradas
      for (const entry of cacheEntries) {
        await ctx.db.delete(entry._id);
      }

      return {
        success: true,
        deletedCount: cacheEntries.length,
        message: `${cacheEntries.length} entradas de cache removidas`
      };

    } catch (error) {
      console.error("Erro ao invalidar cache:", error);
      return {
        success: false,
        deletedCount: 0,
        message: "Erro interno ao invalidar cache"
      };
    }
  },
});

/**
 * Limpa cache expirado de todos os usuários
 * Deve ser executado periodicamente via cron job
 */
export const cleanExpiredCache = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Buscar todos os caches expirados
      const expiredCaches = await ctx.db
        .query("cachedRecommendations")
        .withIndex("by_expiration", (q) => q.lt("expiresAt", now))
        .collect();

      // Deletar caches expirados
      for (const cache of expiredCaches) {
        await ctx.db.delete(cache._id);
      }

      return {
        success: true,
        deletedCount: expiredCaches.length,
        message: `${expiredCaches.length} caches expirados removidos`
      };

    } catch (error) {
      console.error("Erro ao limpar cache expirado:", error);
      return {
        success: false,
        deletedCount: 0,
        message: "Erro interno ao limpar cache"
      };
    }
  },
});

/**
 * Limpeza manual de cache com critérios personalizados
 * Útil para manutenção e otimização
 */
export const cleanCacheWithCriteria = mutation({
  args: {
    maxEntriesPerUser: v.optional(v.number()),
    maxEntriesPerCategory: v.optional(v.number()),
    olderThanHours: v.optional(v.number()),
    onlyExpired: v.optional(v.boolean()),
    dryRun: v.optional(v.boolean()), // Para testar sem deletar
  },
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    affectedUsers: v.number(),
    message: v.string(),
    details: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserConvexId(ctx);
    if (!userId) {
      return {
        success: false,
        deletedCount: 0,
        affectedUsers: 0,
        message: "Usuário não autenticado",
        details: [],
      };
    }

    try {
      const now = Date.now();
      const isDryRun = args.dryRun || false;
      
      let totalDeleted = 0;
      const affectedUsers = new Set<string>();
      const details: string[] = [];

      // Critério 1: Limpar apenas expirados
      if (args.onlyExpired) {
        const expiredCaches = await ctx.db
          .query("cachedRecommendations")
          .withIndex("by_expiration", (q) => q.lt("expiresAt", now))
          .collect();

        if (!isDryRun) {
          for (const cache of expiredCaches) {
            await ctx.db.delete(cache._id);
          }
        }

        totalDeleted += expiredCaches.length;
        details.push(`${expiredCaches.length} caches expirados ${isDryRun ? 'seriam' : 'foram'} removidos`);
      }

      // Critério 2: Limpar por idade
      if (args.olderThanHours) {
        const cutoffTime = now - (args.olderThanHours * 60 * 60 * 1000);
        const oldCaches = await ctx.db
          .query("cachedRecommendations")
          .filter((q) => q.lt(q.field("_creationTime"), cutoffTime))
          .collect();

        if (!isDryRun) {
          for (const cache of oldCaches) {
            await ctx.db.delete(cache._id);
            affectedUsers.add(cache.userId);
          }
        }

        totalDeleted += oldCaches.length;
        details.push(`${oldCaches.length} caches mais antigos que ${args.olderThanHours}h ${isDryRun ? 'seriam' : 'foram'} removidos`);
      }

      // Critério 3: Forçar limites globais
      if (args.maxEntriesPerUser || args.maxEntriesPerCategory) {
        // Agrupar caches por usuário
        const allCaches = await ctx.db
          .query("cachedRecommendations")
          .collect();

        const userCaches: { [userId: string]: any[] } = {};
        for (const cache of allCaches) {
          if (!userCaches[cache.userId]) {
            userCaches[cache.userId] = [];
          }
          userCaches[cache.userId].push(cache);
        }

        // Aplicar limites por usuário
        if (args.maxEntriesPerUser) {
          for (const [uId, caches] of Object.entries(userCaches)) {
            if (caches.length > args.maxEntriesPerUser) {
              // Ordenar por creation time e manter apenas os mais recentes
              caches.sort((a, b) => b._creationTime - a._creationTime);
              const toDelete = caches.slice(args.maxEntriesPerUser);
              
              if (!isDryRun) {
                for (const cache of toDelete) {
                  await ctx.db.delete(cache._id);
                }
              }
              
              totalDeleted += toDelete.length;
              affectedUsers.add(uId);
            }
          }
          
          details.push(`Limite de ${args.maxEntriesPerUser} entradas por usuário aplicado`);
        }

        // Aplicar limites por categoria
        if (args.maxEntriesPerCategory) {
          for (const [uId, caches] of Object.entries(userCaches)) {
            const categoryGroups: { [category: string]: any[] } = {};
            
            for (const cache of caches) {
              const category = cache.category || "general";
              if (!categoryGroups[category]) {
                categoryGroups[category] = [];
              }
              categoryGroups[category].push(cache);
            }

            for (const [category, categoryCaches] of Object.entries(categoryGroups)) {
              if (categoryCaches.length > args.maxEntriesPerCategory) {
                categoryCaches.sort((a, b) => b._creationTime - a._creationTime);
                const toDelete = categoryCaches.slice(args.maxEntriesPerCategory);
                
                if (!isDryRun) {
                  for (const cache of toDelete) {
                    await ctx.db.delete(cache._id);
                  }
                }
                
                totalDeleted += toDelete.length;
                affectedUsers.add(uId);
              }
            }
          }

          details.push(`Limite de ${args.maxEntriesPerCategory} entradas por categoria aplicado`);
        }
      }

      return {
        success: true,
        deletedCount: totalDeleted,
        affectedUsers: affectedUsers.size,
        message: isDryRun 
          ? `Simulação: ${totalDeleted} entradas seriam removidas de ${affectedUsers.size} usuários`
          : `${totalDeleted} entradas removidas de ${affectedUsers.size} usuários`,
        details,
      };

    } catch (error) {
      console.error("Erro ao limpar cache com critérios:", error);
      return {
        success: false,
        deletedCount: 0,
        affectedUsers: 0,
        message: "Erro interno durante limpeza",
        details: ["Erro: " + (error instanceof Error ? error.message : String(error))],
      };
    }
  },
}); 