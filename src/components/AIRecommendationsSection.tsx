"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, RefreshCw, Target, MapPin, DollarSign, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIRecommendations } from '@/lib/hooks/useAIRecommendations';
import { useConvexPreferences } from '@/lib/hooks/useConvexPreferences';

export default function AIRecommendationsSection() {
  const router = useRouter();
  const { preferences } = useConvexPreferences();
  const { 
    recommendations, 
    isLoading, 
    personalizedMessage,
    generateRecommendations
  } = useAIRecommendations();

  useEffect(() => {
    if (preferences && recommendations.length === 0 && !isLoading) {
      handleGenerateRecommendations();
    }
  }, [preferences, recommendations.length, isLoading, handleGenerateRecommendations]);

  const handleGenerateRecommendations = useCallback(async () => {
    if (!preferences) return;
    try {
      await generateRecommendations(preferences, undefined, 6);
    } catch (err) {
      console.error('Erro ao gerar recomendações:', err);
    }
  }, [preferences, generateRecommendations]);

  const handleCreateProfile = () => {
    router.push('/personalizacao');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!preferences) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Complete sua personalização
          </h3>
          <p className="text-gray-600 mb-6">
            Para receber recomendações inteligentes, complete seu perfil
          </p>
          <Button 
            onClick={handleCreateProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Criar Perfil
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Criando suas recomendações
        </h3>
        <p className="text-gray-600">
          Aguarde enquanto analisamos as melhores opções para você
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="mr-3 h-6 w-6 text-blue-500" />
            Recomendações Inteligentes
          </h2>
          <p className="text-gray-600">
            Sugestões personalizadas baseadas no seu perfil
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleGenerateRecommendations}
          disabled={isLoading}
          className="border-gray-200 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* AI Message */}
      {personalizedMessage && (
        <Card className="bg-blue-50 border border-blue-200">
          <CardContent className="p-4">
            <p className="font-medium flex items-center text-blue-800">
              <Sparkles className="mr-2 h-4 w-4" />
              {personalizedMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side - Stats */}
        <div className="lg:col-span-1">
          <Card className="bg-white shadow-sm border border-gray-200 sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{recommendations.length}</div>
                  <div className="text-sm text-gray-500">Recomendações</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center">
                    <Star className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {recommendations.length > 0 
                      ? Math.round(recommendations.reduce((acc, rec) => acc + rec.matchScore, 0) / recommendations.length)
                      : 0
                    }%
                  </div>
                  <div className="text-sm text-gray-500">Compatibilidade</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 mx-auto mb-3 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {recommendations.filter(rec => rec.partnerId).length}
                  </div>
                  <div className="text-sm text-gray-500">Parceiros</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Recommendations Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations.map((recommendation) => (
              <Card 
                key={recommendation.id} 
                className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                        {recommendation.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{recommendation.category}</p>
                      {recommendation.partnerName && (
                        <p className="text-xs text-green-600 mt-1">
                          por {recommendation.partnerName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-3">
                      <Badge variant="secondary" className="bg-green-100 text-green-600">
                        {recommendation.matchScore}%
                      </Badge>
                      
                      {recommendation.rating && recommendation.rating > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs font-medium text-gray-700">
                            {recommendation.rating && typeof recommendation.rating === 'number' ? recommendation.rating.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-4">
                  <p className="text-gray-700 text-sm line-clamp-3">{recommendation.description}</p>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 flex items-start">
                      <Target className="h-3 w-3 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      {recommendation.reasoning}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {recommendation.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {recommendation.location}
                      </div>
                    )}
                    
                    {recommendation.estimatedPrice && (
                      <div className="flex items-center text-sm text-green-600">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                        {formatCurrency(recommendation.estimatedPrice)}
                      </div>
                    )}
                  </div>
                  
                  {recommendation.features && recommendation.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {recommendation.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs border-gray-200">
                          {feature}
                        </Badge>
                      ))}
                      {recommendation.features.length > 3 && (
                        <Badge variant="outline" className="text-xs border-gray-200">
                          +{recommendation.features.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 