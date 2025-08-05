import { query } from "../../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { queryWithRole } from "../rbac";
import { getCurrentUserConvexId, requireRole } from "../rbac/utils";

/**
 * Lista todas as reviews do sistema com paginação e filtros (apenas para masters)
 */
export const listAllReviewsAdmin = query({
  args: {
    paginationOpts: paginationOptsValidator,
    filters: v.optional(v.object({
      itemType: v.optional(v.string()),
      isApproved: v.optional(v.boolean()),
      rating: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number())
      })),
      dateRange: v.optional(v.object({
        start: v.optional(v.number()),
        end: v.optional(v.number())
      })),
      searchTerm: v.optional(v.string()),
      partnerId: v.optional(v.id("users"))
    }))
  },
  handler: async (ctx, args) => {
    // Check role access
    await requireRole(ctx, ["master"]);
    
    // Build the query
    let reviewsQuery = ctx.db.query("reviews");
    
    // Aplicar filtros usando .filter() para evitar problemas com índices
    reviewsQuery = reviewsQuery.filter((q) => {
      const conditions: any[] = [];
      
      // Filtrar por tipo de item se especificado
      if (args.filters?.itemType) {
        conditions.push(q.eq(q.field("itemType"), args.filters.itemType));
      }
      
      // Filtrar por status de aprovação
      if (args.filters?.isApproved !== undefined) {
        conditions.push(q.eq(q.field("isApproved"), args.filters.isApproved));
      }
      
      // Filtrar por rating mínimo
      if (args.filters?.rating?.min !== undefined) {
        conditions.push(q.gte(q.field("rating"), args.filters.rating.min));
      }
      
      // Filtrar por rating máximo
      if (args.filters?.rating?.max !== undefined) {
        conditions.push(q.lte(q.field("rating"), args.filters.rating.max));
      }
      
      // Filtrar por data inicial
      if (args.filters?.dateRange?.start) {
        conditions.push(q.gte(q.field("createdAt"), args.filters.dateRange.start));
      }
      
      // Filtrar por data final
      if (args.filters?.dateRange?.end) {
        conditions.push(q.lte(q.field("createdAt"), args.filters.dateRange.end));
      }
      
      // Filtrar por busca textual
      if (args.filters?.searchTerm) {
        const searchTerm = args.filters.searchTerm.toLowerCase();
        conditions.push(
          q.or(
            q.eq(q.field("title"), searchTerm),
            q.eq(q.field("comment"), searchTerm)
          )
        );
      }
      
      // Combinar todas as condições
      if (conditions.length === 0) return true;
      if (conditions.length === 1) return conditions[0];
      return q.and(...conditions);
    });

    // Aplicar paginação com ordenação por data de criação (mais recentes primeiro)
    const results = await reviewsQuery
      .order("desc")
      .paginate(args.paginationOpts);

    // Enriquecer dados com informações do usuário e asset
    const enrichedPage = await Promise.all(
      results.page.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        const asset = await getAssetInfo(ctx, review.itemType, review.itemId);
        
        return {
          ...review,
          user: user ? {
            id: user._id,
            name: user.name || "Usuário Anônimo",
            email: user.email,
            image: user.image
          } : null,
          asset
        };
      })
    );

    return {
      ...results,
      page: enrichedPage
    };
  }
});

/**
 * Obter estatísticas gerais das reviews (apenas para masters)
 */
export const getReviewsStats = query({
  args: {
    dateRange: v.optional(v.object({
      start: v.number(),
      end: v.number()
    }))
  },
  handler: async (ctx, args) => {
    // Check role access
    await requireRole(ctx, ["master"]);
    
    let reviews = await ctx.db.query("reviews").collect();
    
    // Filtrar por data se especificado
    if (args.dateRange) {
      reviews = reviews.filter(r => 
        r.createdAt >= args.dateRange!.start && 
        r.createdAt <= args.dateRange!.end
      );
    }

    const stats = {
      total: reviews.length,
      approved: reviews.filter(r => r.isApproved).length,
      pending: reviews.filter(r => !r.isApproved).length,
      byRating: {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length,
      },
      byAssetType: reviews.reduce((acc, review) => {
        acc[review.itemType] = (acc[review.itemType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageRating: reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0,
      recentTrend: {
        thisWeek: reviews.filter(r => 
          r.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length,
        lastWeek: reviews.filter(r => 
          r.createdAt > Date.now() - 14 * 24 * 60 * 60 * 1000 &&
          r.createdAt <= Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length
      }
    };

    return stats;
  }
});

// Helper function to get asset information
async function getAssetInfo(ctx: any, itemType: string, itemId: string) {
  try {
    let asset = null;
    
    switch (itemType) {
      case "restaurant":
        asset = await ctx.db.get(itemId);
        return asset ? { name: (asset as any).name, description: (asset as any).description } : null;
      

      
      case "activity":
        asset = await ctx.db.get(itemId);
        return asset ? { name: (asset as any).title, description: (asset as any).description } : null;
      
      case "event":
        asset = await ctx.db.get(itemId);
        return asset ? { name: (asset as any).title, description: (asset as any).description } : null;
      
      case "vehicle":
        asset = await ctx.db.get(itemId);
        return asset ? { name: (asset as any).name, description: (asset as any).description } : null;
      
      case "package":
        asset = await ctx.db.get(itemId);
        return asset ? { name: (asset as any).name, description: (asset as any).description } : null;
      
      default:
        return { name: "Asset Desconhecido", description: "" };
    }
  } catch (error) {
    return { name: "Asset não encontrado", description: "" };
  }
}

/**
 * Obter configurações atuais de moderação (apenas para masters)
 */
export const getModerationSettings = query({
  args: {},
  handler: async (ctx, args) => {
    // Check role access
    await requireRole(ctx, ["master"]);
    
    const settings = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "review_moderation"))
      .first();

    if (!settings) {
      // Retornar configurações padrão se não existirem
      return {
        autoApprove: false,
        minimumRating: undefined,
        bannedWords: [],
        requireVerification: false,
        exists: false
      };
    }

    return {
      ...settings.value as any,
      exists: true,
      lastModified: settings.lastModifiedAt
    };
  }
}); 