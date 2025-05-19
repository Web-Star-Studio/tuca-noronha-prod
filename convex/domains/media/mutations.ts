import { v } from "convex/values";
import { mutation, action } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { MediaCreateInput, MediaUpdateInput, ImageDimensions } from "./types";

/**
 * Generate an upload URL for the client
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
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
    uploadedBy: v.id("users"),
    isPublic: v.boolean(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Gerar URL para a mídia
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Falha ao gerar URL para a mídia");
    }

    // Criar o registro da mídia
    const mediaId = await ctx.db.insert("media", {
      ...args,
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
    // Verificar se a mídia existe
    const media = await ctx.db.get(args.id);
    if (!media) {
      throw new Error("Mídia não encontrada");
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

    // Verificar se a mídia existe
    const existingMedia = await ctx.db.get(id);
    if (!existingMedia) {
      throw new Error("Mídia não encontrada");
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
      width: 1920n,  // Example value
      height: 1080n, // Example value
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
  handler: async (ctx, args) => {
    const media = await ctx.db.get(args.id);
    if (!media) {
      throw new Error("Mídia não encontrada");
    }

    const url = await ctx.storage.getUrl(media.storageId);
    if (!url) {
      throw new Error("Falha ao gerar URL para a mídia");
    }

    await ctx.db.patch(args.id, { url });
    return url;
  },
}); 