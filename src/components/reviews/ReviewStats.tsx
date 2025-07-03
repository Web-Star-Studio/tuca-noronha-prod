"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RatingDisplay, DetailedRating } from "./RatingStars";
import { cn } from "@/lib/utils";
import { ThumbsUp, TrendingUp, Users } from "lucide-react";

interface ReviewStatsProps {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  recommendationPercentage: number;
  detailedAverages?: Record<string, number>;
  className?: string;
  compact?: boolean;
}

export function ReviewStats({
  totalReviews,
  averageRating,
  ratingDistribution,
  recommendationPercentage,
  detailedAverages = {},
  className,
  compact = false
}: ReviewStatsProps) {
  const ratingLabels: Record<string, string> = {
    food: "Comida",
    service: "Serviço", 
    ambience: "Ambiente",
    value: "Custo-benefício",
    cleanliness: "Limpeza",
    location: "Localização",
    organization: "Organização",
    guide: "Guia",
    condition: "Condição"
  };

  if (compact) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <RatingDisplay 
            rating={averageRating} 
            totalReviews={totalReviews}
            size="md"
          />
          {recommendationPercentage > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <ThumbsUp className="h-4 w-4" />
              <span>{recommendationPercentage}% recomendam</span>
            </div>
          )}
        </div>

        {Object.keys(detailedAverages).length > 0 && (
          <div className="space-y-2">
            {Object.entries(detailedAverages).map(([key, rating]) => (
              <DetailedRating
                key={key}
                label={ratingLabels[key] || key}
                rating={rating}
                className="text-xs"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Avaliações dos Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Overview */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {averageRating.toFixed(1)}
            </div>
            <RatingDisplay 
              rating={averageRating} 
              totalReviews={totalReviews}
              size="md"
              showCount={false}
            />
            <div className="text-sm text-gray-500 mt-1">
              {totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDistribution[stars] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-right">{stars}★</span>
                  <Progress 
                    value={percentage} 
                    className="flex-1 h-2" 
                  />
                  <span className="w-8 text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendation Percentage */}
        {recommendationPercentage > 0 && (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                Recomendação dos clientes
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-green-600">
                {recommendationPercentage}%
              </span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
        )}

        {/* Detailed Ratings */}
        {Object.keys(detailedAverages).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Avaliações Detalhadas</h4>
            <div className="space-y-3">
              {Object.entries(detailedAverages).map(([key, rating]) => (
                <DetailedRating
                  key={key}
                  label={ratingLabels[key] || key}
                  rating={rating}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Reviews State */}
        {totalReviews === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Ainda não há avaliações</p>
            <p className="text-sm">Seja o primeiro a avaliar este item!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickStatsProps {
  averageRating: number;
  totalReviews?: number;
  recommendationPercentage?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function QuickStats({
  averageRating,
  totalReviews,
  recommendationPercentage,
  className,
  size = "md"
}: QuickStatsProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-base"
  };

  return (
    <div className={cn("flex items-center gap-3", sizeClasses[size], className)}>
      <RatingDisplay 
        rating={averageRating}
        totalReviews={totalReviews}
        size={size}
      />
      
      {recommendationPercentage !== undefined && recommendationPercentage > 0 && (
        <>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1 text-green-600">
            <ThumbsUp className="h-3 w-3" />
            <span>{recommendationPercentage}%</span>
          </div>
        </>
      )}
    </div>
  );
} 