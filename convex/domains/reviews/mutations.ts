import { mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";

/**
 * Atualiza o rating de um asset baseado nas reviews existentes
 * Esta função é chamada automaticamente quando uma review é criada/atualizada
 */
export const updateAssetRating = internalMutation({
  args: {
    itemType: v.string(),
    itemId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Buscar todas as reviews aprovadas para este item
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_item_approved", (q) =>
        q.eq("itemType", args.itemType)
         .eq("itemId", args.itemId)
         .eq("isApproved", true)
      )
      .collect();

    if (reviews.length === 0) {
      // Se não há reviews, manter rating padrão ou zerar
      return null;
    }

    // Calcular rating médio geral
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calcular ratings detalhados médios
    const detailedAverages: Record<string, number> = {};
    const detailedCounts: Record<string, number> = {};

    reviews.forEach(review => {
      if (review.detailedRatings) {
        Object.entries(review.detailedRatings).forEach(([key, value]) => {
          if (value !== undefined) {
            detailedAverages[key] = (detailedAverages[key] || 0) + value;
            detailedCounts[key] = (detailedCounts[key] || 0) + 1;
          }
        });
      }
    });

    // Calcular médias para ratings detalhados
    Object.keys(detailedAverages).forEach(key => {
      detailedAverages[key] = detailedAverages[key] / detailedCounts[key];
    });

    // Calcular porcentagem de recomendação
    const recommendCount = reviews.filter(review => review.wouldRecommend).length;
    const recommendationPercentage = (recommendCount / reviews.length) * 100;

    // Atualizar o asset baseado no tipo
    try {
      switch (args.itemType) {
        case "restaurant":
          await updateRestaurantRating(ctx, args.itemId, {
            overall: averageRating,
            totalReviews: reviews.length,
            food: detailedAverages.food || averageRating,
            service: detailedAverages.service || averageRating,
            ambience: detailedAverages.location || averageRating, // location pode representar ambiente
            value: detailedAverages.value || averageRating,
            recommendationPercentage,
          });
          break;

        case "accommodation":
          await updateAccommodationRating(ctx, args.itemId, {
            overall: averageRating,
            totalReviews: reviews.length,
            cleanliness: detailedAverages.cleanliness || averageRating,
            location: detailedAverages.location || averageRating,
            service: detailedAverages.service || averageRating,
            value: detailedAverages.value || averageRating,
            recommendationPercentage,
          });
          break;

        case "activity":
          await updateActivityRating(ctx, args.itemId, {
            overall: averageRating,
            totalReviews: reviews.length,
            organization: detailedAverages.organization || averageRating,
            guide: detailedAverages.guide || averageRating,
            value: detailedAverages.value || averageRating,
            recommendationPercentage,
          });
          break;

        case "event":
          await updateEventRating(ctx, args.itemId, {
            overall: averageRating,
            totalReviews: reviews.length,
            organization: detailedAverages.organization || averageRating,
            value: detailedAverages.value || averageRating,
            recommendationPercentage,
          });
          break;

        case "vehicle":
          await updateVehicleRating(ctx, args.itemId, {
            overall: averageRating,
            totalReviews: reviews.length,
            condition: detailedAverages.cleanliness || averageRating, // cleanliness pode representar condição
            service: detailedAverages.service || averageRating,
            value: detailedAverages.value || averageRating,
            recommendationPercentage,
          });
          break;

        default:
          console.warn(`Tipo de item não suportado para atualização de rating: ${args.itemType}`);
      }
    } catch (error) {
      console.error(`Erro ao atualizar rating para ${args.itemType}:${args.itemId}`, error);
    }

    return null;
  },
});

// Funções auxiliares para atualizar cada tipo de asset
async function updateRestaurantRating(ctx: any, restaurantId: string, ratingData: any) {
  const restaurant = await ctx.db
    .query("restaurants")
    .filter((q: any) => q.eq(q.field("_id"), restaurantId))
    .first();

  if (restaurant) {
    await ctx.db.patch(restaurant._id, {
      rating: {
        overall: Number(ratingData.overall.toFixed(1)),
        food: Number(ratingData.food.toFixed(1)),
        service: Number(ratingData.service.toFixed(1)),
        ambience: Number(ratingData.ambience.toFixed(1)),
        value: Number(ratingData.value.toFixed(1)),
        totalReviews: BigInt(ratingData.totalReviews),
        noiseLevel: restaurant.rating?.noiseLevel || "Moderado", // Manter valor existente
      }
    });
  }
}

async function updateAccommodationRating(ctx: any, accommodationId: string, ratingData: any) {
  const accommodation = await ctx.db
    .query("accommodations")
    .filter((q: any) => q.eq(q.field("_id"), accommodationId))
    .first();

  if (accommodation) {
    await ctx.db.patch(accommodation._id, {
      rating: {
        overall: Number(ratingData.overall.toFixed(1)),
        cleanliness: Number(ratingData.cleanliness.toFixed(1)),
        location: Number(ratingData.location.toFixed(1)),
        service: Number(ratingData.service.toFixed(1)),
        value: Number(ratingData.value.toFixed(1)),
        totalReviews: BigInt(ratingData.totalReviews),
      }
    });
  }
}

async function updateActivityRating(ctx: any, activityId: string, ratingData: any) {
  const activity = await ctx.db
    .query("activities")
    .filter((q: any) => q.eq(q.field("_id"), activityId))
    .first();

  if (activity) {
    await ctx.db.patch(activity._id, {
      rating: Number(ratingData.overall.toFixed(1))
    });
  }
}

async function updateEventRating(ctx: any, eventId: string, ratingData: any) {
  const event = await ctx.db
    .query("events")
    .filter((q: any) => q.eq(q.field("_id"), eventId))
    .first();

  if (event) {
    await ctx.db.patch(event._id, {
      rating: Number(ratingData.overall.toFixed(1))
    });
  }
}

async function updateVehicleRating(ctx: any, vehicleId: string, ratingData: any) {
  const vehicle = await ctx.db
    .query("vehicles")
    .filter((q: any) => q.eq(q.field("_id"), vehicleId))
    .first();

  if (vehicle) {
    // Veículos podem não ter campo rating, então criamos se necessário
    await ctx.db.patch(vehicle._id, {
      rating: Number(ratingData.overall.toFixed(1))
    });
  }
} 