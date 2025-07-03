"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { useReviews } from "@/lib/hooks/useReviews";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserReview } from "@/lib/hooks/useReviews";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  Plus, 
  Filter,
  ChevronDown,
  Star,
  Users
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ReviewsListProps {
  itemType: string;
  itemId: string;
  className?: string;
  showCreateForm?: boolean;
  compact?: boolean;
  maxReviews?: number;
}

export function ReviewsList({
  itemType,
  itemId,
  className,
  showCreateForm = true,
  compact = false,
  maxReviews
}: ReviewsListProps) {
  const { user } = useCurrentUser();
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating_high" | "rating_low" | "helpful">("newest");
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const limit = maxReviews || 10;
  const offset = page * limit;

  const { reviews, total, hasMore, isLoading } = useReviews({
    itemType,
    itemId,
    limit,
    offset,
    sortBy
  });

  const { hasReviewed } = useUserReview(
    user?._id || ("" as any),
    itemType,
    itemId
  );

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as any);
    setPage(0); // Reset to first page when sorting changes
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setPage(0); // Reset to first page to see new review
  };

  const sortOptions = [
    { value: "newest", label: "Mais recentes" },
    { value: "oldest", label: "Mais antigas" },
    { value: "rating_high", label: "Maior avaliação" },
    { value: "rating_low", label: "Menor avaliação" },
    { value: "helpful", label: "Mais úteis" }
  ];

  if (compact) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            Avaliações {total > 0 && `(${total})`}
          </h3>
          
          {showCreateForm && user && !hasReviewed && (
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Avaliar
            </Button>
          )}
        </div>

        {/* Create Form */}
        {showForm && (
          <ReviewForm
            itemType={itemType}
            itemId={itemId}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Reviews */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            reviews.slice(0, maxReviews || reviews.length).map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                compact
                showDetailedRatings={false}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Ainda não há avaliações</p>
              <p className="text-sm">Seja o primeiro a compartilhar sua experiência!</p>
            </div>
          )}
        </div>

        {/* Show more button */}
        {hasMore && !maxReviews && (
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Carregando..." : "Ver mais avaliações"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Avaliações dos Clientes
              {total > 0 && (
                <span className="text-base font-normal text-gray-500">
                  ({total} {total === 1 ? 'avaliação' : 'avaliações'})
                </span>
              )}
            </CardTitle>

            {showCreateForm && user && !hasReviewed && (
              <Button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Escrever Avaliação
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Filters */}
        {total > 0 && (
          <CardContent className="pt-0">
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros e Ordenação
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Ordenar por:</span>
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}
      </Card>

      {/* Create Form */}
      {showForm && (
        <ReviewForm
          itemType={itemType}
          itemId={itemId}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Reviews */}
      <div className="space-y-6">
        {isLoading && page === 0 ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              showDetailedRatings={true}
            />
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">Ainda não há avaliações</h3>
                <p className="text-gray-500 mb-6">
                  Seja o primeiro a compartilhar sua experiência com outros viajantes!
                </p>
                {showCreateForm && user && !hasReviewed && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Escrever a Primeira Avaliação
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? "Carregando..." : "Carregar Mais Avaliações"}
          </Button>
        </div>
      )}

      {/* User hasn't reviewed yet notice */}
      {showCreateForm && user && !hasReviewed && !showForm && total > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Compartilhe sua experiência</h4>
                <p className="text-sm text-blue-700">
                  Ajude outros viajantes contando como foi sua experiência
                </p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Avaliar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 