"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ReviewStats,
  QuickStats,
  ReviewsList,
  ReviewForm,
  RatingStars,
  useReviewStats,
  useReviews
} from "@/components/reviews";

export function ReviewSystemExample() {
  const [selectedItem, setSelectedItem] = useState({
    type: "restaurant",
    id: "example-restaurant-id"
  });

  const { data: reviewStats } = useReviewStats({
    assetType: selectedItem.type,
    assetId: selectedItem.id,
  });
  const { reviews, isLoading } = useReviews({
    itemType: selectedItem.type,
    itemId: selectedItem.id,
    limit: 5
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Sistema de Avaliações - Exemplos</h1>
        <p className="text-gray-600">
          Demonstração completa do sistema real de avaliações implementado
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="form">Formulário</TabsTrigger>
          <TabsTrigger value="integration">Integração</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewStats
                totalReviews={reviewStats?.totalReviews}
                averageRating={reviewStats?.averageRating}
                ratingDistribution={reviewStats?.ratingDistribution}
                recommendationPercentage={reviewStats?.recommendationPercentage}
                detailedAverages={reviewStats?.detailedAverages}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsList
                itemType={selectedItem.type}
                itemId={selectedItem.id}
                maxReviews={3}
                compact
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Componente QuickStats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Tamanho Pequeno</h4>
                  <QuickStats
                    averageRating={4.3}
                    totalReviews={127}
                    recommendationPercentage={89}
                    size="sm"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tamanho Médio</h4>
                  <QuickStats
                    averageRating={4.3}
                    totalReviews={127}
                    recommendationPercentage={89}
                    size="md"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tamanho Grande</h4>
                  <QuickStats
                    averageRating={4.3}
                    totalReviews={127}
                    recommendationPercentage={89}
                    size="lg"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Componente RatingStars</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Apenas Exibição</h4>
                  <RatingStars rating={4.5} showValue precision="half" />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Interativo</h4>
                  <RatingStars 
                    rating={0} 
                    interactive 
                    onChange={(rating) => console.log('Rating:', rating)}
                    showValue
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tamanhos Diferentes</h4>
                  <div className="space-y-2">
                    <RatingStars rating={4} size="sm" showValue />
                    <RatingStars rating={4} size="md" showValue />
                    <RatingStars rating={4} size="lg" showValue />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ReviewStats Compacto</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewStats
                totalReviews={reviewStats?.totalReviews}
                averageRating={reviewStats?.averageRating}
                ratingDistribution={reviewStats?.ratingDistribution}
                recommendationPercentage={reviewStats?.recommendationPercentage}
                detailedAverages={reviewStats?.detailedAverages}
                compact
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Tab */}
        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Formulário de Avaliação</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm
                itemType={selectedItem.type}
                itemId={selectedItem.id}
                onSuccess={() => console.log('Review submitted!')}
                onCancel={() => console.log('Review cancelled')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Como Integrar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Importar os Hooks</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { useReviewStats, useReviews } from "@/lib/hooks/useReviews";`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">2. Usar os Hooks no Componente</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const { data: reviewStats } = useReviewStats({
  assetType: "restaurant",
  assetId: restaurantId,
});
const { reviews, isLoading } = useReviews({
  itemType: "restaurant",
  itemId: restaurantId,
  limit: 10
});`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">3. Renderizar os Componentes</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<ReviewStats
  totalReviews={reviewStats?.totalReviews}
  averageRating={reviewStats?.averageRating}
  ratingDistribution={reviewStats?.ratingDistribution}
  recommendationPercentage={reviewStats?.recommendationPercentage}
  detailedAverages={reviewStats?.detailedAverages}
/>

<ReviewsList
  itemType="restaurant"
  itemId={restaurantId}
  showCreateForm={true}
/>`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">4. Tipos de Item Suportados</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li><code>restaurant</code> - Restaurantes</li>
                  <li><code>accommodation</code> - Hospedagens</li>
                  <li><code>activity</code> - Atividades</li>
                  <li><code>event</code> - Eventos</li>
                  <li><code>vehicle</code> - Veículos</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">5. Ratings Detalhados por Tipo</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Restaurantes:</strong> food, service, location (ambiente), value</p>
                  <p><strong>Hospedagens:</strong> cleanliness, location, service, value</p>
                  <p><strong>Atividades:</strong> organization, guide, value</p>
                  <p><strong>Eventos:</strong> organization, value</p>
                  <p><strong>Veículos:</strong> cleanliness (condição), service, value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status da Implementação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Implementado</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Sistema completo de reviews no backend</li>
                    <li>Hooks personalizados para React</li>
                    <li>Componentes UI reutilizáveis</li>
                    <li>Formulário de criação de reviews</li>
                    <li>Sistema de votos úteis/não úteis</li>
                    <li>Validações client e server-side</li>
                    <li>Atualização automática de ratings</li>
                    <li>Suporte a ratings detalhados</li>
                    <li>Integração com autenticação</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">🔄 Próximos Passos</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Integrar em todas as páginas de produto</li>
                    <li>Implementar upload de fotos</li>
                    <li>Sistema de moderação avançado</li>
                    <li>Notificações para partners</li>
                    <li>Analytics de reviews</li>
                    <li>Cache otimizado</li>
                    <li>SEO com rich snippets</li>
                    <li>Gamificação para reviewers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 