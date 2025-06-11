"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Star, MapPin, DollarSign, Clock, Users, 
  Heart, Filter, RefreshCw, TrendingUp, Target, Zap,
  BedDouble, Utensils, Activity, Camera, Compass, Database,
  CheckCircle, AlertCircle, Wifi, WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cardStyles, buttonStyles, ui } from '@/lib/ui-config';
import { cn } from '@/lib/utils';
import { useAIRecommendations } from '@/lib/hooks/useAIRecommendations';
import { useConvexPreferences } from '@/lib/hooks/useConvexPreferences';
import RecommendationsDebug from './debug/RecommendationsDebug';

interface AIRecommendation {
  id: string;
  type: 'accommodation' | 'activity' | 'restaurant' | 'experience';
  title: string;
  description: string;
  reasoning: string;
  matchScore: number;
  category: string;
  priceRange: string;
  features: string[];
  location?: string;
  estimatedPrice?: number;
  // Campos dos assets reais
  partnerId?: string;
  partnerName?: string;
  rating?: number;
  tags?: string[];
  isActive?: boolean;
  // Campos para verificar dados reais
  hasRealPrice?: boolean;
  hasRealRating?: boolean;
  realPrice?: number | null;
  realRating?: number | null;
  aiGenerated?: boolean;
  aiInsights?: string[];
  personalizedTips?: string[];
}

interface AIRecommendationsProps {
  className?: string;
}

const categoryIcons = {
  accommodation: BedDouble,
  activity: Activity,
  restaurant: Utensils,
  experience: Camera
};

const categoryLabels = {
  accommodation: 'Hospedagens',
  activity: 'Atividades',
  restaurant: 'Restaurantes',
  experience: 'Experiências'
};

const priceRangeColors = {
  economico: 'bg-green-100 text-green-800 border-green-200',
  medio: 'bg-blue-100 text-blue-800 border-blue-200',
  premium: 'bg-purple-100 text-purple-800 border-purple-200',
  luxo: 'bg-amber-100 text-amber-800 border-amber-200'
};

const priceRangeLabels = {
  economico: 'Econômico',
  medio: 'Médio',
  premium: 'Premium',
  luxo: 'Luxo'
};

