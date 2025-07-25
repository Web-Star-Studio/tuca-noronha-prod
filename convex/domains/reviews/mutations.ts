import { mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { Id } from "../../_generated/dataModel";
import { mutationWithRole } from "../rbac";
import { internal } from "../../_generated/api";
import { getCurrentUserConvexId } from "../rbac/utils";

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

/**
 * Aprovar ou rejeitar uma review (apenas para masters)
 */
export const moderateReview = mutationWithRole(["master"])({
  args: {
    reviewId: v.id("reviews"),
    action: v.union(v.literal("approve"), v.literal("reject")),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUser = currentUserId ? await ctx.db.get(currentUserId) : null;
    
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review não encontrada");
    }

    // Atualizar status da review
    await ctx.db.patch(args.reviewId, {
      isApproved: args.action === "approve",
      updatedAt: Date.now()
    });

    // Log de auditoria
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUserId!,
        role: "master",
        name: currentUser?.name || "Master Admin",
        email: currentUser?.email
      },
      event: {
        type: "update",
        action: `Review ${args.action}d`,
        category: "data_modification",
        severity: "medium"
      },
      resource: {
        type: "reviews",
        id: args.reviewId,
        name: review.title
      },
      source: {
        ipAddress: "system",
        platform: "web"
      },
      status: "success",
      metadata: {
        reason: args.reason,
        oldStatus: review.isApproved ? "approved" : "pending",
        newStatus: args.action === "approve" ? "approved" : "rejected"
      },
      timestamp: Date.now()
    });

    // Reenviar para atualizar rating do asset se aprovado
    if (args.action === "approve") {
      await ctx.scheduler.runAfter(0, internal.domains.reviews.mutations.updateAssetRating, {
        itemType: review.itemType,
        itemId: review.itemId
      });
    }

    return { success: true };
  }
});

/**
 * Deletar uma review (apenas para masters) - soft delete
 */
export const deleteReview = mutationWithRole(["master"])({
  args: {
    reviewId: v.id("reviews"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUser = currentUserId ? await ctx.db.get(currentUserId) : null;
    
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review não encontrada");
    }

    // Soft delete - marcar como não aprovada e adicionar metadata
    await ctx.db.patch(args.reviewId, {
      isApproved: false,
      updatedAt: Date.now()
    });

    // Log de auditoria
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUserId!,
        role: "master",
        name: currentUser?.name || "Master Admin",
        email: currentUser?.email
      },
      event: {
        type: "delete",
        action: "Review deleted",
        category: "data_modification",
        severity: "high"
      },
      resource: {
        type: "reviews",
        id: args.reviewId,
        name: review.title
      },
      source: {
        ipAddress: "system",
        platform: "web"
      },
      status: "success",
      metadata: {
        reason: args.reason,
        deletedReviewData: {
          rating: review.rating,
          title: review.title,
          itemType: review.itemType,
          itemId: review.itemId
        }
      },
      timestamp: Date.now()
    });

    // Atualizar rating do asset após remoção
    await ctx.scheduler.runAfter(0, internal.domains.reviews.mutations.updateAssetRating, {
      itemType: review.itemType,
      itemId: review.itemId
    });

    return { success: true };
  }
});

/**
 * Resposta administrativa a uma review (apenas para masters)
 */
export const respondToReview = mutationWithRole(["master"])({
  args: {
    reviewId: v.id("reviews"),
    response: v.string(),
    isPublic: v.boolean()
  },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUser = currentUserId ? await ctx.db.get(currentUserId) : null;
    
    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review não encontrada");
    }

    // Criar resposta administrativa
    const responseId = await ctx.db.insert("reviewResponses", {
      reviewId: args.reviewId,
      responderId: currentUserId!,
      responderRole: "master",
      response: args.response,
      isPublic: args.isPublic,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Log de auditoria
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUserId!,
        role: "master",
        name: currentUser?.name || "Master Admin",
        email: currentUser?.email
      },
      event: {
        type: "create",
        action: "Review response created",
        category: "communication",
        severity: "low"
      },
      resource: {
        type: "reviewResponses",
        id: responseId,
        name: `Response to: ${review.title}`
      },
      source: {
        ipAddress: "system",
        platform: "web"
      },
      status: "success",
      metadata: {
        reviewId: args.reviewId,
        isPublic: args.isPublic,
        responseLength: args.response.length
      },
      timestamp: Date.now()
    });

    return { success: true, responseId };
  }
});

