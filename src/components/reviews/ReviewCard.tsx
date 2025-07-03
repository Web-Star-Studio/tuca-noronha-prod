"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingDisplay, DetailedRating } from "./RatingStars";
import { useVoteOnReview } from "@/lib/hooks/useCreateReview";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ReviewWithUser } from "@/lib/hooks/useReviews";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Calendar, 
  Users, 
  CheckCircle,
  MoreVertical,
  Flag
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReviewCardProps {
  review: ReviewWithUser;
  className?: string;
  showDetailedRatings?: boolean;
  compact?: boolean;
}

export function ReviewCard({
  review,
  className,
  showDetailedRatings = true,
  compact = false
}: ReviewCardProps) {
  const { user } = useCurrentUser();
  const { voteOnReview, isVoting } = useVoteOnReview();
  const [userVote, setUserVote] = useState<"helpful" | "unhelpful" | null>(null);

  const handleVote = async (voteType: "helpful" | "unhelpful") => {
    if (!user) return;

    try {
      await voteOnReview(
        review._id,
        user._id as Id<"users">,
        voteType
      );
      setUserVote(voteType);
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR
    });
  };

  const getGroupTypeLabel = (groupType?: string) => {
    const labels: Record<string, string> = {
      solo: "Solo",
      couple: "Casal",
      family: "Família",
      friends: "Amigos",
      business: "Negócios"
    };
    return groupType ? labels[groupType] || groupType : null;
  };

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
      <div className={cn("border-b border-gray-100 pb-4 last:border-b-0", className)}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={review.user?.image} />
            <AvatarFallback>
              {review.user?.name.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{review.user?.name || "Usuário"}</span>
              <RatingDisplay rating={review.rating} size="sm" showCount={false} />
              {review.isVerified && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </div>
            
            <h4 className="font-medium text-sm mb-1">{review.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{formatDate(review.createdAt)}</span>
              {review.helpfulVotes > 0 && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {review.helpfulVotes}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.user?.image} />
                <AvatarFallback>
                  {review.user?.name.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{review.user?.name || "Usuário"}</span>
                  {review.isVerified && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{formatDate(review.createdAt)}</span>
                  {review.visitDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Visitou em {new Date(review.visitDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {getGroupTypeLabel(review.groupType) && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{getGroupTypeLabel(review.groupType)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Reportar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4">
            <RatingDisplay rating={review.rating} size="md" showCount={false} />
            {review.wouldRecommend && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <ThumbsUp className="h-3 w-3 mr-1" />
                Recomenda
              </Badge>
            )}
          </div>

          {/* Title and Comment */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{review.title}</h3>
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          </div>

          {/* Detailed Ratings */}
          {showDetailedRatings && review.detailedRatings && Object.keys(review.detailedRatings).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900">Avaliações Detalhadas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(review.detailedRatings).map(([key, rating]) => (
                  rating !== undefined && (
                    <DetailedRating
                      key={key}
                      label={ratingLabels[key] || key}
                      rating={rating}
                      className="text-sm"
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {review.photos && review.photos.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Fotos</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {review.photos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1} da review`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("helpful")}
                disabled={isVoting || !user}
                className={cn(
                  "flex items-center gap-2",
                  userVote === "helpful" && "text-green-600 bg-green-50"
                )}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Útil ({review.helpfulVotes})</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote("unhelpful")}
                disabled={isVoting || !user}
                className={cn(
                  "flex items-center gap-2",
                  userVote === "unhelpful" && "text-red-600 bg-red-50"
                )}
              >
                <ThumbsDown className="h-4 w-4" />
                <span>Não útil ({review.unhelpfulVotes})</span>
              </Button>
            </div>

            {!user && (
              <span className="text-xs text-gray-500">
                Faça login para votar
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 