import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Tipo para as preferências de viagem
export type TravelPreferences = {
  tripDuration: string;
  tripDate: string;
  companions: string;
  interests: string[];
  budget: number;
  preferences: {
    accommodation: string;
    dining: string[];
    activities: string[];
  };
  specialRequirements?: string;
};

/**
 * Salva ou atualiza as preferências de viagem de um usuário
 */
export const saveUserPreferences = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.object({
      tripDuration: v.string(),
      tripDate: v.string(),
      companions: v.string(),
      interests: v.array(v.string()),
      budget: v.number(),
      preferences: v.object({
        accommodation: v.string(),
        dining: v.array(v.string()),
        activities: v.array(v.string()),
      }),
      specialRequirements: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, preferences } = args;
    
    // Verificar se o usuário existe
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se já existe um registro de preferências para este usuário
    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingPreferences) {
      // Atualizar o registro existente
      return await ctx.db.patch(existingPreferences._id, {
        ...preferences,
        updatedAt: Date.now(),
      });
    }
    
    // Criar um novo registro
    return await ctx.db.insert("userPreferences", {
      userId,
      ...preferences,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Obtém as preferências de viagem de um usuário
 */
export const getUserPreferences = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
      
    return preferences;
  },
});

/**
 * Exclui as preferências de viagem de um usuário
 */
export const deleteUserPreferences = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
      
    if (preferences) {
      await ctx.db.delete(preferences._id);
      return true;
    }
    
    return false;
  },
});

/**
 * Obtém o número total de preferências salvas
 */
export const getPreferencesCount = query({
  args: {},
  handler: async (ctx) => {
    const allPreferences = await ctx.db.query("userPreferences").collect();
    return allPreferences.length;
  },
});

/**
 * Obtém as preferências de viagem mais populares
 */
export const getPopularPreferences = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Obter todas as preferências
    const allPreferences = await ctx.db.query("userPreferences").collect();
    
    // Analisar interesses mais populares
    const interestsCount: Record<string, number> = {};
    const accommodationCount: Record<string, number> = {};
    
    for (const pref of allPreferences) {
      // Contar interesses
      for (const interest of pref.interests) {
        interestsCount[interest] = (interestsCount[interest] || 0) + 1;
      }
      
      // Contar tipos de acomodação
      accommodationCount[pref.preferences.accommodation] = 
        (accommodationCount[pref.preferences.accommodation] || 0) + 1;
    }
    
    // Ordenar por popularidade e limitar resultados
    const topInterests = Object.entries(interestsCount)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, limit)
      .map(([interest, count]) => ({ interest, count }));
      
    const topAccommodations = Object.entries(accommodationCount)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, limit)
      .map(([accommodation, count]) => ({ accommodation, count }));
    
    // Calcular orçamento médio
    const averageBudget = allPreferences.reduce((sum, pref) => sum + pref.budget, 0) / 
      (allPreferences.length || 1);
    
    return {
      topInterests,
      topAccommodations,
      averageBudget,
      totalUsers: allPreferences.length,
    };
  },
}); 