/**
 * Atualizar configurações de moderação (apenas para masters)
 */
export const updateModerationSettings = mutationWithRole(["master"])({
  args: {
    autoApprove: v.boolean(),
    minimumRating: v.optional(v.number()),
    bannedWords: v.array(v.string()),
    requireVerification: v.boolean()
  },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUser = currentUserId ? await ctx.db.get(currentUserId) : null;

    // Atualizar ou criar configurações de moderação
    const existingSettings = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "review_moderation"))
      .first();

    const settingsData = {
      autoApprove: args.autoApprove,
      minimumRating: args.minimumRating,
      bannedWords: args.bannedWords,
      requireVerification: args.requireVerification,
      updatedAt: Date.now()
    };

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        value: settingsData,
        lastModifiedBy: currentUserId!,
        lastModifiedAt: Date.now()
      });
    } else {
      await ctx.db.insert("systemSettings", {
        key: "review_moderation",
        value: settingsData,
        type: "object",
        category: "business",
        description: "Configurações de moderação de reviews",
        isPublic: false,
        lastModifiedBy: currentUserId!,
        lastModifiedAt: Date.now(),
        createdAt: Date.now()
      });
    }

    // Log de auditoria
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUserId!,
        role: "master",
        name: currentUser?.name || "Master Admin",
        email: currentUser?.email
      },
      event: {
        type: "update",
        action: "Moderation settings updated",
        category: "system_admin",
        severity: "medium"
      },
      resource: {
        type: "systemSettings",
        id: existingSettings?._id || "new",
        name: "Review Moderation Settings"
      },
      source: {
        ipAddress: "system",
        platform: "web"
      },
      status: "success",
      metadata: {
        newSettings: settingsData
      },
      timestamp: Date.now()
    });

    return { success: true };
  }
});

/**
 * Inicializar configurações padrão de moderação (sistema interno)
 */
export const initializeDefaultModerationSettings = mutationWithRole(["master"])({
  args: {},
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    
    // Verificar se já existem configurações
    const existingSettings = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "review_moderation"))
      .first();

    if (existingSettings) {
      return { success: true, message: "Configurações já existem" };
    }

    // Criar configurações padrão
    const defaultSettings = {
      autoApprove: false, // Moderação manual por padrão para garantir qualidade
      minimumRating: undefined, // Sem restrição de rating mínimo
      bannedWords: [
        "spam", "lixo", "horrível", "terrível", "péssimo", 
        "fraude", "golpe", "enganação", "não recomendo"
      ], // Algumas palavras que podem indicar reviews problemáticas
      requireVerification: false, // Não exigir verificação por padrão
      updatedAt: Date.now()
    };

    await ctx.db.insert("systemSettings", {
      key: "review_moderation",
      value: defaultSettings,
      type: "object",
      category: "business",
      description: "Configurações de moderação de reviews",
      isPublic: false,
      lastModifiedBy: currentUserId!,
      lastModifiedAt: Date.now(),
      createdAt: Date.now()
    });

    // Log de auditoria
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUserId!,
        role: "master",
        name: "Sistema",
        email: "system@tournefy.com"
      },
      event: {
        type: "create",
        action: "Default moderation settings initialized",
        category: "system_admin",
        severity: "low"
      },
      resource: {
        type: "systemSettings",
        id: "new",
        name: "Review Moderation Settings"
      },
      source: {
        ipAddress: "system",
        platform: "system"
      },
      status: "success",
      metadata: {
        defaultSettings
      },
      timestamp: Date.now()
    });

    return { success: true, message: "Configurações padrão criadas" };
  }
});

 