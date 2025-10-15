import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useCallback } from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { uploadFiles } from "@/lib/uploadthing";

// Type definitions for media files
export type Media = {
  _id: Id<"media">;
  _creationTime?: number;
  storageId: string;
  fileName: string;
  fileType: string;
  fileSize: bigint;
  description?: string;
  category?: string;
  height?: bigint;
  width?: bigint;
  uploadedBy: Id<"users">;
  isPublic: boolean;
  tags?: string[];
  url: string;
};

export type MediaUpload = {
  file: File;
  description?: string;
  category?: string;
  isPublic: boolean;
  tags?: string[];
};

// Hook to get all media files with URL verification
export function useMedia() {
  const media = useQuery(api.domains.media.queries.getAllMedia);
  const verifyMediaUrls = useVerifyMediaUrls();
  
  // Verificar e atualizar URLs quando os dados forem carregados
  if (media) {
    verifyMediaUrls(media);
  }

  return {
    media,
    isLoading: media === undefined
  };
}

// Hook to get media by category
export function useMediaByCategory(category: string | null) {
  const media = useQuery(
    api.domains.media.queries.getMediaByCategory,
    category ? { category } : "skip"
  );
  const verifyMediaUrls = useVerifyMediaUrls();
  
  // Verificar e atualizar URLs quando os dados forem carregados
  if (media) {
    verifyMediaUrls(media);
  }
  
  return {
    media,
    isLoading: category !== null && media === undefined
  };
}

// Hook to get media by user
export function useMediaByUser(userId: Id<"users">) {
  const media = useQuery(api.domains.media.queries.getByUser, { userId });
  const verifyMediaUrls = useVerifyMediaUrls();
  
  // Verificar e atualizar URLs quando os dados forem carregados
  if (media) {
    verifyMediaUrls(media);
  }
  
  return {
    media: media as Media[] | undefined,
    isLoading: media === undefined
  };
}

// Hook to get a single media file by ID
export function useMediaById(id: Id<"media"> | null) {
  const media = useQuery(api.domains.media.queries.getMediaById, id ? { id } : "skip");
  const verifyMediaUrls = useVerifyMediaUrls();
  
  // Verificar e atualizar URLs quando os dados forem carregados
  if (media) {
    verifyMediaUrls([media]);
  }
  
  return {
    media,
    isLoading: id !== null && media === undefined
  };
}

// Hook to verify and refresh Convex media URLs
export function useVerifyMediaUrls() {
  const refreshUrl = useMutation(api.domains.media.mutations.refreshMediaUrl);
  
  return async (mediaItems: Media[]) => {
    // Processa vários itens de mídia
    for (const media of mediaItems) {
      if (!media._id) continue;
      
      // Verifica se a URL está disponível fazendo um HEAD request
      try {
        const response = await fetch(media.url, { method: 'HEAD' });
        
        // Se a URL não for válida (erro 4xx ou 5xx), atualiza a URL
        if (!response.ok) {
          console.log(`Atualizando URL para mídia ${media._id} (${media.fileName})`);
          const newUrl = await refreshUrl({ id: media._id });
          if (newUrl === null) {
            console.log(`Mídia ${media._id} foi excluída, ignorando atualização de URL`);
          }
        }
      } catch (error) {
        // Em caso de erro de rede, também atualiza a URL
        console.log(`Erro ao verificar URL para mídia ${media._id}, atualizando...`, error);
        try {
          const newUrl = await refreshUrl({ id: media._id });
          if (newUrl === null) {
            console.log(`Mídia ${media._id} foi excluída, ignorando atualização de URL`);
          }
        } catch (refreshError) {
          console.log(`Erro ao atualizar URL para mídia ${media._id}:`, refreshError);
        }
      }
    }
  };
}

// Hook to upload a media file
export function useUploadMedia() {
  const { user } = useCurrentUser();
  const storeMedia = useMutation(api.domains.media.mutations.createMedia);
  
  const uploadMedia = useCallback(
    async ({
      file,
      description,
      category,
      isPublic,
      tags,
    }: {
      file: File;
      description?: string;
      category?: string;
      isPublic?: boolean;
      tags?: string[];
    }) => {
      if (!user?._id) {
        throw new Error("Usuário não autenticado");
      }

      const uploadResponse = await uploadFiles("mediaUploader", {
        files: [file],
      });

      const uploadedFile = uploadResponse?.[0];
      if (!uploadedFile) {
        throw new Error("Falha ao fazer upload do arquivo");
      }

      const fileUrl =
        uploadedFile.serverData?.fileUrl ?? uploadedFile.ufsUrl ?? uploadedFile.url;
      const fileKey = uploadedFile.serverData?.fileKey ?? uploadedFile.key;
      const fileNameFromServer = uploadedFile.serverData?.fileName ?? uploadedFile.name;
      const fileTypeFromServer = uploadedFile.serverData?.fileType ?? uploadedFile.type;
      const fileSizeFromServer = uploadedFile.serverData?.fileSize ?? uploadedFile.size;

      // Armazenar os metadados no banco de dados
      const mediaId = await storeMedia({
        storageId: fileKey,
        fileName: fileNameFromServer ?? file.name,
        fileType: fileTypeFromServer ?? file.type,
        fileSize: BigInt(fileSizeFromServer ?? file.size),
        description,
        category,
        uploadedBy: user._id,
        isPublic: isPublic ?? true,
        tags,
        fileUrl,
      });

      return mediaId;
    },
    [storeMedia, user?._id]
  );

  return uploadMedia;
}

// Hook to get Convex user ID from Clerk ID
export function useGetConvexUserId() {
  return async (clerkId: string): Promise<Id<"users"> | null> => {
    // Use a direct API call to Convex
    try {
      // Create a route that our client code can call
      const response = await fetch(`/api/get-user-id?clerkId=${encodeURIComponent(clerkId)}`);
      if (!response.ok) {
        throw new Error(`Failed to get user ID: ${response.statusText}`);
      }
      const data = await response.json();
      return data.userId as Id<"users">;
    } catch (error) {
      console.error('Error getting Convex user ID:', error);
      return null;
    }
  };
}

// Hook to delete a media file
export function useDeleteMedia() {
  const deleteMedia = useMutation(api.domains.media.mutations.deleteMedia);
  
  const deleteMediaFn = useCallback(
    async (id: Id<"media">) => {
      return await deleteMedia({ id });
    },
    [deleteMedia]
  );

  return deleteMediaFn;
}

// Hook to update media metadata
export function useUpdateMedia() {
  const updateMedia = useMutation(api.domains.media.mutations.updateMedia);
  
  const updateMediaFn = useCallback(
    async ({
      id,
      description,
      category,
      isPublic,
      tags,
    }: {
      id: Id<"media">;
      description?: string;
      category?: string;
      isPublic?: boolean;
      tags?: string[];
    }) => {
      return await updateMedia({
        id,
        description,
        category,
        isPublic,
        tags,
      });
    },
    [updateMedia]
  );

  return updateMediaFn;
}

// Hook to get media URL
export function useMediaUrl(storageId: string | null) {
  const url = useQuery(
    api.domains.media.queries.getMediaUrl,
    storageId ? { storageId } : "skip"
  );
  return {
    url,
    isLoading: storageId !== null && url === undefined,
  };
}
