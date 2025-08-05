"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export interface ConvexImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storageId: string;
  mediaId: Id<"media">;
  fallbackText?: string;
  onError?: () => void;
}

/**
 * Um componente de imagem otimizado para arquivos armazenados no Convex
 * - Verifica se a URL da imagem é válida
 * - Atualiza automaticamente a URL se necessário
 * - Fornece um fallback em caso de falha
 */
export function ConvexImage({

  mediaId,
  src,
  alt,
  className,
  fallbackText,
  onError,
  ...props
}: ConvexImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(src as string);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const refreshUrl = useMutation(api.media.refreshStorageUrl);
  
  // Verificar e atualizar a URL da imagem se necessário
  useEffect(() => {
    const verifyImageUrl = async () => {
      if (!imageSrc) {
        try {
          // Se não tiver URL, tentar obter uma nova
          const newUrl = await refreshUrl({ id: mediaId });
          setImageSrc(newUrl);
          setIsLoading(false);
        } catch {
          console.error("Erro ao atualizar URL da imagem:", error);
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }
        return;
      }
      
      try {
        // Verificar se a URL atual é válida
        const response = await fetch(imageSrc, { method: "HEAD" });
        
        if (!response.ok) {
          // Se a URL não for válida, obter uma nova
          const newUrl = await refreshUrl({ id: mediaId });
          setImageSrc(newUrl);
        }
        
        setIsLoading(false);
      } catch {
        // Em caso de erro, tentar obter uma nova URL
        try {
          const newUrl = await refreshUrl({ id: mediaId });
          setImageSrc(newUrl);
          setIsLoading(false);
        } catch (refreshError) {
          console.error("Erro ao atualizar URL da imagem:", refreshError);
          setHasError(true);
          setIsLoading(false);
          onError?.();
        }
      }
    };
    
    verifyImageUrl();
  }, [imageSrc, mediaId, refreshUrl, onError]);
  
  // Renderizar um fallback enquanto carrega ou em caso de erro
  if (isLoading) {
    return (
      <div 
        className={cn(
          "bg-muted flex items-center justify-center", 
          className
        )}
        {...props}
      >
        <div className="animate-pulse w-8 h-8 rounded-full bg-muted-foreground/20" />
      </div>
    );
  }
  
  if (hasError || !imageSrc) {
    return (
      <div 
        className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground text-sm", 
          className
        )}
        {...props}
      >
        {fallbackText || "Imagem não disponível"}
      </div>
    );
  }
  
  // Se a URL for válida, renderizar a imagem
  return (
    <Image
      src={imageSrc}
      alt={alt}
      className={className}
      width={300}
      height={200}
      onError={async () => {
        // Se a imagem falhar ao carregar, tentar obter uma nova URL
        try {
          const newUrl = await refreshUrl({ id: mediaId });
          setImageSrc(newUrl);
        } catch {
          setHasError(true);
          onError?.();
        }
      }}
      {...props}
    />
  );
} 