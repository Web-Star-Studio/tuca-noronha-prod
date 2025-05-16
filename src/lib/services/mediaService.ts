import { useMutation, useQuery } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { useCallback } from "react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// Type definitions for media files
export type Media = {
  _id: Id<"media">;
  _creationTime?: number;
  storageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description?: string;
  category?: string;
  height?: number;
  width?: number;
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
  const media = useQuery(api.media.getAllMedia);
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
    api.media.getMediaByCategory,
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
  const media = useQuery(api.media.getByUser, { userId });
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
  const media = useQuery(api.media.getMediaById, id ? { id } : "skip");
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
  const refreshUrl = useMutation(api.media.refreshStorageUrl);
  
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
          await refreshUrl({ id: media._id });
        }
      } catch (error) {
        // Em caso de erro de rede, também atualiza a URL
        console.log(`Erro ao verificar URL para mídia ${media._id}, atualizando...`);
        await refreshUrl({ id: media._id });
      }
    }
  };
}

// Hook to upload a media file
export function useUploadMedia() {
  const { user } = useCurrentUser();
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const storeMedia = useMutation(api.media.createMedia);
  
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
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Gerar URL para upload
      const uploadUrl = await generateUploadUrl();
      
      // Upload do arquivo para o Convex Storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error("Falha ao fazer upload do arquivo");
      }
      
      // Obter o storageId do resultado
      const { storageId } = await result.json();
      
      // Armazenar os metadados no banco de dados
      const mediaId = await storeMedia({
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: BigInt(file.size),
        description,
        category,
        uploadedBy: user.id as Id<"users">,
        isPublic: isPublic ?? true,
        tags,
      });

      return mediaId;
    },
    [generateUploadUrl, storeMedia, user?.id]
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
  const deleteMedia = useMutation(api.media.deleteMedia);
  
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
  const updateMedia = useMutation(api.media.updateMedia);
  
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
    api.media.getMediaUrl,
    storageId ? { storageId } : "skip"
  );
  return {
    url,
    isLoading: storageId !== null && url === undefined,
  };
}
