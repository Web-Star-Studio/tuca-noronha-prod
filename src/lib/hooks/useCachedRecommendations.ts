import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

export interface CacheConfig {
  enableCache: boolean;
  cacheDurationHours: number;
  autoInvalidateOnPreferenceChange: boolean;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enableCache: true,
  cacheDurationHours: 24,
  autoInvalidateOnPreferenceChange: true,
};

export const useCachedRecommendations = (cacheConfig: Partial<CacheConfig> = {}) => {
  const config = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
  
  const [isCheckingCache, setIsCheckingCache] = useState(false);
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [cacheHits, setCacheHits] = useState(0);

  // Queries
  const cacheStats = useQuery(api.recommendations.getCacheStats);
  
  // Mutations
  const cacheRecommendationsMutation = useMutation(api.recommendations.cacheRecommendations);
  const invalidateCacheMutation = useMutation(api.recommendations.invalidateUserCache);
  const getCachedRecommendations = useMutation(api.recommendations.getCachedRecommendations);

  // Atualizar taxa de cache hit
  useEffect(() => {
    if (totalRequests > 0) {
      setCacheHitRate((cacheHits / totalRequests) * 100);
    }
  }, [cacheHits, totalRequests]);

  /**
   * Tenta buscar recomendações do cache primeiro
   */
  const getCachedRecommendationsIfAvailable = useCallback(async (
    userPreferences: any,
    category?: string
  ) => {
    if (!config.enableCache) {
      return null;
    }

    setIsCheckingCache(true);
    setTotalRequests(prev => prev + 1);

    try {
      const cached = await getCachedRecommendations({
        userPreferences,
        category,
      });

      if (cached) {
        setCacheHits(prev => prev + 1);

        // Mostrar toast discreto informando sobre o cache
        toast.success(`Recomendações carregadas instantaneamente!`, {
          description: `Cache de ${cached.cacheAge} minutos • ${cached.recommendations.length} itens`,
          duration: 2000,
        });

        return cached;
      }

      return null;

    } catch (error) {
      console.error('Erro ao verificar cache:', error);
      return null;
    } finally {
      setIsCheckingCache(false);
    }
  }, [config.enableCache, getCachedRecommendations]);

  /**
   * Salva recomendações no cache após geração
   */
  const saveToCache = useCallback(async (
    userPreferences: any,
    recommendations: any[],
    metadata: {
      personalizedMessage: string;
      processingTime: number;
      isUsingAI: boolean;
      confidenceScore?: number;
      category?: string;
    }
  ) => {
    if (!config.enableCache || recommendations.length === 0) {
      return;
    }

    try {
      const result = await cacheRecommendationsMutation({
        userPreferences,
        recommendations,
        personalizedMessage: metadata.personalizedMessage,
        processingTime: metadata.processingTime,
        isUsingAI: metadata.isUsingAI,
        confidenceScore: metadata.confidenceScore,
        category: metadata.category,
        cacheDurationHours: config.cacheDurationHours,
      });

      if (result.success) {

        // Toast discreto para confirmar cache
        toast.success('Recomendações salvas para próxima vez!', {
          description: `Cache válido por ${config.cacheDurationHours} horas`,
          duration: 1500,
        });
      }

      return result;

    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
      toast.error('Erro ao salvar cache', {
        description: 'As recomendações funcionarão normalmente',
        duration: 2000,
      });
    }
  }, [config.enableCache, config.cacheDurationHours, cacheRecommendationsMutation]);

  /**
   * Invalida cache do usuário (útil quando preferências mudam)
   */
  const invalidateCache = useCallback(async (category?: string) => {
    try {
      const result = await invalidateCacheMutation({ category });
      
      if (result.success) {

        toast.info('Cache atualizado!', {
          description: result.deletedCount > 0 
            ? `${result.deletedCount} entradas removidas` 
            : 'Nenhuma entrada para remover',
          duration: 2000,
        });
      }

      return result;

    } catch (error) {
      console.error('Erro ao invalidar cache:', error);
      toast.error('Erro ao atualizar cache');
    }
  }, [invalidateCacheMutation]);

  /**
   * Invalida cache automaticamente quando preferências mudam
   */
  const invalidateOnPreferenceChange = useCallback(async () => {
    if (config.autoInvalidateOnPreferenceChange) {
      await invalidateCache();
    }
  }, [config.autoInvalidateOnPreferenceChange, invalidateCache]);

  /**
   * Workflow completo: tenta cache, gera se necessário, salva no cache
   */
  const getRecommendationsWithCache = useCallback(async (
    userPreferences: any,
    generateFunction: () => Promise<{
      recommendations: any[];
      personalizedMessage: string;
      processingTime: number;
      isUsingAI: boolean;
      confidenceScore?: number;
    }>,
    category?: string
  ) => {
    // 1. Tentar buscar do cache primeiro
    const cached = await getCachedRecommendationsIfAvailable(userPreferences, category);
    if (cached) {
      return {
        recommendations: cached.recommendations,
        personalizedMessage: cached.personalizedMessage,
        processingTime: cached.processingTime,
        isUsingAI: cached.isUsingAI,
        confidenceScore: cached.confidenceScore,
        isCacheHit: true,
        cacheAge: cached.cacheAge,
      };
    }

    // 2. Se não há cache, gerar novas recomendações
    const result = await generateFunction();

    // 3. Salvar no cache para próxima vez
    await saveToCache(userPreferences, result.recommendations, {
      personalizedMessage: result.personalizedMessage,
      processingTime: result.processingTime,
      isUsingAI: result.isUsingAI,
      confidenceScore: result.confidenceScore,
      category,
    });

    return {
      ...result,
      isCacheHit: false,
      cacheAge: 0,
    };

  }, [getCachedRecommendationsIfAvailable, saveToCache]);

  return {
    // Funções principais
    getCachedRecommendationsIfAvailable,
    saveToCache,
    invalidateCache,
    invalidateOnPreferenceChange,
    getRecommendationsWithCache,
    
    // Estados
    isCheckingCache,
    
    // Estatísticas
    cacheStats,
    cacheHitRate,
    totalRequests,
    cacheHits,
    
    // Configuração
    config,
    
    // Helpers
    resetStats: () => {
      setTotalRequests(0);
      setCacheHits(0);
      setCacheHitRate(0);
    },
  };
}; 