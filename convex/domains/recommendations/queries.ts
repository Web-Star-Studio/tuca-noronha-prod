import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getCurrentUserRole, getCurrentUserConvexId } from "../rbac/utils";

/**
 * Busca todos os assets disponíveis para recomendações
 * Inclui apenas assets ativos e com informações completas
 */
export const getAssetsForRecommendations = query({
  args: {
    limit: v.optional(v.number()),
    assetType: v.optional(v.string()),
  },
  returns: v.array(v.object({
    id: v.string(),
    type: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    priceRange: v.string(),
    price: v.number(), // Mantido para compatibilidade (será 0 quando null)
    rating: v.number(), // Mantido para compatibilidade (será 0 quando null)
    location: v.optional(v.string()),
    features: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    isActive: v.boolean(),
    partnerId: v.string(),
    partnerName: v.optional(v.string()),
    // Campos específicos para matching
    adventureLevel: v.optional(v.number()),
    luxuryLevel: v.optional(v.number()),
    socialLevel: v.optional(v.number()),
    duration: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    interests: v.array(v.string()),
    // Campos para verificar dados reais
    hasRealPrice: v.boolean(),
    hasRealRating: v.boolean(),
    realPrice: v.union(v.number(), v.null()),
    realRating: v.union(v.number(), v.null()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    let allAssets: any[] = [];

    // Tipos de assets para buscar
    const assetTypes = args.assetType 
      ? [args.assetType] 
      : ["restaurants", "events", "activities", "vehicles", "accommodations"];

    for (const assetType of assetTypes) {
      let assets: any[] = [];

      try {
        switch (assetType) {
          case "restaurants":
            assets = await ctx.db
              .query("restaurants")
              .filter((q) => q.eq(q.field("isActive"), true))
              .take(limit);
            break;

          case "events":
            assets = await ctx.db
              .query("events")
              .filter((q) => q.eq(q.field("isActive"), true))
              .take(limit);
            break;

          case "activities":
            assets = await ctx.db
              .query("activities")
              .filter((q) => q.eq(q.field("isActive"), true))
              .take(limit);
            break;

          case "vehicles":
            assets = await ctx.db
              .query("vehicles")
              .filter((q) => q.eq(q.field("status"), "available"))
              .take(limit);
            break;

          case "accommodations":
            assets = await ctx.db
              .query("accommodations")
              .filter((q) => q.eq(q.field("isActive"), true))
              .take(limit);
            break;

          default:
            continue;
        }

        // Transformar e padronizar dados
        const transformedAssets = await Promise.all(
          assets.map(async (asset) => {
            // Buscar informações do partner
            const partnerId = assetType === "vehicles" ? asset.ownerId : asset.partnerId;
            const partner = partnerId ? await ctx.db.get(partnerId) : null;

            // Calcular price range baseado no preço real
            const price = getAssetPrice(asset, assetType);
            let priceRange = "economico"; // Default quando não há preço
            if (price !== null) {
              if (price >= 12000) priceRange = "luxo";
              else if (price >= 8000) priceRange = "premium";
              else if (price >= 5000) priceRange = "medio";
              else priceRange = "economico";
            }

            // Extrair rating
            const rating = getAssetRating(asset, assetType);

            // Mapear interesses baseados em tags e características
            const interests = [
              ...(asset.tags || []),
              ...(asset.cuisine || []),
              ...(asset.features || []),
              ...(asset.amenities || [])
            ].map((item: string) => item.toLowerCase());

            // Calcular níveis para matching
            const adventureLevel = calculateAdventureLevel(asset, assetType);
            const luxuryLevel = calculateLuxuryLevel(asset, price);
            const socialLevel = calculateSocialLevel(asset, assetType);

            return {
              id: `${assetType}_${asset._id.toString()}`,
              type: mapAssetTypeForRecommendations(assetType),
              name: asset.name || asset.title || "Asset sem nome",
              description: asset.description || asset.summary || "Descrição não disponível",
              category: asset.category || (asset.cuisine && asset.cuisine[0]) || assetType,
              priceRange,
              price: price || 0, // Para compatibilidade, mas null será tratado na UI
              rating: rating || 0, // Para compatibilidade, mas null será tratado na UI
              location: asset.location || (asset.address && asset.address.city) || (asset.address && asset.address.neighborhood) || "Fernando de Noronha",
              features: asset.features || asset.amenities || [],
              imageUrl: asset.imageUrl || (asset.images && asset.images[0]),
              tags: asset.tags || [],
              isActive: assetType === "vehicles" ? asset.status === "available" : asset.isActive,
              partnerId: partnerId?.toString() || "",
              partnerName: (partner as any)?.name || "",
              // Campos para matching
              adventureLevel,
              luxuryLevel,
              socialLevel,
              duration: asset.duration || (asset.estimatedDuration ? `${asset.estimatedDuration} horas` : undefined),
              difficulty: asset.difficulty,
              interests,
              // Campos originais para verificar se dados são reais
              hasRealPrice: price !== null,
              hasRealRating: rating !== null,
              realPrice: price,
              realRating: rating,
            };
          })
        );

        allAssets.push(...transformedAssets);
      } catch (error) {
        console.error(`Erro ao buscar ${assetType}:`, error);
        continue;
      }
    }

    // Ordenar por rating e ativo
    return allAssets
      .filter(asset => asset.isActive)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  },
});

/**
 * Função auxiliar para extrair preço do asset baseado no tipo
 * Retorna null se não houver preço real disponível
 */
function getAssetPrice(asset: any, assetType: string): number | null {
  switch (assetType) {
    case "vehicles":
      return asset.pricePerDay || null;
    case "accommodations":
      return asset.pricePerNight || null;
    case "restaurants":
      return asset.averagePrice || null;
    case "events":
      return asset.ticketPrice || asset.price || null;
    case "activities":
      return asset.price || null;
    default:
      return null;
  }
}

/**
 * Função auxiliar para extrair rating do asset baseado no tipo
 * Retorna null se não houver rating real disponível
 */
function getAssetRating(asset: any, assetType: string): number | null {
  if (typeof asset.rating === 'number') {
    return asset.rating;
  } else if (asset.rating && typeof asset.rating === 'object' && asset.rating.overall) {
    return asset.rating.overall;
  } else {
    // Sem rating real disponível
    return null;
  }
}

/**
 * Calcula o nível de aventura baseado nas características do asset
 */
function calculateAdventureLevel(asset: any, assetType: string): number {
  let score = 30; // Base score

  if (assetType === "activities") {
    if (asset.difficulty === "hard" || asset.difficulty === "extreme") score += 40;
    else if (asset.difficulty === "medium") score += 20;
    
    const adventurous = ["mergulho", "trilha", "rapel", "surf", "voo", "radical"];
    const tags = (asset.tags || []).concat(asset.features || []);
    
    for (const tag of tags) {
      if (adventurous.some(adv => tag.toLowerCase().includes(adv))) {
        score += 15;
      }
    }
  }

  if (assetType === "vehicles") {
    if (asset.category === "suv" || asset.category === "adventure") score += 30;
    else if (asset.category === "luxury") score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calcula o nível de luxo baseado no preço real e características
 */
function calculateLuxuryLevel(asset: any, price: number | null): number {
  let score = 20; // Base score

  // Score baseado no preço real (apenas se disponível)
  if (price !== null) {
    if (price >= 12000) score += 50;
    else if (price >= 8000) score += 35;
    else if (price >= 5000) score += 20;
  }

  // Score baseado em amenidades
  const luxuryFeatures = ["spa", "piscina", "vista", "premium", "gourmet", "vip"];
  const features = (asset.features || []).concat(asset.amenities || []);
  
  for (const feature of features) {
    if (luxuryFeatures.some(lux => feature.toLowerCase().includes(lux))) {
      score += 10;
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calcula o nível social baseado no tipo e características
 */
function calculateSocialLevel(asset: any, assetType: string): number {
  let score = 40; // Base score

  if (assetType === "restaurants") score += 30;
  else if (assetType === "events") score += 40;
  else if (assetType === "activities") {
    const social = ["grupo", "turma", "coletivo", "compartilhado"];
    const description = (asset.description || "").toLowerCase();
    
    if (social.some(s => description.includes(s))) score += 20;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Mapeia tipos de assets para o formato de recomendações
 */
function mapAssetTypeForRecommendations(assetType: string): string {
  const mapping: Record<string, string> = {
    "restaurants": "restaurant",
    "accommodations": "accommodation", 
    "activities": "activity",
    "events": "experience",
    "vehicles": "activity" // Veículos como atividade de transporte
  };

  return mapping[assetType] || assetType;
}

/**
 * Busca estatísticas dos assets para dashboard
 */
export const getAssetsStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    byType: v.object({
      restaurants: v.number(),
      events: v.number(),
      activities: v.number(),
      vehicles: v.number(),
      accommodations: v.number(),
    }),
    avgRating: v.number(),
    avgPrice: v.number(),
  }),
  handler: async (ctx) => {
    const [restaurants, events, activities, vehicles, accommodations] = await Promise.all([
      ctx.db.query("restaurants").filter(q => q.eq(q.field("isActive"), true)).collect(),
      ctx.db.query("events").filter(q => q.eq(q.field("isActive"), true)).collect(),
      ctx.db.query("activities").filter(q => q.eq(q.field("isActive"), true)).collect(),
      ctx.db.query("vehicles").filter(q => q.eq(q.field("status"), "available")).collect(),
      ctx.db.query("accommodations").filter(q => q.eq(q.field("isActive"), true)).collect(),
    ]);

    const allAssets = [...restaurants, ...events, ...activities, ...vehicles, ...accommodations];
    
    const total = allAssets.length;
    
    // Calcular ratings usando função auxiliar
    const ratings = allAssets.map(asset => {
      // Determinar o tipo baseado na presença de campos específicos
      let assetType = "unknown";
      if ((asset as any).cuisine) assetType = "restaurants";
      else if ((asset as any).pricePerDay) assetType = "vehicles";
      else if ((asset as any).pricePerNight) assetType = "accommodations";
      else if ((asset as any).ticketPrice) assetType = "events";
      else assetType = "activities";
      
      return getAssetRating(asset, assetType);
    });

    // Calcular preços usando função auxiliar
    const prices = allAssets.map(asset => {
      // Determinar o tipo baseado na presença de campos específicos
      let assetType = "unknown";
      if ((asset as any).cuisine) assetType = "restaurants";
      else if ((asset as any).pricePerDay) assetType = "vehicles";
      else if ((asset as any).pricePerNight) assetType = "accommodations";
      else if ((asset as any).ticketPrice) assetType = "events";
      else assetType = "activities";
      
      return getAssetPrice(asset, assetType);
    });

    // Filtrar valores nulos e calcular médias apenas com dados reais
    const validRatings = ratings.filter((rating): rating is number => rating !== null);
    const validPrices = prices.filter((price): price is number => price !== null);

    return {
      total,
      byType: {
        restaurants: restaurants.length,
        events: events.length,
        activities: activities.length,
        vehicles: vehicles.length,
        accommodations: accommodations.length,
      },
      avgRating: validRatings.length > 0 ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length : 0,
      avgPrice: validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0,
    };
  },
}); 