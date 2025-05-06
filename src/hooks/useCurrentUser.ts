/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

// Tipo para o usuário autenticado
export interface CurrentUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  phone?: string;
  isLoading: boolean;
  isSignedIn: boolean;
  // Campos específicos do Convex
  convexId?: string; // ID interno do Convex (se existir)
  convexData?: any;   // Dados adicionais do usuário no Convex
}

/**
 * Hook personalizado que combina dados do usuário do Clerk e Convex
 * Fornece uma interface unificada para acessar o usuário autenticado
 */
export function useCurrentUser(): CurrentUser {
  // Estados para gerenciar o carregamento e dados
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Dados do usuário do Clerk
  const { isSignedIn, userId } = useAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  
  // Dados do usuário do Convex
  const convexUser = useQuery(api.auth.getUser) || null;
  const convexLoaded = convexUser !== undefined; // undefined significa que ainda está carregando
  
  // Determina se ainda está carregando
  const isLoading = !clerkLoaded || !convexLoaded || isInitializing;
  
  // Efeito para verificar quando a inicialização está completa
  useEffect(() => {
    if (clerkLoaded && convexLoaded) {
      setIsInitializing(false);
    }
  }, [clerkLoaded, convexLoaded]);
  
  // Se não estiver autenticado, retorna um objeto com isSignedIn = false
  if (!isSignedIn || !clerkUser) {
    return {
      id: "",
      isLoading,
      isSignedIn: false
    };
  }
  
  // Constrói e retorna o objeto de usuário unificado
  return {
    id: userId || "",
    email: clerkUser.primaryEmailAddress?.emailAddress,
    name: clerkUser.fullName || clerkUser.username || "",
    image: clerkUser.imageUrl,
    phone: clerkUser.primaryPhoneNumber?.phoneNumber,
    isLoading,
    isSignedIn: true,
    // Dados do Convex
    convexId: convexUser?.id,
    convexData: convexUser
  };
}

/**
 * Hook para verificar se o usuário está autenticado
 * Simplifica a verificação de autenticação em componentes
 */
export function useIsAuthenticated(): {
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const { isSignedIn, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!isSignedIn,
    isLoading
  };
}

/**
 * Hook para proteger rotas/componentes que exigem autenticação
 * @param redirectUrl URL para redirecionar se o usuário não estiver autenticado (opcional)
 */
export function useRequireAuth(redirectUrl?: string) {
  const { isAuthenticated, isLoading } = useIsAuthenticated();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);
      
      // Redirecionar se não autenticado e redirectUrl fornecido
      if (!isAuthenticated && redirectUrl) {
        window.location.href = redirectUrl;
      }
    }
  }, [isAuthenticated, isLoading, redirectUrl]);
  
  return {
    isReady,
    isAuthenticated,
    isLoading
  };
}
