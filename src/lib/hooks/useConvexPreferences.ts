import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import type { Id } from '@/../convex/_generated/dataModel';

export type TravelPreferences = {
  tripDuration: string;
  tripDate: string;
  companions: string; 
  interests: string[];
  budget: number;
  preferences: {
    accommodation: string;
    dining: string[];
    activities: string[];
  };
  specialRequirements?: string;
};

export function useConvexPreferences() {
  const { user } = useUser();
  const clerkId = user?.id;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Primeiro, obter o usuário do Convex usando o clerkId
  const convexUser = useQuery(
    api.domains.users.queries.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  );
  
  const convexUserId = convexUser?._id;
  
  // Consulta para obter as preferências do usuário
  const preferences = useQuery(
    api.userPreferences.getUserPreferences, 
    convexUserId ? { userId: convexUserId } : "skip"
  );
  
  // Mutação para salvar/atualizar as preferências do usuário
  const savePreferences = useMutation(api.userPreferences.saveUserPreferences);
  
  // Mutação para excluir as preferências do usuário
  const deletePreferences = useMutation(api.userPreferences.deleteUserPreferences);
  
  // Função para salvar as preferências
  const saveUserPreferences = useCallback(async (preferencesData: TravelPreferences) => {
    if (!convexUserId) {
      setError("É necessário estar logado para salvar preferências");
      return null;
    }
    
    try {
      const result = await savePreferences({ 
        userId: convexUserId, 
        preferences: preferencesData 
      });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar preferências");
      return null;
    }
  }, [convexUserId, savePreferences]);
  
  // Função para excluir as preferências
  const removeUserPreferences = useCallback(async () => {
    if (!convexUserId) {
      setError("É necessário estar logado para excluir preferências");
      return false;
    }
    
    try {
      return await deletePreferences({ userId: convexUserId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir preferências");
      return false;
    }
  }, [convexUserId, deletePreferences]);
  
  // Efeito para controlar o estado de carregamento
  useEffect(() => {
    // Se não temos um clerkId, não estamos carregando
    if (!clerkId) {
      setIsLoading(false);
      return;
    }
    
    // Se estamos esperando o convexUser, ainda estamos carregando
    if (clerkId && convexUser === undefined) {
      setIsLoading(true);
      return;
    }
    
    // Se o convexUser é null, significa que o usuário não foi encontrado
    if (convexUser === null) {
      setError("Usuário não encontrado no sistema");
      setIsLoading(false);
      return;
    }
    
    // Se temos o convexUserId, mas não temos as preferências ainda
    if (convexUserId && preferences === undefined) {
      setIsLoading(true);
      return;
    }
    
    // Se temos as preferências ou sabemos que elas são null
    setIsLoading(false);
  }, [clerkId, convexUser, convexUserId, preferences]);
  
  return {
    preferences,
    isLoading,
    error,
    saveUserPreferences,
    removeUserPreferences
  };
} 