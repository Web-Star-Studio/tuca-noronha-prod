"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Target, MapPin, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cardStyles, buttonStyles } from '@/lib/ui-config';
import { cn } from '@/lib/utils';
import { useAIRecommendations } from '@/lib/hooks/useAIRecommendations';
import { useConvexPreferences } from '@/lib/hooks/useConvexPreferences';

export default function AIRecommendationsSection() {
  const { preferences } = useConvexPreferences();
  const { 
    recommendations, 
    isLoading, 
    personalizedMessage, 
    processingTime,
    isUsingAI,
    generateRecommendations 
  } = useAIRecommendations();

  useEffect(() => {
    if (preferences && recommendations.length === 0 && !isLoading) {
      handleGenerateRecommendations();
    }
  }, [preferences]);

  const handleGenerateRecommendations = async () => {
    if (!preferences) return;
    try {
      await generateRecommendations(preferences, undefined, 6);
    } catch (err) {
      console.error('Erro ao gerar recomendações:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!preferences) {
    return (
      <Card className={cardStyles.base}>
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Complete sua personalização
          </h3>
          <p className="text-gray-600 mb-6">
            Para receber recomendações inteligentes, complete seu perfil
          </p>
          <Button className={buttonStyles.variant.gradient}>
            Criar Perfil
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {isUsingAI ? 'IA OpenAI analisando seu perfil...' : 'Criando suas recomendações...'}
        </h3>
        <p className="text-gray-600">
          {isUsingAI 
            ? 'Aguarde enquanto o GPT-4 cria recomendações personalizadas' 
            : 'Processando com algoritmo inteligente'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="mr-3 h-6 w-6 text-blue-500" />
            Recomendações Inteligentes
          </h2>
          <p className="text-gray-600 mt-1">
            Sugestões personalizadas baseadas no seu perfil
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleGenerateRecommendations}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {personalizedMessage && (
        <div className={cn(
          "p-4 rounded-lg border",
          isUsingAI 
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" 
            : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
        )}>
          <div className="flex items-center justify-between">
            <p className={cn(
              "font-medium flex items-center",
              isUsingAI ? "text-green-800" : "text-blue-800"
            )}>
              {isUsingAI ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  {personalizedMessage}
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  {personalizedMessage}
                </>
              )}
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              {isUsingAI && <Badge className="bg-green-100 text-green-700">🤖 IA Ativa</Badge>}
              {processingTime > 0 && (
                <span className="text-gray-500">{processingTime}ms</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((recommendation, index) => (
          <motion.div
            key={recommendation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(cardStyles.base, cardStyles.hover.lift)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {recommendation.title}
                    </h3>
                    <p className="text-sm text-gray-600">{recommendation.category}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <Target className="h-3 w-3 mr-1" />
                    {recommendation.matchScore}%
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-gray-700 text-sm">{recommendation.description}</p>
                
                                 <div className="space-y-3">
                   <div className="flex items-start space-x-2">
                     {recommendation.aiGenerated ? (
                       <Sparkles className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                     ) : (
                       <Target className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                     )}
                     <p className={cn(
                       "text-xs italic flex-1",
                       recommendation.aiGenerated ? "text-green-600" : "text-blue-600"
                     )}>
                       {recommendation.reasoning}
                     </p>
                   </div>
                   
                   {recommendation.aiInsights && recommendation.aiInsights.length > 0 && (
                     <div className="space-y-1">
                       <p className="text-xs font-medium text-green-700">💡 Insights IA:</p>
                       {recommendation.aiInsights.slice(0, 2).map((insight, idx) => (
                         <p key={idx} className="text-xs text-green-600 pl-4">• {insight}</p>
                       ))}
                     </div>
                   )}
                   
                   <div className="space-y-1">
                     {recommendation.location && (
                       <div className="flex items-center text-sm text-gray-600">
                         <MapPin className="h-4 w-4 mr-2" />
                         {recommendation.location}
                       </div>
                     )}
                     
                     {recommendation.estimatedPrice && (
                       <div className="flex items-center text-sm text-green-600">
                         <DollarSign className="h-4 w-4 mr-2" />
                         {formatCurrency(recommendation.estimatedPrice)}
                       </div>
                     )}
                   </div>
                 </div>
                
                {recommendation.features && (
                  <div className="flex flex-wrap gap-1">
                    {recommendation.features.slice(0, 3).map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 