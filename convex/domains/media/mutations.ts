import { v } from "convex/values";
import { mutation, action } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { MediaCreateInput, MediaUpdateInput, ImageDimensions } from "./types";
import { mutationWithRole } from "../../domains/rbac";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../../domains/rbac";

/**
 * Generate an upload URL for the client
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Verificar se o usuário está autenticado
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUserId = await getCurrentUserConvexId(ctx);
    if (!currentUserId) {
      throw new Error("Usuário não encontrado");
    }

    const role = await getCurrentUserRole(ctx);
    
    // Permitir upload para partners, employees e masters
    if (role !== "partner" && role !== "employee" && role !== "master") {
      throw new Error("Apenas partners, employees e masters podem fazer upload de mídias");
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();
    return uploadUrl;
  },
});

/**
 * Store metadata for an uploaded file
 */
export const createMedia = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.int64(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    height: v.optional(v.int64()),
    width: v.optional(v.int64()),
    uploadedBy: v.optional(v.id("users")),
    isPublic: v.boolean(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Verificar se o usuário está autenticado
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUserId = await getCurrentUserConvexId(ctx);
    if (!currentUserId) {
      throw new Error("Usuário não encontrado");
    }

    const role = await getCurrentUserRole(ctx);
    
    // Permitir criação de mídia para partners, employees e masters
    if (role !== "partner" && role !== "employee" && role !== "master") {
      throw new Error("Apenas partners, employees e masters podem criar mídias");
    }

    // Garantir que o uploadedBy seja sempre o usuário atual (segurança)
    const uploadedBy = currentUserId;

    // Gerar URL para a mídia
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Falha ao gerar URL para a mídia");
    }

    // Criar o registro da mídia
    const mediaId = await ctx.db.insert("media", {
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      description: args.description,
      category: args.category,
      height: args.height,
      width: args.width,
      uploadedBy,
      isPublic: args.isPublic,
      tags: args.tags,
      url,
    });

    return mediaId;
  },
});

/**
 * Delete a media file and its metadata
 */
export const deleteMedia = mutation({
  args: {
    id: v.id("media"),
  },
  handler: async (ctx, args) => {
    // Verificar se o usuário está autenticado
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUserId = await getCurrentUserConvexId(ctx);
    if (!currentUserId) {
      throw new Error("Usuário não encontrado");
    }

    const role = await getCurrentUserRole(ctx);

    // Verificar se a mídia existe
    const media = await ctx.db.get(args.id);
    if (!media) {
      throw new Error("Mídia não encontrada");
    }

    // Verificar permissões
    let canDelete = false;

    if (role === "master") {
      canDelete = true;
    } else if (role === "partner") {
      // Partner pode deletar suas próprias mídias
      canDelete = media.uploadedBy === currentUserId;
    } else if (role === "employee") {
      // Employee pode deletar suas próprias mídias
      if (media.uploadedBy === currentUserId) {
        canDelete = true;
      } else {
        // Employee também pode deletar mídias do partner que o cadastrou
        const employee = await ctx.db.get(currentUserId);
        if (employee?.partnerId && media.uploadedBy === employee.partnerId) {
          canDelete = true;
        }
      }
    }

    if (!canDelete) {
      throw new Error("Não autorizado a deletar esta mídia");
    }

    // Excluir o arquivo do storage
    try {
      await ctx.storage.delete(media.storageId);
    } catch (error) {
      console.error("Erro ao excluir arquivo do storage:", error);
      // Continua mesmo se houver erro no storage
    }

    // Excluir o registro do banco de dados
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Update media metadata
 */
export const updateMedia = mutation({
  args: {
    id: v.id("media"),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Verificar se o usuário está autenticado
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUserId = await getCurrentUserConvexId(ctx);
    if (!currentUserId) {
      throw new Error("Usuário não encontrado");
    }

    const role = await getCurrentUserRole(ctx);

    // Verificar se a mídia existe
    const existingMedia = await ctx.db.get(id);
    if (!existingMedia) {
      throw new Error("Mídia não encontrada");
    }

    // Verificar permissões
    let canUpdate = false;

    if (role === "master") {
      canUpdate = true;
    } else if (role === "partner") {
      // Partner pode atualizar suas próprias mídias
      canUpdate = existingMedia.uploadedBy === currentUserId;
    } else if (role === "employee") {
      // Employee pode atualizar suas próprias mídias
      if (existingMedia.uploadedBy === currentUserId) {
        canUpdate = true;
      } else {
        // Employee também pode atualizar mídias do partner que o cadastrou
        const employee = await ctx.db.get(currentUserId);
        if (employee?.partnerId && existingMedia.uploadedBy === employee.partnerId) {
          canUpdate = true;
        }
      }
    }

    if (!canUpdate) {
      throw new Error("Não autorizado a atualizar esta mídia");
    }

    // Atualizar o registro
    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Get image dimensions for images
 */
export const getImageDimensions = action({
  args: {
    storageId: v.string(),
  },
  returns: v.object({
    width: v.optional(v.int64()),
    height: v.optional(v.int64()),
  }),
  handler: async (ctx, args) => {
    // This would typically use something like 'image-size' npm package
    // to get image dimensions from the file buffer
    // For the sake of this example, we'll just return placeholder values
    
    // In a real implementation, you would:
    // 1. Get the file from storage
    // 2. Use a library to detect the image dimensions
    // 3. Return the dimensions
    
    return {
      width: BigInt(1920),  // Example value
      height: BigInt(1080), // Example value
    };
  },
});

/**
 * Refresh the storage URL for a media file
 */
export const refreshMediaUrl = mutation({
  args: {
    id: v.id("media"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // Verificar se o usuário está autenticado
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Usuário não autenticado");
    }

    const currentUserId = await getCurrentUserConvexId(ctx);
    if (!currentUserId) {
      throw new Error("Usuário não encontrado");
    }

    const role = await getCurrentUserRole(ctx);

    const media = await ctx.db.get(args.id);
    if (!media) {
      // Mídia foi excluída ou não existe - retorna null ao invés de lançar erro
      // Isso evita quebrar a aplicação quando URL refresh é chamado após exclusão
      return null;
    }

    // Verificar permissões
    let canRefresh = false;

    if (role === "master") {
      canRefresh = true;
    } else if (role === "partner") {
      // Partner pode atualizar suas próprias mídias
      canRefresh = media.uploadedBy === currentUserId;
    } else if (role === "employee") {
      // Employee pode atualizar suas próprias mídias
      if (media.uploadedBy === currentUserId) {
        canRefresh = true;
      } else {
        // Employee também pode atualizar mídias do partner que o cadastrou
        const employee = await ctx.db.get(currentUserId);
        if (employee?.partnerId && media.uploadedBy === employee.partnerId) {
          canRefresh = true;
        }
      }
    }

    if (!canRefresh) {
      throw new Error("Não autorizado a atualizar esta mídia");
    }

    const url = await ctx.storage.getUrl(media.storageId);
    if (!url) {
      throw new Error("Falha ao gerar URL para a mídia");
    }

    await ctx.db.patch(args.id, { url });
    return url;
  },
}); 