export default function AIRecommendations({ className }: AIRecommendationsProps) {
  const { preferences } = useConvexPreferences();
  const { 
    recommendations, 
    isLoading, 
    error, 
    personalizedMessage,
    isUsingAI, 
    generateRecommendations,
    clearRecommendations,
    assetsStats
  } = useAIRecommendations();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filtrar recomendações por categoria
  const filteredRecommendations = activeCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.type === activeCategory);

  // Calcular estatísticas
  const stats = {
    total: recommendations.length,
    avgScore: recommendations.length > 0 
      ? Math.round(recommendations.reduce((acc, rec) => acc + rec.matchScore, 0) / recommendations.length)
      : 0,
    categories: Object.keys(categoryLabels).map(cat => ({
      type: cat,
      count: recommendations.filter(rec => rec.type === cat).length
    })),
    realDataCount: recommendations.filter(rec => rec.partnerId).length,
    aiEnhanced: recommendations.filter(rec => rec.aiGenerated).length
  };

  // Gerar recomendações iniciais
  useEffect(() => {
    if (preferences && recommendations.length === 0 && !isLoading && assetsStats?.hasRealData) {
      handleGenerateRecommendations();
    }
  }, [preferences, assetsStats?.hasRealData]);

  const handleGenerateRecommendations = async (category?: string) => {
    if (!preferences) return;

    setIsGenerating(true);
    try {
      await generateRecommendations(preferences, category, 8);
    } catch (err) {
      console.error('Erro ao gerar recomendações:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Status dos dados reais
  const renderDataStatus = () => (
    <Card className={cn(cardStyles.base, "mb-4")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              assetsStats?.hasRealData ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
            )}>
              {assetsStats?.hasRealData ? <Database className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {assetsStats?.hasRealData ? 'Dados Reais Conectados' : 'Aguardando Dados'}
              </h3>
              <p className="text-sm text-gray-600">
                {assetsStats?.hasRealData 
                  ? `${assetsStats.total} assets disponíveis no sistema`
                  : 'Conectando com banco de dados...'
                }
              </p>
            </div>
          </div>
          
          {assetsStats?.hasRealData && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                {stats.realDataCount} Reais
              </Badge>
              {stats.aiEnhanced > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {stats.aiEnhanced} IA
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderRecommendationCard = (recommendation: AIRecommendation, index: number) => {
    const CategoryIcon = categoryIcons[recommendation.type];
    
    return (
      <motion.div
        key={recommendation.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        className="h-full"
      >
        <Card className={cn(cardStyles.base, cardStyles.hover.lift, "h-full")}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  recommendation.matchScore >= 80 ? "bg-green-100 text-green-600" :
                  recommendation.matchScore >= 60 ? "bg-blue-100 text-blue-600" :
                  "bg-orange-100 text-orange-600"
                )}>
                  <CategoryIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                    {recommendation.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {recommendation.category}
                  </p>
                  {recommendation.partnerName && (
                    <p className="text-xs text-green-600 mt-1">
                      por {recommendation.partnerName}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <Badge className={cn("text-xs px-2 py-1", getScoreColor(recommendation.matchScore))}>
                  <Target className="h-3 w-3 mr-1" />
                  {recommendation.matchScore}%
                </Badge>
                
                {recommendation.hasRealRating && recommendation.realRating && recommendation.realRating > 0 && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium text-gray-700">{recommendation.realRating.toFixed(1)}</span>
                  </div>
                )}
                
                {(!recommendation.hasRealRating || !recommendation.realRating) && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-gray-300" />
                    <span className="text-xs text-gray-400">Sem avaliação</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-700 text-sm">{recommendation.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {recommendation.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{recommendation.location}</span>
                  </div>
                )}
                
                <Badge className={cn("text-xs", priceRangeColors[recommendation.priceRange as keyof typeof priceRangeColors])}>
                  {priceRangeLabels[recommendation.priceRange as keyof typeof priceRangeLabels]}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-gray-400" />
                <span className={cn(
                  "text-sm font-semibold",
                  recommendation.hasRealPrice && recommendation.realPrice ? "text-gray-900" : "text-gray-500"
                )}>
                  {recommendation.hasRealPrice && recommendation.realPrice ? 
                    formatCurrency(recommendation.realPrice) : 
                    'Preço sob consulta'
                  }
                </span>
              </div>
            </div>

            {/* Features */}
            {recommendation.features && recommendation.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Características:</p>
                <div className="flex flex-wrap gap-1">
                  {recommendation.features.slice(0, 3).map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {recommendation.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{recommendation.features.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* AI Insights */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                {recommendation.aiGenerated ? (
                  <Sparkles className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Database className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
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
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Database className="w-12 h-12 text-blue-500 mx-auto mb-4" />
      </motion.div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {assetsStats?.hasRealData 
          ? (isGenerating ? 'Processando recomendações...' : 'Carregando dados reais...')
          : 'Conectando com banco de dados...'
        }
      </h3>
      <p className="text-gray-600">
        {assetsStats?.hasRealData 
          ? 'Analisando assets disponíveis no sistema'
          : 'Aguarde enquanto buscamos os assets disponíveis'
        }
      </p>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Compass className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Nenhuma recomendação encontrada
      </h3>
      <p className="text-gray-600 mb-6">
        {assetsStats?.hasRealData 
          ? 'Complete seu perfil de personalização para receber sugestões baseadas em dados reais'
          : 'Aguardando conexão com banco de dados...'
        }
      </p>
      {assetsStats?.hasRealData && (
        <Button 
          onClick={() => handleGenerateRecommendations()}
          className={buttonStyles.variant.gradient}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Gerar Recomendações
        </Button>
      )}
    </div>
  );

  if (!preferences) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className={cardStyles.base}>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Complete sua personalização
            </h3>
            <p className="text-gray-600 mb-6">
              Para receber recomendações inteligentes, primeiro complete seu perfil de viajante
            </p>
            <Button className={buttonStyles.variant.gradient}>
              <Sparkles className="mr-2 h-4 w-4" />
              Criar Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Status dos dados */}
      {renderDataStatus()}

      {/* Debug temporário */}
      {recommendations.length > 0 && (
        <RecommendationsDebug 
          recommendations={recommendations}
          isUsingAI={isUsingAI}
          className="mb-6"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recomendações Inteligentes</h2>
          {personalizedMessage && (
            <p className="text-gray-600 mt-1">{personalizedMessage}</p>
          )}
        </div>
        <Button 
          onClick={() => handleGenerateRecommendations(activeCategory === 'all' ? undefined : activeCategory)}
          disabled={isLoading || isGenerating || !assetsStats?.hasRealData}
          className={buttonStyles.variant.outline}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.avgScore}%</div>
              <p className="text-sm text-gray-600">Compatibilidade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.realDataCount}</div>
              <p className="text-sm text-gray-600">Assets Reais</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.aiEnhanced}</div>
              <p className="text-sm text-gray-600">IA Enhanced</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading || isGenerating ? (
        renderLoadingState()
      ) : recommendations.length === 0 ? (
        renderEmptyState()
      ) : (
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Todas</span>
            </TabsTrigger>
            {Object.entries(categoryLabels).map(([key, label]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons];
              const count = stats.categories.find(cat => cat.type === key)?.count || 0;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeCategory} className="space-y-4">
            {filteredRecommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredRecommendations.map((recommendation, index) => 
                    renderRecommendationCard(recommendation, index)
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma recomendação nesta categoria
                </h3>
                <p className="text-gray-600">
                  Tente selecionar outra categoria ou gere novas recomendações
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 