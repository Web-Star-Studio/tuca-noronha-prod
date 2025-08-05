import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

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

// Tipo para dados do PersonalizationChatbot
export type SmartPreferences = {
  tripDuration: string;
  companions: string;
  interests: string[];
  budget: number;
  personalityProfile: {
    adventureLevel: number;
    luxuryPreference: number;
    socialLevel: number;
    activityIntensity: number;
  };
  moodTags: string[];
  experienceGoals: string[];
};

// Função para converter SmartPreferences para TravelPreferences
function convertSmartToTravelPreferences(smartPrefs: SmartPreferences): TravelPreferences {
  // Mapear moodTags e experienceGoals para preferências específicas
  const accommodation = smartPrefs.personalityProfile.luxuryPreference > 70 ? 'premium' :
                       smartPrefs.personalityProfile.luxuryPreference > 40 ? 'confortavel' : 'economico';
                       
  const dining: string[] = [];
  if (smartPrefs.moodTags.includes('tranquil')) dining.push('frutos_mar');
  if (smartPrefs.moodTags.includes('adventure')) dining.push('regional');
  if (smartPrefs.moodTags.includes('romantic')) dining.push('jantar_especial');
  if (smartPrefs.experienceGoals.includes('culinary-discovery')) dining.push('gastronomia_local');
  
  const activities: string[] = [];
  if (smartPrefs.personalityProfile.adventureLevel > 60) activities.push('mergulho');
  if (smartPrefs.moodTags.includes('adventure')) activities.push('trilhas_guiadas');
  if (smartPrefs.moodTags.includes('tranquil')) activities.push('passeio_barco');
  if (smartPrefs.experienceGoals.includes('adventure-memories')) activities.push('atividades_radicais');
  if (smartPrefs.experienceGoals.includes('relaxation')) activities.push('contemplacao');

  return {
    tripDuration: smartPrefs.tripDuration,
    tripDate: new Date().toISOString().split('T')[0], // Data atual como fallback
    companions: smartPrefs.companions,
    interests: smartPrefs.interests,
    budget: smartPrefs.budget,
    preferences: {
      accommodation,
      dining: dining.length > 0 ? dining : ['regional'],
      activities: activities.length > 0 ? activities : ['passeio_barco']
    },
    specialRequirements: undefined
  };
}

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
  
  // Mutação para invalidar cache de recomendações
  const invalidateRecommendationsCache = useMutation(api.recommendations.invalidateUserCache);
  
  // Função para salvar as preferências (aceita ambos os formatos)
  const saveUserPreferences = useCallback(async (preferencesData: TravelPreferences | SmartPreferences) => {
    if (!convexUserId) {
      setError("É necessário estar logado para salvar preferências");
      return null;
    }
    
    try {
      
      
      // Detectar o tipo de dados e converter se necessário
      let travelPrefs: TravelPreferences;
      
      if ('personalityProfile' in preferencesData) {
        // É SmartPreferences, precisa converter
        console.log('🔄 Convertendo SmartPreferences para TravelPreferences');
        travelPrefs = convertSmartToTravelPreferences(preferencesData);

      } else {
        // Já é TravelPreferences
        console.log('✅ Dados já estão no formato TravelPreferences');
        travelPrefs = preferencesData;
      }
      

      
      const result = await savePreferences({ 
        userId: convexUserId, 
        preferences: travelPrefs 
      });
      
      console.log('✅ Resultado do Convex:', result);
      
      // Invalidar cache de recomendações quando preferências são atualizadas
      try {
        await invalidateRecommendationsCache({});

        
        toast.success('Cache atualizado!', {
          description: 'Suas próximas recomendações refletirão as novas preferências',
          duration: 2000,
        });
      } catch (cacheError) {
        console.warn('⚠️ Erro ao invalidar cache:', cacheError);
        // Não falha o processo principal
      }
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao salvar preferências:', err);
      setError(err instanceof Error ? err.message : "Erro ao salvar preferências");
      return null;
    }
  }, [convexUserId, savePreferences, invalidateRecommendationsCache]);
  
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