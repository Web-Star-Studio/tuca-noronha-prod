import { useState, useCallback } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useConvexPreferences, SmartPreferences } from './useConvexPreferences';
import { useCachedRecommendations } from './useCachedRecommendations';

// Usar o tipo SmartPreferences como UserPreferences para consistência
type UserPreferences = SmartPreferences;

interface AIRecommendation {
  id: string;
  type: 'activity' | 'restaurant' | 'experience';
  title: string;
  description: string;
  reasoning: string;
  matchScore: number;
  category: string;
  priceRange: string;
  features: string[];
  location?: string;
  imageUrl?: string;
  estimatedPrice?: number;
  aiGenerated?: boolean;
  aiInsights?: string[];
  personalizedTips?: string[];
  // Campos dos assets reais
  partnerId?: string;
  partnerName?: string;
  rating?: number;
  tags?: string[];
  isActive?: boolean;
}



export const useAIRecommendations = () => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalizedMessage, setPersonalizedMessage] = useState<string>('');
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [isUsingAI, setIsUsingAI] = useState<boolean>(false);
  const [isCacheHit, setIsCacheHit] = useState<boolean>(false);
  const [cacheAge, setCacheAge] = useState<number>(0);
  const {} = useConvexPreferences();
  
  // Hook de cache para otimização
  const {
    getRecommendationsWithCache,
    invalidateOnPreferenceChange,
    cacheStats,
    cacheHitRate,
    isCheckingCache,
  } = useCachedRecommendations({
    enableCache: true,
    cacheDurationHours: 24,
    autoInvalidateOnPreferenceChange: true,
  });
  
  // Hook do Convex para chamar a action OpenAI
  const generateAIRecommendationsAction = useAction(api.openaiActions.generateAIRecommendations);
  
  // Query para buscar assets reais do Convex
  const realAssets = useQuery(api.recommendations.getAssetsForRecommendations, {
    limit: 50,
  });

  /* Função para gerar perfil textual do usuário (comentada - não está sendo usada)
  const generateUserProfileText = useCallback((userPrefs: UserPreferences): string => {
    const personalityDescriptions = {
      adventureLevel: userPrefs.personalityProfile.adventureLevel > 70 ? 'muito aventureiro' : 
                    userPrefs.personalityProfile.adventureLevel > 40 ? 'moderadamente aventureiro' : 'prefere tranquilidade',
      luxuryPreference: userPrefs.personalityProfile.luxuryPreference > 70 ? 'busca experiências premium' :
                       userPrefs.personalityProfile.luxuryPreference > 40 ? 'gosta de conforto' : 'prefere opções econômicas',
      socialLevel: userPrefs.personalityProfile.socialLevel > 70 ? 'muito sociável' :
                  userPrefs.personalityProfile.socialLevel > 40 ? 'moderadamente social' : 'prefere intimidade',
      activityIntensity: userPrefs.personalityProfile.activityIntensity > 70 ? 'muito ativo' :
                        userPrefs.personalityProfile.activityIntensity > 40 ? 'ativo moderado' : 'prefere atividades relaxantes'
    };

    return `
      Perfil do Viajante:
      - Duração da viagem: ${userPrefs.tripDuration}
      - Tipo de companhia: ${userPrefs.companions}
      - Orçamento: R$ ${userPrefs.budget}
      - Personalidade: ${personalityDescriptions.adventureLevel}, ${personalityDescriptions.luxuryPreference}, ${personalityDescriptions.socialLevel}, ${personalityDescriptions.activityIntensity}
      - Interesses: ${userPrefs.interests.join(', ')}
      - Vibes desejadas: ${userPrefs.moodTags.join(', ')}
      - Objetivos da viagem: ${userPrefs.experienceGoals.join(', ')}
    `;
  }, []); */

  // Sistema de scoring baseado no perfil
  const calculateMatchScore = useCallback((
    item: any, 
    userProfile: UserPreferences
  ): number => {
    let score = 50; // Base score

    const { personalityProfile } = userProfile;

    // Adventure Level matching
    if (item.adventureLevel !== undefined) {
      const diff = Math.abs(item.adventureLevel - personalityProfile.adventureLevel);
      score += Math.max(0, 20 - (diff / 5));
    }

    // Luxury preference matching
    if (item.luxuryLevel !== undefined) {
      const diff = Math.abs(item.luxuryLevel - personalityProfile.luxuryPreference);
      score += Math.max(0, 15 - (diff / 6));
    }

    // Interest matching
    if (item.interests && userProfile.interests) {
      const commonInterests = item.interests.filter((interest: string) => 
        userProfile.interests.some(userInt => 
          userInt.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(userInt.toLowerCase())
        )
      );
      score += commonInterests.length * 8;
    }

    // Tag matching
    if (item.tags && userProfile.interests) {
      const commonTags = item.tags.filter((tag: string) => 
        userProfile.interests.some(userInt => 
          userInt.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(userInt.toLowerCase())
        )
      );
      score += commonTags.length * 5;
    }

    // Mood matching
    if (item.tags && userProfile.moodTags) {
      const moodMatch = item.tags.filter((tag: string) => 
        userProfile.moodTags.some(mood => 
          mood.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(mood.toLowerCase())
        )
      );
      score += moodMatch.length * 10;
    }

    // Budget compatibility (apenas se houver preço real)
    if (item.hasRealPrice && item.priceRange && userProfile.budget && item.realPrice) {
      const budget = userProfile.budget;
      const realPrice = item.realPrice;
      
      // Verificar compatibilidade com preço real vs orçamento
      if (realPrice <= budget) {
        score += 15; // Bonus por estar dentro do orçamento
      } else {
        score -= 10; // Penalidade por estar acima do orçamento
      }
      
      // Bonus adicional para faixas de preço compatíveis
      if (
        (item.priceRange === 'economico' && budget < 5000) ||
        (item.priceRange === 'medio' && budget >= 5000 && budget < 8000) ||
        (item.priceRange === 'premium' && budget >= 8000 && budget < 12000) ||
        (item.priceRange === 'luxo' && budget >= 12000)
      ) {
        score += 5; // Bonus menor adicional por compatibilidade de faixa
      }
    }

    // Rating bonus (apenas se houver rating real)
    if (item.hasRealRating && item.realRating && item.realRating > 0) {
      score += item.realRating * 2; // Até 10 pontos extras para rating 5
    }

    // Social Level matching (para restaurantes e eventos)
    if (item.socialLevel !== undefined) {
      const diff = Math.abs(item.socialLevel - personalityProfile.socialLevel);
      score += Math.max(0, 10 - (diff / 10));
    }

    return Math.min(100, Math.max(0, score));
  }, []);

  // Transformar assets reais em formato de recomendação
  const transformRealAssets = useCallback((
    assets: any[], 
    userProfile: UserPreferences, 
    category?: string
  ): AIRecommendation[] => {
    if (!assets) return [];

    // Filtrar por categoria se especificada
    const filteredAssets = category 
      ? assets.filter(asset => asset.type === category)
      : assets;

    // Calcular match score e transformar
    const recommendations = filteredAssets.map(asset => {
      const matchScore = calculateMatchScore(asset, userProfile);
      
      return {
        id: asset.id,
        type: asset.type as 'activity' | 'restaurant' | 'experience',
        title: asset.name,
        description: asset.description,
        reasoning: `Combina ${matchScore}% com seu perfil baseado em ${asset.partnerName ? 'parceiro verificado' : 'características'} e avaliações reais`,
        matchScore,
        category: asset.category || asset.type,
        priceRange: asset.priceRange,
        features: asset.features || [],
        location: asset.location,
        imageUrl: asset.imageUrl,
        estimatedPrice: asset.price,
        aiGenerated: false,
        // Campos dos assets reais
        partnerId: asset.partnerId,
        partnerName: asset.partnerName,
        rating: asset.rating,
        tags: asset.tags,
        isActive: asset.isActive,
      };
    });

    // Ordenar por match score
    const finalRecommendations = recommendations
      .filter(rec => rec.isActive !== false)
      .sort((a, b) => b.matchScore - a.matchScore);
    

    
    return finalRecommendations;
  }, [calculateMatchScore]);

  // Função para converter TravelPreferences para SmartPreferences
  const convertTravelToSmartPreferences = useCallback((travelPrefs: any): UserPreferences => {
    // Se já for SmartPreferences, retorna como está
    if (travelPrefs && travelPrefs.personalityProfile) {
      return travelPrefs as UserPreferences;
    }
    
    // Caso contrário, converte de TravelPreferences para SmartPreferences
    return {
      tripDuration: travelPrefs?.tripDuration || '5-7-days',
      companions: travelPrefs?.companions || '',
      interests: travelPrefs?.interests || [],
      budget: travelPrefs?.budget || 7500,
      personalityProfile: {
        adventureLevel: 50,
        luxuryPreference: travelPrefs?.preferences?.accommodation === 'resort' ? 70 : 50,
        socialLevel: 50,
        activityIntensity: 50,
      },
      moodTags: [],
      experienceGoals: [],
    };
  }, []);

  const generateRecommendations = useCallback(async (
    userProfile: UserPreferences | any,
    category?: string,
    limit: number = 6
  ) => {
    setIsLoading(true);
    setError(null);
    setIsCacheHit(false);
    setCacheAge(0);

    try {
      // Converter perfil para formato correto se necessário
      const smartProfile = convertTravelToSmartPreferences(userProfile);
      
      // Verificar se temos assets reais disponíveis
      if (!realAssets || realAssets.length === 0) {
        setError('Nenhum asset disponível no momento. Tente novamente mais tarde.');
        return [];
      }

      // Usar o sistema de cache inteligente
      const result = await getRecommendationsWithCache(
        smartProfile,
        async () => {
          // Esta função só executa se NÃO houver cache válido
          const startTime = Date.now();

          // 1. Gerar recomendações base com algoritmo tradicional usando assets reais
          const baseRecommendations = transformRealAssets(realAssets, smartProfile, category)
            .slice(0, limit);

          if (baseRecommendations.length === 0) {
            const fallbackMessage = category 
              ? `Nenhum ${category} encontrado que corresponda ao seu perfil` 
              : 'Nenhuma recomendação encontrada para seu perfil';
            
            throw new Error(fallbackMessage);
          }

          // 2. Tentar melhorar com OpenAI (se disponível)
          try {
            const aiResult = await generateAIRecommendationsAction({
              userPreferences: smartProfile,
              baseRecommendations,
            });

            const totalTime = Date.now() - startTime;
            

            
            return {
              recommendations: aiResult.recommendations,
              personalizedMessage: aiResult.personalizedMessage || '🌊 Recomendações inteligentes baseadas em dados reais!',
              processingTime: totalTime,
              isUsingAI: true,
              confidenceScore: aiResult.confidenceScore,
            };
            
          } catch {
            // OpenAI indisponível, usando algoritmo tradicional
            
            const totalTime = Date.now() - startTime;
            const avgScore = Math.round(
              baseRecommendations.reduce((acc, rec) => acc + rec.matchScore, 0) / baseRecommendations.length
            );
            
            return {
              recommendations: baseRecommendations,
              personalizedMessage: `🎯 ${baseRecommendations.length} recomendações encontradas com ${avgScore}% de compatibilidade baseadas em dados reais do sistema!`,
              processingTime: totalTime,
              isUsingAI: false,
            };
          }
        },
        category
      );

      // Atualizar states com resultado (do cache ou recém-gerado)
      setRecommendations(result.recommendations);
      setPersonalizedMessage(result.personalizedMessage);
      setProcessingTime(result.processingTime);
      setIsUsingAI(result.isUsingAI);
      setIsCacheHit(result.isCacheHit);
      setCacheAge(result.cacheAge);

      return result.recommendations;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar recomendações. Verifique sua conexão e tente novamente.';
      setError(errorMessage);
      setPersonalizedMessage('');
      setRecommendations([]);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [realAssets, transformRealAssets, generateAIRecommendationsAction, convertTravelToSmartPreferences, getRecommendationsWithCache]);

  return {
    recommendations,
    isLoading: isLoading || realAssets === undefined || isCheckingCache,
    error,
    personalizedMessage,
    processingTime,
    isUsingAI,
    generateRecommendations,
    // Funcionalidades de cache
    invalidateCache: invalidateOnPreferenceChange,
    isCacheHit,
    cacheAge,
    cacheStats,
    cacheHitRate,
    clearRecommendations: () => {
      setRecommendations([]);
      setPersonalizedMessage('');
      setError(null);
      setProcessingTime(0);
      setIsUsingAI(false);
      setIsCacheHit(false);
      setCacheAge(0);
    },
    // Adicionar estatísticas dos assets reais
    assetsStats: {
      total: realAssets?.length || 0,
      hasRealData: (realAssets?.length || 0) > 0,
    }
  };
}; 