"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, MessageSquare, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface ReviewsStatsCardsProps {
  stats: any;
}

export function ReviewsStatsCards({ stats }: ReviewsStatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const trendPercentage = stats.recentTrend.lastWeek > 0 
    ? ((stats.recentTrend.thisWeek - stats.recentTrend.lastWeek) / stats.recentTrend.lastWeek) * 100
    : stats.recentTrend.thisWeek > 0 ? 100 : 0;

  const approvalRate = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Reviews</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {trendPercentage >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trendPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
              {trendPercentage >= 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
            </span>
            <span>vs semana passada</span>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Aprovadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approved.toLocaleString()}</div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>{approvalRate.toFixed(1)}% aprovação</span>
            <Badge variant="secondary" className="text-xs">
              {stats.pending} pendentes
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Pendentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.pending.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Aguardando moderação
          </p>
        </CardContent>
      </Card>

      {/* Avaliação Média */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(stats.averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Baseado em {stats.total} avaliações
          </p>
        </CardContent>
      </Card>

      {/* Distribuição por Rating - Card Adicional */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Distribuição por Rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(stats.byRating)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([rating, count]) => {
              const percentage = stats.total > 0 ? (Number(count) / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-12">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <div className="flex items-center space-x-2 w-20 text-sm text-muted-foreground">
                    <span>{count}</span>
                    <span>({percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Distribuição por Tipo de Asset */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Por Tipo de Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats.byAssetType).map(([type, count]) => {
              const percentage = stats.total > 0 ? (Number(count) / stats.total) * 100 : 0;
              const getAssetTypeLabel = (type: string) => {
                const labels = {
                  restaurant: "Restaurantes",
                  accommodation: "Hospedagens", 
                  activity: "Atividades",
                  event: "Eventos",
                  vehicle: "Veículos",
                  package: "Pacotes"
                };
                return labels[type as keyof typeof labels] || type;
              };

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {getAssetTypeLabel(type)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% do total
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 